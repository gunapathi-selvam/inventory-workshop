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

# 3. Run
pnpm dev          # http://localhost:3000
```

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

- **Mobile**: `packages/api` + `packages/validators` + `packages/ui` tokens are
  framework-agnostic and reusable by an Expo/React Native app.
- **Multi-business**: every record carries a nullable `businessId` — enable tenant
  scoping later with no migration.
- **Postgres**: change the Prisma datasource `provider` to `postgresql` and point
  `DATABASE_URL` at Postgres. Money is stored as integer minor units and enums as
  validated strings, so nothing is SQLite-specific.
