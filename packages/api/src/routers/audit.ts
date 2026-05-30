import { z } from "zod";
import { router, permissionProcedure } from "../trpc.js";
import { paginate, dateRange, searchOr, listResult } from "../lib/query.js";

const auditListSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const auditRouter = router({
  /** Paginated audit trail (admin-only). Returns metadata + actor name; the
   *  bulky before/after JSON is intentionally omitted from the list. */
  list: permissionProcedure("settings.audit")
    .input(auditListSchema)
    .query(async ({ ctx, input }) => {
      const where = {
        ...searchOr(["action", "entity", "entityId"], input.search),
        ...dateRange("createdAt", input.dateFrom, input.dateTo),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          select: {
            id: true,
            action: true,
            entity: true,
            entityId: true,
            createdAt: true,
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          ...paginate(input),
        }),
        ctx.prisma.auditLog.count({ where }),
      ]);
      return listResult(items, total, input.page, input.pageSize);
    }),
});
