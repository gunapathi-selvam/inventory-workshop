/**
 * Edge-safe Auth.js config (no DB / no bcrypt imports) so it can be used by
 * Next.js middleware. The Credentials provider with DB access is added in
 * ./index.ts which runs in the Node runtime only.
 */
import type { NextAuthConfig } from "next-auth";
import type { Role } from "@workshop/core";

// Augment the session shape (this module resolves cleanly). JWT custom claims
// are handled with casts in the callbacks to avoid depending on the
// "next-auth/jwt" subpath types, which are not exposed in this v5 beta.
declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role; name?: string | null; email?: string | null };
  }
  interface User {
    role: Role;
  }
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [], // real providers added in ./index.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token as { uid?: string }).uid ?? "";
        session.user.role = (token as { role?: Role }).role ?? "HANDLER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
