import { z } from "zod";
import { router, permissionProcedure } from "../trpc.js";
import { errors, toMinor, toMajor } from "@workshop/core";
import {
  filamentCreateSchema,
  filamentUpdateSchema,
  stockAdjustSchema,
  paginationSchema,
  idSchema,
} from "@workshop/validators";
import { adjustStock } from "../services/stock.js";
import { audit } from "../services/audit.js";

/** Map a DB filament (minor units) to API shape (major units for rates). */
function toApi(f: {
  id: string;
  type: string;
  color: string;
  sellRatePerGram: number;
  costPerGram: number;
  weightRemainingG: number;
  spoolCount: number;
  lowStockThresholdG: number;
  status: string;
}) {
  return {
    ...f,
    sellRatePerGram: toMajor(f.sellRatePerGram),
    costPerGram: toMajor(f.costPerGram),
    lowStock: f.weightRemainingG <= f.lowStockThresholdG,
  };
}

export const filamentRouter = router({
  list: permissionProcedure("inventory.view")
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const where = {
        deletedAt: null,
        ...(input.search
          ? { OR: [{ type: { contains: input.search } }, { color: { contains: input.search } }] }
          : {}),
      };
      const [rows, total] = await Promise.all([
        ctx.prisma.filament.findMany({
          where,
          orderBy: { type: "asc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.filament.count({ where }),
      ]);
      return { items: rows.map(toApi), total, page: input.page, pageSize: input.pageSize };
    }),

  byId: permissionProcedure("inventory.view")
    .input(z.object({ id: idSchema }))
    .query(async ({ ctx, input }) => {
      const f = await ctx.prisma.filament.findFirst({
        where: { id: input.id, deletedAt: null },
        include: { stockMoves: { orderBy: { createdAt: "desc" }, take: 20 } },
      });
      if (!f) throw errors.notFound("Filament");
      return { ...toApi(f), stockMoves: f.stockMoves };
    }),

  /** Options for the order wizard (rates in major units). */
  options: permissionProcedure("orders.create").query(async ({ ctx }) => {
    const rows = await ctx.prisma.filament.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: {
        id: true,
        type: true,
        color: true,
        sellRatePerGram: true,
        costPerGram: true,
        weightRemainingG: true,
      },
      orderBy: { type: "asc" },
    });
    return rows.map((r) => ({
      ...r,
      sellRatePerGram: toMajor(r.sellRatePerGram),
      costPerGram: toMajor(r.costPerGram),
    }));
  }),

  create: permissionProcedure("inventory.create")
    .input(filamentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const f = await ctx.prisma.filament.create({
        data: {
          type: input.type,
          color: input.color,
          sellRatePerGram: toMinor(input.sellRatePerGram),
          costPerGram: toMinor(input.costPerGram),
          weightRemainingG: input.weightRemainingG,
          spoolCount: input.spoolCount,
          lowStockThresholdG: input.lowStockThresholdG,
        },
      });
      await audit({ userId: ctx.user.id, action: "filament.create", entity: "Filament", entityId: f.id });
      return toApi(f);
    }),

  update: permissionProcedure("inventory.edit")
    .input(filamentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, sellRatePerGram, costPerGram, ...rest } = input;
      const exists = await ctx.prisma.filament.findFirst({ where: { id, deletedAt: null } });
      if (!exists) throw errors.notFound("Filament");
      const f = await ctx.prisma.filament.update({
        where: { id },
        data: {
          ...rest,
          ...(sellRatePerGram !== undefined ? { sellRatePerGram: toMinor(sellRatePerGram) } : {}),
          ...(costPerGram !== undefined ? { costPerGram: toMinor(costPerGram) } : {}),
        },
      });
      return toApi(f);
    }),

  adjustStock: permissionProcedure("inventory.adjustStock")
    .input(stockAdjustSchema)
    .mutation(async ({ ctx, input }) => {
      await adjustStock(input.filamentId, input.deltaG, input.reason, input.note, ctx.user.id);
      return { ok: true };
    }),

  remove: permissionProcedure("inventory.delete")
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.filament.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
      return { ok: true };
    }),
});
