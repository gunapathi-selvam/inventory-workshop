/**
 * Order service — orchestrates the pricing engine, stock decrement, discount
 * usage and status lifecycle inside transactions. Routers stay thin and call
 * these functions.
 */
import { prisma, type PrismaTx } from "@workshop/db";
import {
  errors,
  round2,
  STOCK_CONSUMED_STATUSES,
  type OrderStatus,
} from "@workshop/core";
import type {
  OrderCreateInput,
  OrderUpdateInput,
  OrderFulfillmentInput,
} from "@workshop/validators";
import type { SessionUser } from "@workshop/auth";
import { computePricing } from "./pricing.js";
import { validateCustomFields } from "./custom-fields.js";
import { applyOrderStock, restoreOrderStock } from "./stock.js";
import { emitNotification } from "./notifications.js";
import { audit } from "./audit.js";

async function nextOrderNumber(tx: PrismaTx): Promise<string> {
  const row = await tx.setting.upsert({
    where: { key: "orderSeq" },
    update: {},
    create: { key: "orderSeq", value: 1000 },
  });
  const current = typeof row.value === "number" ? row.value : 1000;
  const next = current + 1;
  await tx.setting.update({ where: { key: "orderSeq" }, data: { value: next } });
  return `ORD-${next}`;
}

function consumptionOf(items: { filamentId: string | null; gramsPerUnit: number; qty: number }[]) {
  return items.map((i) => ({ filamentId: i.filamentId, grams: round2(i.gramsPerUnit * i.qty) }));
}

/** Normalize incoming fulfillment fields for persistence (empty url -> null). */
function fulfillmentData(input: {
  deliveryDate?: Date | null;
  paymentType?: string | null;
  courierName?: string | null;
  trackingId?: string | null;
  trackingUrl?: string | null;
}) {
  return {
    deliveryDate: input.deliveryDate ?? null,
    paymentType: input.paymentType ?? null,
    courierName: input.courierName ?? null,
    trackingId: input.trackingId ?? null,
    trackingUrl: input.trackingUrl ? input.trackingUrl : null,
  };
}

export async function createOrder(input: OrderCreateInput, user: SessionUser) {
  const customFields = await validateCustomFields("ORDER", input.customFields);
  const pricing = await computePricing(input, { enforceOverride: true });

  return prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx);
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: input.customerId,
        status: "DRAFT",
        pricingMode: pricing.mode,
        subtotal: pricing.subtotal,
        discountType: pricing.discountType,
        discountValue: pricing.discountValue,
        discountCodeId: pricing.discountCodeId,
        discountAmount: pricing.discountAmount,
        total: pricing.total,
        costTotal: pricing.costTotal,
        profit: pricing.profit,
        overrideUsed: pricing.overrideUsed,
        ...fulfillmentData(input),
        notes: input.notes,
        customFields,
        createdById: user.id,
        items: {
          create: pricing.items.map((it) => ({
            name: it.name,
            filamentId: it.filamentId,
            gramsPerUnit: it.gramsPerUnit,
            qty: it.qty,
            printHours: it.printHours,
            ratePerGram: it.ratePerGram,
            lineCost: it.lineCost,
            linePrice: it.linePrice,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    if (pricing.discountCodeId) {
      await tx.discountCode.update({
        where: { id: pricing.discountCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }
    await audit({ tx, userId: user.id, action: "order.create", entity: "Order", entityId: order.id, after: { total: order.total } });
    return order;
  });
}

export async function updateOrder(input: OrderUpdateInput, user: SessionUser) {
  const existing = await prisma.order.findUnique({ where: { id: input.id }, include: { items: true } });
  if (!existing || existing.deletedAt) throw errors.notFound("Order");
  if (existing.stockApplied) {
    throw errors.conflict("Cannot edit an order after stock has been applied. Cancel it first.");
  }
  if (!input.items || !input.pricing || !input.customerId) {
    throw errors.validation("Items, pricing and customer are required to update an order");
  }

  const customFields = await validateCustomFields("ORDER", input.customFields);
  const pricing = await computePricing(
    { items: input.items, pricing: input.pricing },
    { enforceOverride: true },
  );

  return prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId: input.id } });
    const order = await tx.order.update({
      where: { id: input.id },
      data: {
        customerId: input.customerId,
        pricingMode: pricing.mode,
        subtotal: pricing.subtotal,
        discountType: pricing.discountType,
        discountValue: pricing.discountValue,
        discountCodeId: pricing.discountCodeId,
        discountAmount: pricing.discountAmount,
        total: pricing.total,
        costTotal: pricing.costTotal,
        profit: pricing.profit,
        overrideUsed: pricing.overrideUsed,
        ...fulfillmentData(input),
        notes: input.notes,
        customFields,
        items: {
          create: pricing.items.map((it) => ({
            name: it.name,
            filamentId: it.filamentId,
            gramsPerUnit: it.gramsPerUnit,
            qty: it.qty,
            printHours: it.printHours,
            ratePerGram: it.ratePerGram,
            lineCost: it.lineCost,
            linePrice: it.linePrice,
          })),
        },
      },
      include: { items: true, customer: true },
    });
    await audit({ tx, userId: user.id, action: "order.update", entity: "Order", entityId: order.id });
    return order;
  });
}

/** Update only the fulfillment fields (delivery date, payment, courier/tracking). */
export async function updateFulfillment(input: OrderFulfillmentInput, user: SessionUser) {
  const existing = await prisma.order.findFirst({ where: { id: input.id, deletedAt: null } });
  if (!existing) throw errors.notFound("Order");
  const order = await prisma.order.update({
    where: { id: input.id },
    data: fulfillmentData(input),
  });
  await audit({ userId: user.id, action: "order.fulfillment", entity: "Order", entityId: input.id });
  return order;
}

export async function changeOrderStatus(id: string, status: OrderStatus, user: SessionUser) {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || order.deletedAt) throw errors.notFound("Order");

  const willConsume = STOCK_CONSUMED_STATUSES.includes(status);
  const consumption = consumptionOf(order.items);

  return prisma.$transaction(async (tx) => {
    // Apply stock the first time the order enters a consuming status.
    if (willConsume && !order.stockApplied) {
      await applyOrderStock(tx, order.id, consumption, user.id);
      await tx.order.update({ where: { id }, data: { stockApplied: true } });
    }
    // Restore stock when cancelling a previously-applied order.
    if (status === "CANCELLED" && order.stockApplied) {
      await restoreOrderStock(tx, order.id, consumption, user.id);
      await tx.order.update({ where: { id }, data: { stockApplied: false } });
    }

    const updated = await tx.order.update({ where: { id }, data: { status } });

    if (order.createdById && order.createdById !== user.id) {
      await emitNotification({
        tx,
        userIds: [order.createdById],
        type: "ORDER_STATUS",
        title: `Order ${order.orderNumber} is now ${status}`,
        link: `/orders/${order.id}`,
      });
    }
    await audit({
      tx,
      userId: user.id,
      action: "order.status",
      entity: "Order",
      entityId: id,
      before: { status: order.status },
      after: { status },
    });
    return updated;
  });
}
