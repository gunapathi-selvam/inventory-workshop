/**
 * Stateless bearer tokens for non-cookie clients (the mobile app).
 *
 * The web app authenticates with Auth.js session cookies; a native app cannot
 * use those cleanly, so it sends `Authorization: Bearer <token>` instead. These
 * are short JWTs signed with the same AUTH_SECRET (via `jose`, already pulled in
 * by next-auth) and carry exactly the SessionUser claims the tRPC context needs.
 */
import { SignJWT, jwtVerify } from "jose";
import { env, type Role } from "@workshop/core";
import type { SessionUser } from "./index.js";

const ALG = "HS256";
const ISSUER = "workshop";
const AUDIENCE = "workshop-mobile";

/** Default token lifetime; mobile re-logs in after this. Kept short to limit the
 *  blast radius if a token leaks (there is no refresh/revocation yet — that's a
 *  documented future enhancement in SECURITY.md). */
export const MOBILE_TOKEN_TTL = "7d";

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

/** Sign a bearer token carrying the session user's identity + role. */
export async function signMobileToken(
  user: SessionUser,
  expiresIn: string = MOBILE_TOKEN_TTL,
): Promise<string> {
  return new SignJWT({
    role: user.role,
    name: user.name ?? null,
    email: user.email ?? null,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(secretKey());
}

/** Verify a bearer token, returning the SessionUser or null if invalid/expired. */
export async function verifyMobileToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      role: (payload.role as Role) ?? "HANDLER",
      name: (payload.name as string | null) ?? null,
      email: (payload.email as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
