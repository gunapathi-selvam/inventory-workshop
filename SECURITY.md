# Security

This document covers the security model for local development and the checklist
for a safe production deployment.

## Threat model in one paragraph

Auth uses bcrypt-hashed passwords, a signed token (Auth.js JWT session for web; a
`jose` HS256 bearer token for mobile, stored in the OS keychain), and every tRPC
procedure enforces permissions server-side. The two things that need care are
**(1) the signing secret** — if it's weak/known, tokens can be forged — and
**(2) transport encryption** — plain `http://` traffic can be read on a shared
network. Everything below hardens those two.

## The signing secret (`AUTH_SECRET`) — most important

`AUTH_SECRET` signs both the web session and the mobile bearer token.

- **Production refuses to boot** with a weak/placeholder secret. `packages/core/src/env.ts`
  rejects a secret that is shorter than 32 chars or contains `change-me` /
  `dev-only-insecure-secret` when `NODE_ENV=production`.
- **Local:** run `pnpm run setup:env` — it generates a strong random secret
  (`randomBytes(32)`) and writes it to `apps/web/.env.local` and
  `packages/db/.env`. You'll see a one-time console warning until you do.
- Generate manually if needed: `openssl rand -base64 32`.

## Transport security (local dev)

Plain HTTP is fine **only** if the traffic never crosses an untrusted network.
Pick one:

### Recommended — USB loopback (no certificates)
Keeps all traffic on the USB cable / loopback, never on Wi‑Fi:
```bash
adb reverse tcp:3000 tcp:3000          # phone's localhost:3000 → your PC
# build/run the app with EXPO_PUBLIC_API_URL=http://localhost:3000
```
The Android **emulator** is equivalently safe via `http://10.0.2.2:3000`
(host-loopback, not broadcast on Wi‑Fi).

### Full TLS locally (encryption over Wi‑Fi)
Only needed if you must test over real Wi‑Fi with encryption:
1. `pnpm --filter @workshop/web dev:https` (Next.js auto-generates a local cert),
   or generate one with [mkcert].
2. Install that dev root CA on the phone/emulator so it trusts the cert.
3. Build the app with `EXPO_PUBLIC_API_URL=https://<PC-LAN-IP>:3000`.

> Cleartext is **automatic**: `apps/mobile/app.config.ts` enables Android
> `usesCleartextTraffic` only when the API URL is `http://`. An `https://` build
> ships with cleartext **off**, so you can't accidentally release an app that
> allows unencrypted traffic.

## Production checklist

1. **Serve the API over HTTPS.** Deploy the Next.js app to a host that terminates
   TLS for you (Vercel / Render / Railway / Fly / a VPS behind Caddy/Nginx). No
   TLS code needed in the app.
2. **Use Postgres.** Set Prisma `provider = "postgresql"` in
   `packages/db/prisma/schema.prisma` and point `DATABASE_URL` at Postgres. The
   schema is already portable (money is integer minor units, enums are strings).
3. **Set strong env vars** on the host:
   - `AUTH_SECRET` = `openssl rand -base64 32`
   - `APP_URL` = `https://your-domain`
   - `NODE_ENV=production`
4. **Seed without demo data.** With `NODE_ENV=production` (or `SEED_DEMO=false`)
   the seed skips demo users and the `override123` password. Bootstrap one admin
   securely via `ADMIN_EMAIL` + `ADMIN_PASSWORD` (and optional `ADMIN_NAME`), then
   set the manual price-override password in **Settings → Pricing**
   (or seed it with `PRICE_OVERRIDE_PASSWORD`).
5. **Build the mobile app for production:**
   `eas build -p android --profile production` — the `production` profile in
   `apps/mobile/eas.json` points at your `https://` API (cleartext off). Edit the
   URL there first.

## Token lifetime

Mobile bearer tokens last **7 days** (`packages/auth/src/token.ts`) and are
stored in the OS keychain (`expo-secure-store`). There is currently **no refresh
or server-side revocation** — an expired token simply forces re-login. Adding a
refresh-token endpoint and a revocation list is a recommended future enhancement
if you need to invalidate sessions on demand.

## Reporting

This is an internal project; report security concerns to the repository owner.

[mkcert]: https://github.com/FiloSottile/mkcert
