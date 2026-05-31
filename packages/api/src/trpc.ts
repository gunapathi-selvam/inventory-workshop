/**
 * tRPC initialization: context, error formatting (every error normalized to an
 * AppError shape), and the procedure tiers used across all routers:
 *   publicProcedure        — no auth
 *   protectedProcedure     — requires a session
 *   permissionProcedure(k) — requires a specific permission key
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@workshop/db";
import {
  getCurrentUser,
  getEffectivePermissions,
  assertPermission,
  verifyMobileToken,
  type SessionUser,
  type PermissionMap,
} from "@workshop/auth";
import { toAppError, type PermissionKey } from "@workshop/core";

export interface Context {
  user: SessionUser | null;
  prisma: typeof prisma;
  /** Effective permission map, resolved once per request (null when no user). */
  permissions: PermissionMap | null;
}

/**
 * Builds the request context. Two auth paths share one context:
 *   - web  → Auth.js session cookie (resolved by getCurrentUser)
 *   - mobile → `Authorization: Bearer <token>` (resolved by verifyMobileToken)
 * A valid bearer token wins; otherwise we fall back to the cookie session.
 */
export async function createContext(opts?: { token?: string | null }): Promise<Context> {
  let user: SessionUser | null = null;
  if (opts?.token) user = await verifyMobileToken(opts.token);
  if (!user) user = await getCurrentUser();
  // Resolve permissions ONCE per request. tRPC batches several procedures into
  // one HTTP request sharing this context, so every permissioned procedure reads
  // this cached map instead of re-querying RolePermission + overrides each time.
  const permissions = user ? await getEffectivePermissions(user.id, user.role) : null;
  return { user, prisma, permissions };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const app = toAppError(error.cause ?? error);
    const client = app.toClient();
    return {
      ...shape,
      data: {
        ...shape.data,
        appError: client,
        code: client.code,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
/** Build a server-side caller (used by RSC pages to fetch via the router directly). */
export const createCallerFactory = t.createCallerFactory;

/** Translate thrown AppErrors into TRPCErrors so the formatter can read them. */
const errorBoundary = middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    const app = toAppError(err);
    throw new TRPCError({
      code:
        app.code === "AUTH"
          ? "UNAUTHORIZED"
          : app.code === "FORBIDDEN"
            ? "FORBIDDEN"
            : app.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : app.code === "VALIDATION"
                ? "BAD_REQUEST"
                : "INTERNAL_SERVER_ERROR",
      message: app.message,
      cause: app,
    });
  }
});

const baseProcedure = publicProcedure.use(errorBoundary);

const requireAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export { baseProcedure };
export const protectedProcedure = baseProcedure.use(requireAuth);

/** Procedure factory enforcing a permission key (reads the per-request map). */
export function permissionProcedure(key: PermissionKey) {
  return protectedProcedure.use(({ ctx, next }) => {
    assertPermission(ctx.permissions, key);
    return next();
  });
}

export { ZodError };
