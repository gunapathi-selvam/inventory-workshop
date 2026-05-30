import { z } from "zod";
import { router, permissionProcedure, protectedProcedure } from "../trpc.js";
import { errors, ORDER_STATUS, toMajor } from "@workshop/core";
import {
  orderCreateSchema,
  orderUpdateSchema,
  orderStatusSchema,
  orderListSchema,
  orderExportSchema,
  orderFulfillmentSchema,
  idSchema,
} from "@workshop/validators";
import {
  createOrder,
  updateOrder,
  changeOrderStatus,
  updateFulfillment,
} from "../services/order.js";
import { requirePermission } from "@workshop/auth";
import { dateRange } from "../lib/query.js";

/** Handlers only see orders they created; managers/admins see everything. */
function scopeFor(user: { id: string; role: string }) {
  return user.role === "HANDLER" ? { createdById: user.id } : {};
}

/** Profit is admin-only — strip it for everyone else. */
function gateProfit<T extends { profit: number }>(row: T, isAdmin: boolean): T {
  return isAdmin ? row : { ...row, profit: 0 };
}

export const orderRouter = router({
  list: permissionProcedure("orders.view")
    .input(orderListSchema)
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "ADMIN";
      const where = {
        deletedAt: null,
        ...scopeFor(ctx.user),
        ...(input.status ? { status: input.status } : {}),
        ...dateRange("createdAt", input.dateFrom, input.dateTo),
        ...(input.search
          ? {
              OR: [
                { orderNumber: { contains: input.search } },
                { customer: { name: { contains: input.search } } },
                { customer: { email: { contains: input.search } } },
              ],
            }
          : {}),
      };
      const [rows, total] = await Promise.all([
        ctx.prisma.order.findMany({
          where,
          include: {
            customer: { select: { id: true, name: true, email: true } },
            items: { select: { id: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.order.count({ where }),
      ]);
      return {
        items: rows.map((r) => gateProfit(r, isAdmin)),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  byId: permissionProcedure("orders.view")
    .input(z.object({ id: idSchema }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findFirst({
        where: { id: input.id, deletedAt: null, ...scopeFor(ctx.user) },
        include: {
          customer: true,
          items: { include: { filament: { select: { type: true, color: true } } } },
          createdBy: { select: { name: true } },
          discountCode: { select: { code: true } },
        },
      });
      if (!order) throw errors.notFound("Order");
      return gateProfit(order, ctx.user.role === "ADMIN");
    }),

  create: permissionProcedure("orders.create")
    .input(orderCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.pricing.mode === "MANUAL") await requirePermission(ctx.user, "orders.priceOverride");
      return createOrder(input, ctx.user);
    }),

  update: permissionProcedure("orders.edit")
    .input(orderUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.pricing?.mode === "MANUAL") await requirePermission(ctx.user, "orders.priceOverride");
      return updateOrder(input, ctx.user);
    }),

  changeStatus: permissionProcedure("orders.changeStatus")
    .input(orderStatusSchema)
    .mutation(({ ctx, input }) => changeOrderStatus(input.id, input.status, ctx.user)),

  /** Update delivery/payment/courier without re-pricing (handlers can do this). */
  setFulfillment: permissionProcedure("orders.changeStatus")
    .input(orderFulfillmentSchema)
    .mutation(({ ctx, input }) => updateFulfillment(input, ctx.user)),

  remove: permissionProcedure("orders.delete")
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.order.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
      return { ok: true };
    }),

  /** Flat rows for Excel export (date range + status), respecting role scope. */
  export: permissionProcedure("orders.view")
    .input(orderExportSchema)
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "ADMIN";
      const where = {
        deletedAt: null,
        ...scopeFor(ctx.user),
        ...(input.status ? { status: input.status } : {}),
        ...dateRange("createdAt", input.dateFrom, input.dateTo),
      };
      const rows = await ctx.prisma.order.findMany({
        where,
        include: { customer: { select: { name: true, email: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      });
      return rows.map((o) => ({
        orderNumber: o.orderNumber,
        date: o.createdAt.toISOString().slice(0, 10),
        customer: o.customer.name,
        customerEmail: o.customer.email ?? "",
        customerPhone: o.customer.phone ?? "",
        status: o.status,
        paymentType: o.paymentType ?? "",
        deliveryDate: o.deliveryDate ? o.deliveryDate.toISOString().slice(0, 10) : "",
        courier: o.courierName ?? "",
        trackingId: o.trackingId ?? "",
        subtotal: toMajor(o.subtotal),
        discount: toMajor(o.discountAmount),
        total: toMajor(o.total),
        ...(isAdmin ? { cost: toMajor(o.costTotal), profit: toMajor(o.profit) } : {}),
      }));
    }),

  statuses: protectedProcedure.query(() => ORDER_STATUS),
});
