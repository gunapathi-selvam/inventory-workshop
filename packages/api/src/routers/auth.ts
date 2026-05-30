import { router, protectedProcedure, baseProcedure } from "../trpc.js";
import { getEffectivePermissions, verifySecret, signMobileToken } from "@workshop/auth";
import { loginSchema } from "@workshop/validators";
import { errors, type Role } from "@workshop/core";

export const authRouter = router({
  /**
   * Credential login for non-cookie clients (mobile). Mirrors the web's
   * Auth.js Credentials provider, but returns a bearer token the app stores
   * and sends on every request. Public — this is how a client gets a token.
   */
  login: baseProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || user.deletedAt || user.status !== "ACTIVE") throw errors.auth("Invalid credentials");

    const ok = await verifySecret(user.passwordHash, input.password);
    if (!ok) throw errors.auth("Invalid credentials");

    const session = { id: user.id, role: user.role as Role, name: user.name, email: user.email };
    const token = await signMobileToken(session);
    return { token, user: session };
  }),

  /** Current session user. */
  me: protectedProcedure.query(({ ctx }) => ctx.user),

  /** Effective permission map for the current user (drives UI gating). */
  myPermissions: protectedProcedure.query(({ ctx }) =>
    getEffectivePermissions(ctx.user.id, ctx.user.role),
  ),
});
