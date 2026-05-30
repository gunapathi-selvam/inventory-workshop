/**
 * Stock service — the only place filament weight changes. Records a
 * StockMovement for every change (full history) and raises a low-stock
 * notification when a filament crosses its threshold.
 */
import { prisma, type PrismaTx } from "@workshop/db";
import { errors } from "@workshop/core";
import { emitNotification, getAlertRecipientIds } from "./notifications.js";

interface OrderConsumption {
  filamentId: string | null;
  grams: number; // total grams for the line (gramsPerUnit * qty)
}

/** Decrement filament for a confirmed order. Throws if any line is short. */
export async function applyOrderStock(
  tx: PrismaTx,
  orderId: string,
  consumption: OrderConsumption[],
  userId: string | null,
): Promise<void> {
  // Aggregate per filament.
  const byFilament = new Map<string, number>();
  for (const c of consumption) {
    if (!c.filamentId || c.grams <= 0) continue;
    byFilament.set(c.filamentId, (byFilament.get(c.filamentId) ?? 0) + c.grams);
  }

  for (const [filamentId, grams] of byFilament) {
    const fil = await tx.filament.findUnique({ where: { id: filamentId } });
    if (!fil) throw errors.notFound("Filament");
    if (fil.weightRemainingG < grams) {
      throw errors.stock(
        `Not enough ${fil.type} ${fil.color}: need ${grams}g, have ${fil.weightRemainingG}g`,
        { filamentId, need: grams, have: fil.weightRemainingG },
      );
    }
    const updated = await tx.filament.update({
      where: { id: filamentId },
      data: { weightRemainingG: { decrement: grams } },
    });
    await tx.stockMovement.create({
      data: { filamentId, deltaG: -grams, reason: "ORDER", orderId, userId },
    });

    if (updated.weightRemainingG <= updated.lowStockThresholdG) {
      await emitNotification({
        tx,
        userIds: await getAlertRecipientIds(tx),
        type: "LOW_STOCK",
        title: `Low stock: ${updated.type} ${updated.color}`,
        body: `Only ${updated.weightRemainingG}g left (threshold ${updated.lowStockThresholdG}g).`,
        link: `/inventory/${updated.id}`,
        email: true,
      });
    }
  }
}

/** Restore stock when a confirmed order is cancelled. */
export async function restoreOrderStock(
  tx: PrismaTx,
  orderId: string,
  consumption: OrderConsumption[],
  userId: string | null,
): Promise<void> {
  const byFilament = new Map<string, number>();
  for (const c of consumption) {
    if (!c.filamentId || c.grams <= 0) continue;
    byFilament.set(c.filamentId, (byFilament.get(c.filamentId) ?? 0) + c.grams);
  }
  for (const [filamentId, grams] of byFilament) {
    await tx.filament.update({
      where: { id: filamentId },
      data: { weightRemainingG: { increment: grams } },
    });
    await tx.stockMovement.create({
      data: { filamentId, deltaG: grams, reason: "CANCEL_RESTORE", orderId, userId },
    });
  }
}

/** Manual restock / adjustment from the inventory screen. */
export async function adjustStock(
  filamentId: string,
  deltaG: number,
  reason: "RESTOCK" | "ADJUSTMENT",
  note: string | undefined,
  userId: string | null,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const fil = await tx.filament.findUnique({ where: { id: filamentId } });
    if (!fil) throw errors.notFound("Filament");
    if (fil.weightRemainingG + deltaG < 0) throw errors.stock("Adjustment would make stock negative");
    await tx.filament.update({
      where: { id: filamentId },
      data: { weightRemainingG: { increment: deltaG } },
    });
    await tx.stockMovement.create({ data: { filamentId, deltaG, reason, note, userId } });
  });
}
