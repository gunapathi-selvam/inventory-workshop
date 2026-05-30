# Project handoff / chat continuation

Paste this into a new chat (or say: "read HANDOFF.md") to continue without losing context.

## What this project is
A **Turborepo + pnpm monorepo** ("Workshop" — a 3D‑printing workshop manager).
- **apps/web** — Next.js 15 + React 19 + tRPC v11 + Prisma (SQLite, Postgres‑ready) + Auth.js (JWT). Working.
- **apps/mobile** — Expo SDK 53 / React Native 0.79 / expo-router v5. Reuses the shared tRPC API **types**, validators, and `@workshop/core`. Built, typechecks, bundles.
- **packages/**: `api` (tRPC routers/services), `auth` (Auth.js + mobile JWT), `core` (constants/env/money/permissions/errors), `db` (Prisma), `validators` (Zod), `ui` (web design tokens).

## Current machine / location
Working on **`D:\WORK\inventory-workshop`** (personal Windows PC that has **Android Studio + Flutter**, so Android SDK + JDK 17 are present). Android SDK at `C:\Users\Guna\AppData\Local\Android\Sdk`.

## Decision log (important)
- **Stay on React Native, NOT Flutter.** Reason: the whole point of the monorepo is the shared, type‑safe TypeScript layer (tRPC types, validators, core). Flutter = Dart rewrite, no tRPC reuse, two‑language maintenance, and it would NOT fix the real blocker (dev‑time device connectivity).
- Mobile auth = **bearer token (JWT)**, because the web's Auth.js cookies don't work cleanly on native. The shared tRPC context accepts cookie OR `Authorization: Bearer`.

## What's already built/done
- Full mobile app: login, dashboard, orders (list+detail w/ status change), customers (list+detail), inventory (list+detail w/ stock adjust), notifications, discounts, users, "more" (theme + logout).
- **Centralized design system** in `apps/mobile/src/theme/` — one file per token segment (palette, colors, typography, spacing, radii, shadows, sizing, opacity) + `ThemeProvider`/`useTheme`. No literal style values in components.
- **Startup‑bug fixes (done):** `GestureHandlerRootView` + `react-native-gesture-handler` import in `app/_layout.tsx`; AuthGate redirect gated on `useRootNavigationState()`; `SecureStore` restore wrapped in try/catch; a themed **ErrorBoundary** (so crashes show a readable message, not a white screen).
- **Security hardening (done, verified):**
  - `packages/core/src/env.ts` — production refuses to boot if `AUTH_SECRET` is weak/placeholder (<32 chars or contains `change-me`); dev only warns.
  - `apps/mobile/app.config.ts` (replaced static plugin in app.json) — Android `usesCleartextTraffic` is auto‑ON only for `http://` URLs, OFF for `https://`.
  - `apps/mobile/eas.json` — `preview` (APK, http LAN) and `production` (app‑bundle, https) profiles.
  - `packages/db/prisma/seed.ts` — demo users + `override123` only seed when NOT production; prod bootstraps one admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
  - Mobile token TTL 30d → **7d** (`packages/auth/src/token.ts`).
  - `apps/web` has a `dev:https` script. Full details in **SECURITY.md**.

## Recent changes (2026‑05‑31 session) — UI + cleanup
- **Mobile bottom nav fix:** the tab bar overlapped the Android system nav buttons (Expo SDK 53
  draws edge‑to‑edge). `app/(tabs)/_layout.tsx` now adds `useSafeAreaInsets().bottom` to the tab
  bar `height` and `paddingBottom`, lifting the tabs above the system buttons.
- **Dark/light mode persisted on BOTH apps:**
  - Mobile: `src/theme/ThemeProvider.tsx` now persists the system/light/dark choice to
    `expo-secure-store` (key `workshop.themePreference`) and restores it on launch; the first
    paint is held until the saved value is read so a forced theme doesn't flash. Toggle UI already
    lives in the **More** tab. Removed the unused `toggle()` from the theme context.
  - Web: added **`next-themes`** (`attribute="class"`, `enableSystem`) in `app/providers.tsx`; the
    dark token set in `packages/ui/src/tokens.css` was already complete. New `ThemeToggle`
    (sun/moon) in the topbar. `globals.css` adds a 200ms color transition (reduced‑motion aware)
    for a seamless switch; next-themes' pre‑paint script prevents FOUC on load.
- **Cleanups (no behavior change):** removed dead `cuidLike` export (`packages/validators`);
  memoized the mobile `PermissionsProvider` map (was re‑rendering every `useCan()` consumer — web
  already did this); extracted the duplicated React Query defaults to
  `QUERY_CLIENT_OPTIONS` in `@workshop/core` (used by both tRPC clients); fixed a stale
  `useThemedStyles()` reference in the theme docstring + mobile README. Both apps typecheck clean.

## Monorepo build gotchas (don't regress these)
- **`.npmrc` uses `node-linker=hoisted`** — required for Metro/Expo under pnpm. Don't switch back to isolated.
- **`apps/mobile/metro.config.js`** has a custom resolver mapping relative `*.js` imports → `.ts` sources (the shared packages use ESM `.js` specifiers).
- **`@expo/metro-runtime`** must stay a mobile dependency.
- Mobile `start` script sets **`EXPO_NO_DEPENDENCY_VALIDATION=1`** (via cross‑env) to dodge a Node‑24 Expo‑CLI crash (`Body is unusable`). Use Node 20 LTS if possible.
- `pnpm dev` runs the **web app only**; the mobile app is launched separately (`pnpm dev:mobile`).

## DEV-ON-DEVICE: SOLVED (how to run on a physical phone)
The "Failed to download remote update" / `java.io.IOException` saga is **resolved**. Root
causes and the working setup:

- The error was **network**, not the app: the phone couldn't pull the JS bundle from the PC.
- On this Wi‑Fi the phone can reach the PC **only via the adb-reverse tunnel** — direct LAN
  access to `http://<PC-LAN-IP>:3000` is **blocked** (Windows Firewall not allowing inbound
  on the private network; possibly AP isolation). Confirmed: phone browser loads
  `http://localhost:3000` (reverse) but NOT `http://192.168.1.6:3000`.
- So the API URL **must stay `http://localhost:3000`** (NOT the LAN IP) and ride adb reverse.

**Working run sequence (USB cable is most reliable; wireless adb stalls large transfers):**
```powershell
adb devices                      # confirm device, "device" not "unauthorized"
adb reverse tcp:8081 tcp:8081    # Metro bundle
adb reverse tcp:3000 tcp:3000    # tRPC API
adb reverse --list               # verify both survived (they drop on reconnect/lock)
cd apps\mobile
$env:EXPO_PUBLIC_API_URL="http://localhost:3000"
npx expo start -c --host localhost   # -c clears cache so the inlined URL updates
# press 'a', or open exp://localhost:8081 in Expo Go — do NOT scan the QR (it uses the LAN IP)
```
Gotchas that bit us: `EXPO_PUBLIC_*` is inlined at bundle time → set it in the SAME shell and
use `-c`. `cross-env` only works inside pnpm scripts, not as a bare PowerShell command (set
`$env:` natively instead). Use **Node 20**, not 24.

## Crash fix: `Cannot read property 'getState' of undefined`
Was an **expo-router/react-native version skew**, not app code. Fixed by aligning to the SDK 53
versions: `npx expo install expo-router react-native-screens react-native`. (Keep the deliberate
`metro.config.js` overrides — expo-doctor flags them but they're required for the pnpm monorepo.)

## STILL OPEN: local Gradle APK build
`expo prebuild` + `gradlew assembleRelease` still fails with **`java.io.IOException: The
filename, directory name, or volume label syntax is incorrect`** during RN autolinking — the
known pnpm‑monorepo‑on‑Windows path bug. **Don't sink more time here; use EAS instead.**

## SHARING THE APK + UPGRADES (the path forward)
Dev-time connectivity does NOT carry into distribution — a standalone APK has no Metro/QR/adb.
But it must reach an API the testers' phones can actually hit:
- Same‑Wi‑Fi demo: bake `http://<PC-LAN-IP>:3000` AND open the firewall (see below). LAN-only,
  PC must be running. **Currently blocked until the firewall rule is added.**
- Real sharing: **deploy the Next.js backend** to a public https URL (Postgres-ready) and bake
  that. Works anywhere.

Build + share (sidesteps the Windows Gradle bug):
```powershell
cd apps\mobile
# set eas.json preview.env.EXPO_PUBLIC_API_URL → LAN IP (firewall open) or deployed https URL
npx eas-cli login
npx eas-cli build -p android --profile preview   # returns a shareable APK download link
```
Upgrades: add **`expo-updates`** (NOT yet installed) → `eas update` ships JS-only changes OTA
with no reinstall; only native changes need a fresh `eas build`. This is the fix for "every
change is a headache."

Optional — open the firewall for same-Wi‑Fi sharing (run PowerShell as admin):
```powershell
New-NetFirewallRule -DisplayName "Node dev 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "Metro 8081"    -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
```

## Cheat sheet
- Get PC LAN IP: `ipconfig` → IPv4 Address (the `Network` URL `pnpm dev` prints).
- Run backend: `pnpm dev` (http://localhost:3000). Restart it after `pnpm run setup:env` (just done — AUTH_SECRET regenerated; old tokens invalidated, log in again).
- Demo logins (dev only): `admin@workshop.local / admin123`, manager/`manager123`, handler/`handler123`. Override password: `override123`.
- Emulator API URL = `http://10.0.2.2:3000`; physical phone over Wi‑Fi = `http://<PC-LAN-IP>:3000`; USB/wireless+adb reverse = `http://localhost:3000`.
- Local APK doc: `apps/mobile/BUILD_ANDROID.md`. Security: `SECURITY.md`. Mobile README: `apps/mobile/README.md`.

## Open question for the next chat
"Failed to download remote update" in Expo Go = the phone can't pull the bundle from the PC. Resolve via adb reverse (USB/wireless) or EAS. If a NEW error appears after the bundle loads, it'll show in the **Metro terminal** and on the device via the ErrorBoundary — capture that text.
