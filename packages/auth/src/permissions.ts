/**
 * Permission resolver. Effective access = user override (ALLOW/DENY) wins,
 * else the role default from the DB matrix, else deny. The registry of keys
 * lives in @workshop/core; this resolves them against the database.
 */
import { prisma } from "@workshop/db";
import { errors, PERMISSION_KEYS, type PermissionKey, type Role } from "@workshop/core";

export type PermissionMap = Record<string, boolean>;

/** Resolve the full effective permission map for a user. */
export async function getEffectivePermissions(
  userId: string,
  role: Role,
): Promise<PermissionMap> {
  const [rolePerms, overrides] = await Promise.all([
    prisma.rolePermission.findMany({ where: { role } }),
    prisma.userPermissionOverride.findMany({ where: { userId } }),
  ]);

  const roleMap = new Map(rolePerms.map((p) => [p.permissionKey, p.allowed]));
  const overrideMap = new Map(overrides.map((o) => [o.permissionKey, o.effect]));

  const result: PermissionMap = {};
  for (const key of PERMISSION_KEYS) {
    const override = overrideMap.get(key);
    if (override) result[key] = override === "ALLOW";
    else result[key] = roleMap.get(key) ?? false;
  }
  return result;
}

/**
 * Throws FORBIDDEN unless the (already-resolved) permission map grants the key.
 * The map is resolved once per request in the tRPC context, so this is a cheap
 * synchronous check rather than a fresh DB round-trip per procedure.
 */
export function assertPermission(map: PermissionMap | null | undefined, key: PermissionKey): void {
  if (!map?.[key]) throw errors.forbidden(`Missing permission: ${key}`);
}
