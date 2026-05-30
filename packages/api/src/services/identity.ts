/**
 * Identity-change guard. Changing a customer's or user's name/email requires the
 * override password and is recorded in ChangeHistory so an old value can be found
 * later. Used by the customer and user update endpoints.
 */
import { prisma } from "@workshop/db";
import { errors, type ChangeEntity } from "@workshop/core";
import { verifyOverridePassword } from "./settings.js";
import { audit } from "./audit.js";

const TRACKED_FIELDS = ["name", "email"] as const;
type TrackedField = (typeof TRACKED_FIELDS)[number];

interface GuardArgs {
  entity: ChangeEntity;
  entityId: string;
  before: { name?: string | null; email?: string | null };
  after: { name?: string | null; email?: string | null };
  overridePassword?: string;
  userId: string | null;
}

/**
 * If any tracked field (name/email) changes, verify the override password and
 * record the change. No-op when nothing tracked changed (e.g. editing only
 * address/phone needs no password).
 */
export async function guardIdentityChange(args: GuardArgs): Promise<void> {
  const changed: TrackedField[] = TRACKED_FIELDS.filter(
    (f) => args.after[f] !== undefined && args.after[f] !== args.before[f],
  );
  if (changed.length === 0) return;

  const ok = args.overridePassword ? await verifyOverridePassword(args.overridePassword) : false;
  if (!ok) throw errors.forbidden("Override password required to change name or email");

  await prisma.changeHistory.createMany({
    data: changed.map((field) => ({
      entity: args.entity,
      entityId: args.entityId,
      field,
      oldValue: args.before[field] ?? null,
      newValue: args.after[field] ?? null,
      changedById: args.userId,
    })),
  });
  await audit({
    userId: args.userId,
    action: "identity.change",
    entity: args.entity,
    entityId: args.entityId,
    before: Object.fromEntries(changed.map((f) => [f, args.before[f]])),
    after: Object.fromEntries(changed.map((f) => [f, args.after[f]])),
  });
}

export function getChangeHistory(entity: ChangeEntity, entityId: string) {
  return prisma.changeHistory.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: "desc" },
  });
}
