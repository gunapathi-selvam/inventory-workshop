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
import { getCurrentUser, requirePermission, type SessionUser } from "@workshop/auth";
import { toAppError, type PermissionKey } from "@workshop/core";

export interface Context {
  user: SessionUser | null;
  prisma: typeof prisma;
}

/** Builds the request context. `headers` reserved for future per-request needs. */
export async function createContext(): Promise<Context> {
  const user = await getCurrentUser();
  return { user, prisma };
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

/** Procedure factory enforcing a permission key. */
export function permissionProcedure(key: PermissionKey) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    await requirePermission(ctx.user, key);
    return next();
  });
}

export { ZodError };
