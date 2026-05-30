import { router, protectedProcedure } from "../trpc.js";
import { getEffectivePermissions } from "@workshop/auth";

export const authRouter = router({
  /** Current session user. */
  me: protectedProcedure.query(({ ctx }) => ctx.user),

  /** Effective permission map for the current user (drives UI gating). */
  myPermissions: protectedProcedure.query(({ ctx }) =>
    getEffectivePermissions(ctx.user.id, ctx.user.role),
  ),
});
