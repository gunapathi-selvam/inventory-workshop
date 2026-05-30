import { z } from "zod";
import { router, permissionProcedure } from "../trpc.js";
import { errors, toMinor, toMajor, type DiscountType } from "@workshop/core";
import { discountCreateSchema, discountUpdateSchema, idSchema } from "@workshop/validators";

/** value is stored as percent*100 (PERCENT) or minor units (FLAT). */
function encodeValue(type: DiscountType, value: number): number {
  return type === "PERCENT" ? Math.round(value * 100) : toMinor(value);
}
function decodeValue(type: string, value: number): number {
  return type === "PERCENT" ? value / 100 : toMajor(value);
}

export const discountRouter = router({
  list: permissionProcedure("discounts.view").query(async ({ ctx }) => {
    const rows = await ctx.prisma.discountCode.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((d) => ({ ...d, displayValue: decodeValue(d.type, d.value) }));
  }),

  create: permissionProcedure("discounts.manage")
    .input(discountCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const dup = await ctx.prisma.discountCode.findUnique({ where: { code: input.code } });
      if (dup) throw errors.conflict("A discount with this code already exists");
      return ctx.prisma.discountCode.create({
        data: {
          code: input.code,
          type: input.type,
          value: encodeValue(input.type, input.value),
          active: input.active,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          maxUses: input.maxUses,
        },
      });
    }),

  update: permissionProcedure("discounts.manage")
    .input(discountUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, type, value, ...rest } = input;
      const existing = await ctx.prisma.discountCode.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw errors.notFound("Discount code");
      const effectiveType = (type ?? existing.type) as DiscountType;
      return ctx.prisma.discountCode.update({
        where: { id },
        data: {
          ...rest,
          ...(type ? { type } : {}),
          ...(value !== undefined ? { value: encodeValue(effectiveType, value) } : {}),
        },
      });
    }),

  remove: permissionProcedure("discounts.manage")
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.discountCode.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
      return { ok: true };
    }),
});
