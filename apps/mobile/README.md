# Workshop — Mobile App

A native iOS/Android client for the Workshop 3D-printing manager, built with
**Expo (React Native)**. It reuses the exact same backend as the web app: the
shared **tRPC** API (`@workshop/api`), **Zod** validators (`@workshop/validators`),
and domain logic (`@workshop/core`) — so both apps are always in sync and
type-safe against one source of truth.

## What's inside

| Concern | Choice |
|---|---|
| Framework | Expo SDK 53 + React Native 0.79 + React 19 |
| Navigation | Expo Router (file-based, `app/`) |
| Data | tRPC v11 client + TanStack Query (same `AppRouter` type as web) |
| Auth | Bearer token (JWT) stored in the OS keychain via `expo-secure-store` |
| Design system | Centralized theme tokens + `useTheme()` (see below) |

## Centralized design system (no hard-coded UI values)

Every color, font, size, radius, shadow, spacing and timing value lives in one
folder — [`src/theme/`](src/theme/) — split into one file per concern. **No
component or screen ever writes a literal color, font size, or pixel value;** it
reads a named token from `useTheme()`.

```
src/theme/
  palette.ts      # the ONLY place raw color literals live (hsl values)
  colors.ts       # semantic color tokens (light + dark) → reference palette
  typography.ts   # font families, type scale, weights, line heights, variants
  spacing.ts      # spacing scale + named layout spacing
  radii.ts        # border-radius scale
  shadows.ts      # elevation/shadow tokens (per scheme)
  sizing.ts       # control heights, icon sizes, borders, avatars, chrome dims
  opacity.ts      # interaction/emphasis opacity tokens
  motion.ts       # animation durations + easings
  theme.ts        # assembles light/dark Theme objects
  ThemeProvider.tsx  # provider + useTheme() / useThemedStyles()
  index.ts        # public surface — import everything from "~/theme"
```

Re-brand the entire app (and keep light/dark in sync) by editing `palette.ts`
and `colors.ts`. Values mirror the web design tokens in
`packages/ui/src/tokens.css`, so web and mobile look identical.

The themed component library in [`src/components/`](src/components/) (Text,
Button, Card, TextField, Badge, Screen, ListRow, StatCard, Chip, …) is built
entirely from these tokens and is what screens compose.

## Features (parity with web)

- **Login** via credentials → bearer token (kept in secure storage).
- **Dashboard** — KPIs, orders-by-status, low-stock alerts, recent orders.
- **Orders** — searchable + status-filtered list, detail with line items,
  pricing breakdown, fulfillment, and permission-gated status changes.
- **Customers** — searchable list, detail with contact actions + recent orders.
- **Inventory** — filament list with low-stock badges, detail with movement
  history and a permission-gated restock/adjust form.
- **Notifications** — per-user list, mark one / mark all read.
- **More** — profile, light/dark/system theme switch, gated links to discount
  codes and team members, sign out.
- **Access control** — tabs and actions hide based on the user's effective
  permissions (`useCan`); the server still enforces every permission.

## Running it

Prerequisites: the repo is installed (`pnpm install` at the root) and the web
app is running so the API is reachable.

```bash
# 1. Start the backend (from the repo root) — hosts the tRPC API.
#    `pnpm dev` runs ONLY the web app/API (Metro is a separate long-running
#    process, so the mobile app is intentionally not part of this pipeline).
pnpm dev            # web app at http://localhost:3000

# 2. Start the mobile app in a SECOND terminal (from the repo root)
pnpm dev:mobile     # alias for: pnpm --filter @workshop/mobile start
#   then press i (iOS sim), a (Android), or scan the QR with Expo Go
```

> The mobile `start` script runs `expo start --offline`. Offline mode skips
> Expo's remote dependency-version check, which crashes on Node 24 with a
> `Body is unusable` undici error. Metro and LAN device connections work
> normally offline.

### Pointing the app at your API

The app talks to the Next.js host that serves `/api/trpc`. Resolution order:

1. `EXPO_PUBLIC_API_URL` env var
2. `extra.apiUrl` in `app.json`
3. `http://localhost:3000`

`localhost` works on the iOS simulator. **On a physical device (Expo Go), set
your machine's LAN IP** so the phone can reach your computer:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000 pnpm dev:mobile
```

### Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | admin@workshop.local | admin123 |
| Manager | manager@workshop.local | manager123 |
| Handler | handler@workshop.local | handler123 |

## How mobile auth works

The web app uses Auth.js session cookies, which a native app can't use cleanly.
Instead the mobile app calls the public `auth.login` tRPC mutation, which
verifies credentials and returns a short JWT signed with the same `AUTH_SECRET`
(see `packages/auth/src/token.ts`). The app stores that token in the OS keychain
and sends it as `Authorization: Bearer <token>` on every request. The shared
tRPC context (`packages/api/src/trpc.ts`) accepts either a bearer token or a
cookie session, so both clients hit the same protected procedures.
