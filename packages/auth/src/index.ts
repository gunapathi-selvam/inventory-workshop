/**
 * Main Auth.js instance (Node runtime). Adds the Credentials provider backed by
 * the database + bcrypt. Exports the handlers/auth/signIn/signOut used by the
 * web app, plus a `requireUser` helper for server components and the tRPC ctx.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@workshop/db";
import { errors, type Role } from "@workshop/core";
import { loginSchema } from "@workshop/validators";
import { verifySecret } from "./password.js";
import { authConfig } from "./config.js";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.deletedAt || user.status !== "ACTIVE") return null;

        const ok = await verifySecret(user.passwordHash, password);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role as Role };
      },
    }),
  ],
});

export interface SessionUser {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
}

/** Returns the current session user or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ? (session.user as SessionUser) : null;
}

/** Returns the current user or throws an AUTH error (use in protected code). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw errors.auth();
  return user;
}

export { authConfig } from "./config.js";
export * from "./permissions.js";
export * from "./password.js";
