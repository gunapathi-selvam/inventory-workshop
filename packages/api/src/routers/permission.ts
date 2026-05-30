import { z } from "zod";
import { router, permissionProcedure } from "../trpc.js";
import { PERMISSIONS, ROLES } from "@workshop/core";
import { rolePermissionSetSchema, userOverrideSetSchema, idSchema } from "@workshop/validators";
import { getEffectivePermissions } from "@workshop/auth";
import { audit } from "../services/audit.js";

export const permissionRouter = router({
  /** Registry + current role matrix for the access-control "By Role" tab. */
  matrix: permissionProcedure("settings.accessControl").query(async ({ ctx }) => {
    const rows = await ctx.prisma.rolePermission.findMany();
    const map: Record<string, Record<string, boolean>> = {};
    for (const role of ROLES) map[role] = {};
    for (const r of rows) {
      (map[r.role] ??= {})[r.permissionKey] = r.allowed;
    }
    return {
      roles: ROLES,
      permissions: PERMISSIONS.map((p) => ({ key: p.key, label: p.label, group: p.group })),
      matrix: map,
    };
  }),

  setRolePermission: permissionProcedure("settings.accessControl")
    .input(rolePermissionSetSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.rolePermission.upsert({
        where: { role_permissionKey: { role: input.role, permissionKey: input.permissionKey } },
        update: { allowed: input.allowed },
        create: { role: input.role, permissionKey: input.permissionKey, allowed: input.allowed },
      });
      await audit({
        userId: ctx.user.id,
        action: "permission.setRole",
        entity: "RolePermission",
        after: input,
      });
      return { ok: true };
    }),

  /** A specific user's effective map + their explicit overrides ("By User" tab). */
  userOverrides: permissionProcedure("settings.accessControl")
    .input(z.object({ userId: idSchema }))
    .query(async ({ ctx, input }) => {
      const permList = PERMISSIONS.map((p) => ({ key: p.key, label: p.label, group: p.group }));
      const user = await ctx.prisma.user.findUnique({ where: { id: input.userId } });
      if (!user) {
        return {
          effective: {} as Record<string, boolean>,
          overrides: {} as Record<string, string>,
          permissions: permList,
        };
      }
      const [effective, overrides] = await Promise.all([
        getEffectivePermissions(user.id, user.role as (typeof ROLES)[number]),
        ctx.prisma.userPermissionOverride.findMany({ where: { userId: input.userId } }),
      ]);
      return {
        effective,
        overrides: Object.fromEntries(overrides.map((o) => [o.permissionKey, o.effect])) as Record<string, string>,
        permissions: permList,
      };
    }),

  setUserOverride: permissionProcedure("settings.accessControl")
    .input(userOverrideSetSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.effect === "INHERIT") {
        await ctx.prisma.userPermissionOverride.deleteMany({
          where: { userId: input.userId, permissionKey: input.permissionKey },
        });
      } else {
        await ctx.prisma.userPermissionOverride.upsert({
          where: { userId_permissionKey: { userId: input.userId, permissionKey: input.permissionKey } },
          update: { effect: input.effect },
          create: { userId: input.userId, permissionKey: input.permissionKey, effect: input.effect },
        });
      }
      await audit({
        userId: ctx.user.id,
        action: "permission.setUserOverride",
        entity: "UserPermissionOverride",
        entityId: input.userId,
        after: input,
      });
      return { ok: true };
    }),
});
