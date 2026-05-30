import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { idSchema } from "@workshop/validators";

export const notificationRouter = router({
  list: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().default(false) }).optional())
    .query(({ ctx, input }) =>
      ctx.prisma.notification.findMany({
        where: { userId: ctx.user.id, ...(input?.unreadOnly ? { read: false } : {}) },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ),

  unreadCount: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.notification.count({ where: { userId: ctx.user.id, read: false } }),
  ),

  markRead: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.notification.updateMany({
        where: { id: input.id, userId: ctx.user.id },
        data: { read: true },
      }),
    ),

  markAllRead: protectedProcedure.mutation(({ ctx }) =>
    ctx.prisma.notification.updateMany({
      where: { userId: ctx.user.id, read: false },
      data: { read: true },
    }),
  ),
});
