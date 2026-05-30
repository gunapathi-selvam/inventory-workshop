import { z } from "zod";
import { router, permissionProcedure } from "../trpc.js";
import { ORDER_STATUS } from "@workshop/core";

const REALIZED = ORDER_STATUS.filter((s) => s !== "CANCELLED" && s !== "DRAFT");

export const dashboardRouter = router({
  stats: permissionProcedure("dashboard.view")
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const scope = ctx.user.role === "HANDLER" ? { createdById: ctx.user.id } : {};
      const realizedWhere = { deletedAt: null, ...scope, status: { in: REALIZED }, createdAt: { gte: since } };

      const [kpiAgg, trendRows, statusCounts, lowStock, customerCount, recent] = await Promise.all([
        // KPI totals computed in SQL — no order rows transferred for the sums/count.
        ctx.prisma.order.aggregate({
          where: realizedWhere,
          _sum: { total: true, profit: true, costTotal: true },
          _count: { _all: true },
        }),
        // Lean projection for the daily trend. Bucketing stays in JS: there is no
        // portable SQL date-truncation across SQLite (now) and Postgres (later),
        // and this schema deliberately avoids engine-specific raw SQL.
        ctx.prisma.order.findMany({
          where: realizedWhere,
          select: { total: true, profit: true, createdAt: true },
        }),
        ctx.prisma.order.groupBy({
          by: ["status"],
          where: { deletedAt: null, ...scope },
          _count: { _all: true },
        }),
        ctx.prisma.filament.findMany({
          where: { deletedAt: null },
          select: { id: true, type: true, color: true, weightRemainingG: true, lowStockThresholdG: true },
        }),
        ctx.prisma.customer.count({ where: { deletedAt: null } }),
        ctx.prisma.order.findMany({
          where: { deletedAt: null, ...scope },
          include: { customer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      ]);

      const revenue = kpiAgg._sum.total ?? 0;
      const profit = kpiAgg._sum.profit ?? 0;
      const cost = kpiAgg._sum.costTotal ?? 0;

      // Daily trend buckets (minor units).
      const byDay = new Map<string, { revenue: number; profit: number; orders: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        byDay.set(d.toISOString().slice(0, 10), { revenue: 0, profit: 0, orders: 0 });
      }
      for (const o of trendRows) {
        const key = o.createdAt.toISOString().slice(0, 10);
        const b = byDay.get(key);
        if (b) {
          b.revenue += o.total;
          b.profit += o.profit;
          b.orders += 1;
        }
      }

      const lowStockItems = lowStock.filter((f) => f.weightRemainingG <= f.lowStockThresholdG);

      return {
        kpis: {
          revenue,
          profit,
          cost,
          orderCount: kpiAgg._count._all,
          customerCount,
          lowStockCount: lowStockItems.length,
        },
        statusCounts: ORDER_STATUS.map((s) => ({
          status: s,
          count: statusCounts.find((c) => c.status === s)?._count._all ?? 0,
        })),
        trend: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
        lowStockItems,
        recent,
      };
    }),
});
