# Workshop — 3D Printing Management Platform

A future-proof, single-application manager for a 3D printing workshop: customers,
orders, filament inventory, profit/loss, a team with roles, dashboards, and a
runtime-extensible data model. Built as a monorepo so a mobile app and additional
businesses can reuse the same business logic later.

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Web | Next.js 15 (App Router) + React 19 + TypeScript |
| API | tRPC v11 (type-safe) consumed via TanStack Query |
| DB | Prisma + SQLite (Postgres-ready) |
| Auth | Auth.js (NextAuth v5), credentials + JWT sessions, bcrypt |
| Styling | Tailwind CSS + CSS-variable design tokens (no static values) + shadcn-style components |
| Charts | Recharts |

## Project layout

```
apps/
  web/                Next.js app (UI + API route handlers)
  mobile/             Expo / React Native app (see apps/mobile/README.md)
packages/
  core/               errors (single module), env, logger, constants, permission registry, money
  db/                 Prisma schema, client, seed
  validators/         shared Zod schemas (client + server)
  auth/               Auth.js config, bcrypt, permission resolver (role + per-user override)
  api/                tRPC routers (one controller per domain) + services (business logic)
  ui/                 design tokens + Tailwind preset + components
```

## Getting started

Prerequisites: Node 20+, pnpm (via `corepack enable`).

```bash
# 1. Install
pnpm install

# 2. Create the SQLite DB + seed demo data (admin user, filament, orders…)
pnpm db:push
pnpm db:seed

# 3. Run the web app + API (http://localhost:3000)
pnpm dev          # runs ONLY the web app/API (not Metro)

# 4. Run the mobile app — in a SECOND terminal
pnpm dev:mobile   # = pnpm --filter @workshop/mobile start (expo start --offline)
#   then press i (iOS sim), a (Android emulator), or scan the QR with Expo Go
```

> **Why two terminals?** Metro (the React Native bundler) is a long-running,
> interactive process, so the mobile app is intentionally **not** part of
> `pnpm dev`/`turbo run dev` — otherwise a Metro hiccup would take the web
> server down with it. The mobile `start` script sets
> `EXPO_NO_DEPENDENCY_VALIDATION=1` to skip Expo's remote dependency-version
> check (which crashes on Node 24) while staying online for Expo Go.
>
> If Expo Go shows **"Something went wrong"**, the phone can't reach your
> computer — check same Wi-Fi + Windows Firewall, or use a tunnel:
> `pnpm --filter @workshop/mobile run start:tunnel`. See
> [`apps/mobile/README.md`](apps/mobile/README.md#troubleshooting-expo-go-says-something-went-wrong).

**On a physical phone** (Expo Go), `localhost` points at the phone, so set your
computer's LAN IP — the web app prints it on boot as the `Network` URL:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.6:3000 pnpm dev:mobile
```

See [`apps/mobile/README.md`](apps/mobile/README.md) for the mobile app's
architecture and centralized design-token system.

Environment files (already created for local dev):
- `packages/db/.env` — `DATABASE_URL` for the Prisma CLI
- `apps/web/.env.local` — `DATABASE_URL`, `AUTH_SECRET`, SMTP, etc.
  See `.env.example`. **Change `AUTH_SECRET` before any non-local use.**

### Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | admin@workshop.local | admin123 |
| Manager | manager@workshop.local | manager123 |
| Handler | handler@workshop.local | handler123 |

Manual price-override password: `override123` (change in Settings → Pricing).

## Key features

- **Orders** with a 3-mode pricing engine, all supporting discounts:
  1. **Preset** — uses the filament's stored rate (+ optional machine time, labor, margin)
  2. **Direct rate** — admin enters ₹/gram per line: `(grams × rate) × qty`
  3. **Manual** — admin types the final price; gated by the override password
  Confirming an order **decrements filament stock** (transactional) and raises a
  **low-stock notification** when a filament crosses its threshold.
- **Inventory** — filament type/color, sell & cost rate per gram, stock with full
  movement history and threshold alerts.
- **Access control (two layers)** — role defaults **plus** per-user overrides that
  win over the role. Edit both from **Settings → Access control**. Enforced on the
  server (tRPC `permissionProcedure`), at the page (server layout), and in the UI (`useCan`).
- **Runtime custom fields** — define/remove fields for customers, users and orders
  from **Settings → Custom fields** with no code change; they appear automatically
  on the relevant forms.
- **Dashboard** — revenue/profit trend, orders by status, low-stock list, recent orders.
- **Notifications** — per-user bell + panel; email is wired (Nodemailer) and off by
  default (point SMTP at Mailpit for local testing).
- **Centralized error handling** — one module (`packages/core/errors.ts`) normalizes
  every error into a consistent client shape.

## Scripts

```bash
pnpm dev            # run the web app
pnpm build          # build all packages/apps
pnpm typecheck      # type-check everything
pnpm db:studio      # open Prisma Studio
pnpm db:seed        # reseed demo data
```

## Move to another machine (code + database + data)

The whole app is portable. The database is a **single SQLite file**
(`packages/db/prisma/dev.db`); `node_modules` is reinstalled, not copied; and
`pnpm run setup:env` regenerates the machine-specific `.env` files automatically.

### Option A — Zip the folder (simplest, includes the data)

On the **old** machine (PowerShell), make an archive that includes `dev.db` but
skips the heavy/rebuildable folders:

```powershell
cd "C:\New folder"
tar --exclude=node_modules --exclude=.next --exclude=.turbo -czf workshop-export.tgz sca1
```

Copy `workshop-export.tgz` to the **new** machine (USB / cloud / network), then:

```powershell
tar -xzf workshop-export.tgz          # extracts the sca1 folder
cd sca1
corepack enable                       # enables pnpm (ships with Node 20+)
pnpm install                          # restore dependencies
pnpm run setup:env                    # writes .env files for THIS machine's path
pnpm db:generate                      # generate the Prisma client
pnpm dev                              # http://localhost:3000 — your data is there
```

Your customers, orders, inventory, users — everything — comes across because
`dev.db` was in the archive. **Do not** run `pnpm db:seed` (that's only for a
fresh/empty database).

### Option B — Git for code + copy the DB file for data

`.gitignore` excludes `node_modules`, `.next`, **and `*.db`** — so Git carries
the code but **not** your data. Push the code, then move the DB file separately.

Old machine:
```powershell
cd "C:\New folder\sca1"
git init; git add .; git commit -m "Workshop app"
gh repo create workshop --private --source=. --push   # or: git remote add origin <url>; git push -u origin main
```

New machine:
```powershell
git clone <your-repo-url> sca1
cd sca1
corepack enable
pnpm install
pnpm run setup:env
pnpm db:generate
# bring your DATA over: copy dev.db from the old machine to:
#   packages\db\prisma\dev.db        (USB/cloud — it is NOT in Git)
pnpm dev
```

If you skip copying `dev.db`, run `pnpm db:push && pnpm db:seed` instead for a
fresh database with demo data.

### Notes
- **Node 20+** must be installed on the new machine; `corepack enable` provides pnpm.
- `pnpm run setup:env` keeps an existing `AUTH_SECRET` or generates a strong new
  one, and fixes `DATABASE_URL` to the new absolute path automatically — no manual
  editing needed.
- Backing up your data anytime = copy `packages/db/prisma/dev.db` somewhere safe.
- The whole `pnpm setup` shortcut (`install → setup:env → generate → push → seed`)
  is for a **fresh** install; for a data move, follow the steps above instead.

## Future-proofing

- **Mobile**: shipped in `apps/mobile` — an Expo/React Native app that reuses
  `packages/api` (same tRPC `AppRouter`), `packages/validators`, and
  `packages/core`. It authenticates with a bearer token (the shared tRPC context
  accepts either an Auth.js cookie or `Authorization: Bearer`) and has its own
  centralized design-token system mirroring the web tokens. `pnpm dev` runs
  only the web app/API; start the mobile app separately with `pnpm dev:mobile`.
- **Multi-business**: every record carries a nullable `businessId` — enable tenant
  scoping later with no migration.
- **Postgres**: change the Prisma datasource `provider` to `postgresql` and point
  `DATABASE_URL` at Postgres. Money is stored as integer minor units and enums as
  validated strings, so nothing is SQLite-specific.
