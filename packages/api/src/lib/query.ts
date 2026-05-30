/**
 * Generic query helpers — shared by every list endpoint so the skip/take/count
 * and search-OR patterns are written once, not per router.
 */

export function paginate(input: { page: number; pageSize: number }) {
  return { skip: (input.page - 1) * input.pageSize, take: input.pageSize };
}

/** Build a case-insensitive "contains" OR filter across the given fields. */
export function searchOr<F extends string>(fields: readonly F[], search?: string) {
  if (!search) return undefined;
  return { OR: fields.map((f) => ({ [f]: { contains: search } })) } as Record<string, unknown>;
}

/** A created-at (or any date column) range filter, omitting empty bounds. */
export function dateRange(column: string, from?: Date, to?: Date) {
  if (!from && !to) return undefined;
  const gte = from ? { gte: from } : {};
  // make the upper bound inclusive of the whole day
  const lte = to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {};
  return { [column]: { ...gte, ...lte } } as Record<string, unknown>;
}

/** Standard paginated list envelope. */
export function listResult<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
