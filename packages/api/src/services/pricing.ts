/**
 * Pricing engine — the single source of order economics.
 *
 * Three modes (all support discounts and produce cost/profit):
 *   PRESET      price uses each filament's stored sellRatePerGram.
 *   DIRECT_RATE admin enters a per-gram rate per line: (grams * rate) * qty.
 *   MANUAL      admin enters the final total; requires the override password.
 *
 * Optional add-ons (PRESET/DIRECT_RATE): machine time (printHours * machineRate)
 * per line, an order-level labor fee, and a margin %. Discounts (a code or a
 * manual percent/flat) apply to the subtotal of every mode.
 *
 * All math is in integer minor units (paise). UI passes major units (rupees);
 * services convert at the boundary.
 */
import { prisma } from "@workshop/db";
import { errors, round2, toMinor, clampNonNegative, type PricingMode } from "@workshop/core";
import type { OrderCreateInput, OrderItemInput } from "@workshop/validators";
import { getPricingSettings, verifyOverridePassword } from "./settings.js";

export interface PricedItem {
  name: string;
  filamentId?: string;
  gramsPerUnit: number;
  qty: number;
  printHours: number;
  ratePerGram: number; // minor units actually used (0 in MANUAL)
  lineCost: number; // minor units
  linePrice: number; // minor units
}

export interface PricingResult {
  mode: PricingMode;
  items: PricedItem[];
  subtotal: number; // minor units, before discount
  discountType: "PERCENT" | "FLAT" | null;
  discountValue: number; // percent*100 or flat minor units
  discountCodeId: string | null;
  discountAmount: number; // minor units actually applied
  total: number; // minor units
  costTotal: number; // minor units
  profit: number; // minor units
  overrideUsed: boolean;
}

type PricingInput = Pick<OrderCreateInput, "items" | "pricing">;

async function loadFilaments(items: OrderItemInput[]) {
  const ids = [...new Set(items.map((i) => i.filamentId).filter(Boolean) as string[])];
  if (ids.length === 0) return new Map<string, { sellRatePerGram: number; costPerGram: number }>();
  const rows = await prisma.filament.findMany({
    where: { id: { in: ids } },
    select: { id: true, sellRatePerGram: true, costPerGram: true },
  });
  return new Map(rows.map((r) => [r.id, { sellRatePerGram: r.sellRatePerGram, costPerGram: r.costPerGram }]));
}

async function resolveCodeDiscount(code: string, subtotal: number) {
  const dc = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } });
  if (!dc || !dc.active || dc.deletedAt) throw errors.validation("Invalid or inactive discount code");
  const now = new Date();
  if (dc.startsAt && dc.startsAt > now) throw errors.validation("Discount code not yet active");
  if (dc.endsAt && dc.endsAt < now) throw errors.validation("Discount code has expired");
  if (dc.maxUses != null && dc.usedCount >= dc.maxUses) throw errors.validation("Discount code usage limit reached");

  const amount =
    dc.type === "PERCENT"
      ? Math.round((subtotal * dc.value) / 10000) // value = percent*100
      : dc.value; // flat minor units
  return {
    discountCodeId: dc.id,
    discountType: dc.type as "PERCENT" | "FLAT",
    discountValue: dc.value,
    discountAmount: clampNonNegative(Math.min(amount, subtotal)),
  };
}

function resolveManualDiscount(
  type: "PERCENT" | "FLAT",
  value: number,
  subtotal: number,
) {
  const amount = type === "PERCENT" ? Math.round((subtotal * value) / 100) : toMinor(value);
  return {
    discountCodeId: null,
    discountType: type,
    discountValue: type === "PERCENT" ? Math.round(value * 100) : toMinor(value),
    discountAmount: clampNonNegative(Math.min(amount, subtotal)),
  };
}

export async function computePricing(
  input: PricingInput,
  opts: { enforceOverride: boolean },
): Promise<PricingResult> {
  const { items, pricing } = input;
  const settings = await getPricingSettings();
  const filaments = await loadFilaments(items);

  // 1) Per-line cost + (for non-manual) per-line price.
  const priced: PricedItem[] = items.map((it) => {
    const grams = round2(it.gramsPerUnit * it.qty);
    const fil = it.filamentId ? filaments.get(it.filamentId) : undefined;
    const lineCost = Math.round(grams * (fil?.costPerGram ?? 0));

    let ratePerGram = 0;
    if (pricing.mode === "PRESET") ratePerGram = fil?.sellRatePerGram ?? 0;
    else if (pricing.mode === "DIRECT_RATE") ratePerGram = toMinor(it.directRatePerGram ?? 0);

    const material = pricing.mode === "MANUAL" ? 0 : Math.round(grams * ratePerGram);
    const machine = pricing.applyMachineTime
      ? Math.round(it.printHours * settings.machineRatePerHour)
      : 0;

    return {
      name: it.name,
      filamentId: it.filamentId,
      gramsPerUnit: it.gramsPerUnit,
      qty: it.qty,
      printHours: it.printHours,
      ratePerGram,
      lineCost,
      linePrice: material + machine,
    };
  });

  const costTotal = priced.reduce((s, p) => s + p.lineCost, 0);

  // 2) Subtotal per mode.
  let subtotal: number;
  let overrideUsed = false;

  if (pricing.mode === "MANUAL") {
    if (pricing.manualTotal == null) throw errors.pricing("Manual total is required for manual mode");
    if (opts.enforceOverride) {
      const ok = pricing.overridePassword
        ? await verifyOverridePassword(pricing.overridePassword)
        : false;
      if (!ok) throw errors.forbidden("Invalid override password");
    }
    overrideUsed = true;
    subtotal = toMinor(pricing.manualTotal);
    // Distribute the manual subtotal across lines proportional to grams.
    const totalGrams = priced.reduce((s, p) => s + p.gramsPerUnit * p.qty, 0);
    let allocated = 0;
    priced.forEach((p, idx) => {
      if (idx === priced.length - 1) p.linePrice = subtotal - allocated;
      else {
        const share = totalGrams > 0 ? (p.gramsPerUnit * p.qty) / totalGrams : 1 / priced.length;
        p.linePrice = Math.round(subtotal * share);
        allocated += p.linePrice;
      }
    });
  } else {
    const base = priced.reduce((s, p) => s + p.linePrice, 0);
    const labor = toMinor(pricing.laborFee ?? 0);
    const withLabor = base + labor;
    const margin = pricing.marginPercent ?? 0;
    subtotal = Math.round(withLabor * (1 + margin / 100));
  }

  // 3) Discounts (apply to every mode).
  let discount = {
    discountCodeId: null as string | null,
    discountType: null as "PERCENT" | "FLAT" | null,
    discountValue: 0,
    discountAmount: 0,
  };
  if (pricing.discountCode) {
    discount = await resolveCodeDiscount(pricing.discountCode, subtotal);
  } else if (pricing.manualDiscountType && pricing.manualDiscountValue) {
    discount = resolveManualDiscount(pricing.manualDiscountType, pricing.manualDiscountValue, subtotal);
  }

  const total = clampNonNegative(subtotal - discount.discountAmount);
  const profit = total - costTotal;

  return {
    mode: pricing.mode,
    items: priced,
    subtotal,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountCodeId: discount.discountCodeId,
    discountAmount: discount.discountAmount,
    total,
    costTotal,
    profit,
    overrideUsed,
  };
}
