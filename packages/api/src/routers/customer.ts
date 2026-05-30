import { z } from "zod";
import { router, permissionProcedure } from "../trpc.js";
import { errors } from "@workshop/core";
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerOrdersSchema,
  paginationSchema,
  idSchema,
} from "@workshop/validators";
import { validateCustomFields } from "../services/custom-fields.js";
import { guardIdentityChange, getChangeHistory } from "../services/identity.js";
import { audit } from "../services/audit.js";
import { paginate, searchOr, dateRange, listResult } from "../lib/query.js";

export const customerRouter = router({
  list: permissionProcedure("customers.view")
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const where = {
        deletedAt: null,
        ...searchOr(["name", "phone", "email"], input.search),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, ...paginate(input) }),
        ctx.prisma.customer.count({ where }),
      ]);
      return listResult(items, total, input.page, input.pageSize);
    }),

  byId: permissionProcedure("customers.view")
    .input(z.object({ id: idSchema }))
    .query(async ({ ctx, input }) => {
      const customer = await ctx.prisma.customer.findFirst({
        where: { id: input.id, deletedAt: null },
        include: {
          orders: {
            select: { id: true, orderNumber: true, createdAt: true, status: true, total: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
      if (!customer) throw errors.notFound("Customer");
      return customer;
    }),

  /** Lightweight contact card (for view-only popups). */
  basic: permissionProcedure("customers.view")
    .input(z.object({ id: idSchema }))
    .query(async ({ ctx, input }) => {
      const c = await ctx.prisma.customer.findFirst({
        where: { id: input.id, deletedAt: null },
        select: { id: true, name: true, phone: true, email: true, address: true, tier: true, notes: true },
      });
      if (!c) throw errors.notFound("Customer");
      return c;
    }),

  /** Orders for one customer, with date range + order-number search. */
  orders: permissionProcedure("orders.view")
    .input(customerOrdersSchema)
    .query(async ({ ctx, input }) => {
      const where = {
        deletedAt: null,
        customerId: input.customerId,
        ...dateRange("createdAt", input.dateFrom, input.dateTo),
        ...(input.search ? { orderNumber: { contains: input.search } } : {}),
      };
      const isAdmin = ctx.user.role === "ADMIN";
      const orders = await ctx.prisma.order.findMany({
        where,
        include: { items: { select: { id: true } } },
        orderBy: { createdAt: "desc" },
      });
      return orders.map((o) => ({ ...o, profit: isAdmin ? o.profit : 0 }));
    }),

  history: permissionProcedure("customers.view")
    .input(z.object({ id: idSchema }))
    .query(({ input }) => getChangeHistory("CUSTOMER", input.id)),

  create: permissionProcedure("customers.create")
    .input(customerCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.email) {
        const dup = await ctx.prisma.customer.findFirst({ where: { email: input.email, deletedAt: null } });
        if (dup) throw errors.conflict("A customer with this email already exists");
      }
      const customFields = await validateCustomFields("CUSTOMER", input.customFields);
      const customer = await ctx.prisma.customer.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          address: input.address,
          tier: input.tier,
          notes: input.notes,
          customFields,
        },
      });
      await audit({ userId: ctx.user.id, action: "customer.create", entity: "Customer", entityId: customer.id });
      return customer;
    }),

  update: permissionProcedure("customers.edit")
    .input(customerUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFields, email, overridePassword, ...rest } = input;
      const existing = await ctx.prisma.customer.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw errors.notFound("Customer");

      const nextEmail = email === undefined ? undefined : email || null;
      if (nextEmail && nextEmail !== existing.email) {
        const dup = await ctx.prisma.customer.findFirst({
          where: { email: nextEmail, deletedAt: null, NOT: { id } },
        });
        if (dup) throw errors.conflict("A customer with this email already exists");
      }

      // Name/email changes need the override password and are recorded.
      await guardIdentityChange({
        entity: "CUSTOMER",
        entityId: id,
        before: { name: existing.name, email: existing.email },
        after: { name: rest.name, email: nextEmail },
        overridePassword,
        userId: ctx.user.id,
      });

      const cf = await validateCustomFields("CUSTOMER", customFields);
      return ctx.prisma.customer.update({
        where: { id },
        data: { ...rest, ...(nextEmail !== undefined ? { email: nextEmail } : {}), customFields: cf },
      });
    }),

  remove: permissionProcedure("customers.delete")
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.customer.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
      await audit({ userId: ctx.user.id, action: "customer.delete", entity: "Customer", entityId: input.id });
      return { ok: true };
    }),

  /** Options for selects (order wizard) — includes email for search. */
  options: permissionProcedure("orders.create").query(({ ctx }) =>
    ctx.prisma.customer.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, phone: true, email: true },
      orderBy: { name: "asc" },
    }),
  ),
});
