import { z } from "zod";
import { router, permissionProcedure } from "../trpc.js";
import { errors } from "@workshop/core";
import { userCreateSchema, userUpdateSchema, paginationSchema, idSchema } from "@workshop/validators";
import { hashSecret } from "@workshop/auth";
import { validateCustomFields } from "../services/custom-fields.js";
import { guardIdentityChange, getChangeHistory } from "../services/identity.js";
import { audit } from "../services/audit.js";

const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  customFields: true,
  createdAt: true,
} as const;

export const userRouter = router({
  list: permissionProcedure("users.view")
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const where = {
        deletedAt: null,
        ...(input.search
          ? { OR: [{ name: { contains: input.search } }, { email: { contains: input.search } }] }
          : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: safeSelect,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.user.count({ where }),
      ]);
      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

  byId: permissionProcedure("users.view")
    .input(z.object({ id: idSchema }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { id: input.id, deletedAt: null },
        select: safeSelect,
      });
      if (!user) throw errors.notFound("User");
      return user;
    }),

  create: permissionProcedure("users.manage")
    .input(userCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const dup = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (dup) throw errors.conflict("A user with this email already exists");
      const customFields = await validateCustomFields("USER", input.customFields);
      const passwordHash = await hashSecret(input.password);
      const user = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          status: input.status,
          passwordHash,
          customFields,
        },
        select: safeSelect,
      });
      await audit({ userId: ctx.user.id, action: "user.create", entity: "User", entityId: user.id, after: { role: user.role } });
      return user;
    }),

  update: permissionProcedure("users.manage")
    .input(userUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, password, customFields, overridePassword, email, ...rest } = input;
      const existing = await ctx.prisma.user.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw errors.notFound("User");

      if (email && email !== existing.email) {
        const dup = await ctx.prisma.user.findFirst({ where: { email, NOT: { id } } });
        if (dup) throw errors.conflict("A user with this email already exists");
      }

      // Name/email changes need the override password and are recorded.
      await guardIdentityChange({
        entity: "USER",
        entityId: id,
        before: { name: existing.name, email: existing.email },
        after: { name: rest.name, email },
        overridePassword,
        userId: ctx.user.id,
      });

      const cf = await validateCustomFields("USER", customFields);
      return ctx.prisma.user.update({
        where: { id },
        data: {
          ...rest,
          ...(email !== undefined ? { email } : {}),
          customFields: cf,
          ...(password ? { passwordHash: await hashSecret(password) } : {}),
        },
        select: safeSelect,
      });
    }),

  history: permissionProcedure("users.view")
    .input(z.object({ id: idSchema }))
    .query(({ input }) => getChangeHistory("USER", input.id)),

  remove: permissionProcedure("users.manage")
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id) throw errors.validation("You cannot delete your own account");
      await ctx.prisma.user.update({ where: { id: input.id }, data: { deletedAt: new Date(), status: "SUSPENDED" } });
      await audit({ userId: ctx.user.id, action: "user.delete", entity: "User", entityId: input.id });
      return { ok: true };
    }),
});
