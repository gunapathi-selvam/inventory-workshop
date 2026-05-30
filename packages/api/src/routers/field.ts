import { z } from "zod";
import { router, permissionProcedure, protectedProcedure } from "../trpc.js";
import { errors, CUSTOM_FIELD_ENTITY } from "@workshop/core";
import {
  fieldDefinitionCreateSchema,
  fieldDefinitionUpdateSchema,
  idSchema,
} from "@workshop/validators";

export const fieldRouter = router({
  /** Active field definitions for an entity — used to render dynamic form
   *  inputs. Available to any authenticated user (needed to fill forms). */
  byEntity: protectedProcedure
    .input(z.object({ entity: z.enum(CUSTOM_FIELD_ENTITY) }))
    .query(({ ctx, input }) =>
      ctx.prisma.fieldDefinition.findMany({
        where: { entity: input.entity, active: true },
        orderBy: { order: "asc" },
      }),
    ),

  /** All definitions (incl. inactive) for the admin management screen. */
  listAll: permissionProcedure("settings.fields")
    .input(z.object({ entity: z.enum(CUSTOM_FIELD_ENTITY) }))
    .query(({ ctx, input }) =>
      ctx.prisma.fieldDefinition.findMany({
        where: { entity: input.entity },
        orderBy: { order: "asc" },
      }),
    ),

  create: permissionProcedure("settings.fields")
    .input(fieldDefinitionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const dup = await ctx.prisma.fieldDefinition.findUnique({
        where: { entity_key: { entity: input.entity, key: input.key } },
      });
      if (dup) throw errors.conflict("A field with this key already exists for this entity");
      return ctx.prisma.fieldDefinition.create({
        data: { ...input, options: input.options ?? undefined },
      });
    }),

  update: permissionProcedure("settings.fields")
    .input(fieldDefinitionUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, options, ...rest } = input;
      return ctx.prisma.fieldDefinition.update({
        where: { id },
        data: { ...rest, ...(options !== undefined ? { options } : {}) },
      });
    }),

  remove: permissionProcedure("settings.fields")
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.fieldDefinition.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
