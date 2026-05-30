/** Audit log helper — records sensitive actions. Best-effort: never throws into
 *  the caller's flow. */
import { prisma, type PrismaTx } from "@workshop/db";
import { logger } from "@workshop/core";

export async function audit(args: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  tx?: PrismaTx;
}): Promise<void> {
  const db = args.tx ?? prisma;
  try {
    await db.auditLog.create({
      data: {
        userId: args.userId ?? null,
        action: args.action,
        entity: args.entity,
        entityId: args.entityId,
        before: (args.before ?? undefined) as object | undefined,
        after: (args.after ?? undefined) as object | undefined,
      },
    });
  } catch (err) {
    logger.warn("Audit write failed", { error: String(err), action: args.action });
  }
}
