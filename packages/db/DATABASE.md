# Database, seeding & safe-update guide

How the Workshop database is created, seeded, and **safely updated** — especially
the difference between a throwaway **dev** DB (seed = dummy data, fine to wipe) and
a **production** DB (real data, must never be reset).

Read this before running any `db:*` command on a machine that has data you care about.

---

## TL;DR

| Situation | Command | Destructive? |
|-----------|---------|--------------|
| First-time dev setup on a new machine | `pnpm db:generate && pnpm db:migrate` (auto-seeds) | No (DB is empty) |
| Made a schema change (dev) | `pnpm db:migrate` → name the migration (auto-applies + seeds) | No — generates + applies a migration |
| Pulled new migrations (dev) | `pnpm db:generate && pnpm db:migrate` | No — applies pending migrations |
| Dev DB is broken / half-seeded | `pnpm --filter @workshop/db exec prisma migrate reset` | **YES — wipes everything, then re-applies + re-seeds** |
| Production schema update | **migrations** (see [Production](#production-safe-updates)) | No (if done right) |
| Production data/permissions refresh | `pnpm db:seed` with `NODE_ENV=production` | No — upsert-only, no demo data |

**Golden rule:** `--force-reset` and a demo `db:seed` are **dev-only**. Never run either
against production.

---

## How this project manages schema (important context)

- **Provider:** SQLite now (`packages/db/prisma/dev.db`), Postgres-ready later
  (change `provider` + `DATABASE_URL`, no model changes — see the schema header).
- **The dev DB file is gitignored.** `git pull` brings the *schema and code*, never the
  database. Every machine builds its own DB. (This is why a freshly-cloned machine hits
  `P2021: table ... does not exist` until `db:push` runs.)
- **Migrations are now in use.** The `prisma/migrations/` folder exists with an
  `…_init` baseline (created 2026-05-31). Schema changes should go through
  `prisma migrate dev` (dev) and `prisma migrate deploy` (prod) so production gets a
  reviewed, forward-only, history-tracked update path.
- `prisma db push` (no history, syncs the DB directly to the schema) is still handy for
  quick **dev** experiments, but **don't** use it against production — a drifted column
  can trigger a data-losing reset. Prefer `migrate` everywhere now that the baseline exists.

---

## First-time setup (new dev machine)

This is what fixes the `The table main.RolePermission does not exist` error:

```powershell
# from repo root
pnpm install
pnpm run setup:env     # generates .env / AUTH_SECRET (one-time)
pnpm db:generate       # regenerate Prisma client
pnpm db:migrate        # apply migrations -> creates tables AND auto-runs the seed
```

`pnpm db:migrate` (= `prisma migrate dev`) applies the committed migrations to your fresh
DB and then runs the seed automatically (via `package.json#prisma.seed`), so demo data is
loaded in one step.

> `pnpm run setup` still chains the older `db:push` + `db:seed` path; it works on a fresh
> DB but does not record migration history. Prefer `db:migrate` now that migrations exist.

Demo logins seeded (dev only): `admin@workshop.local / admin123`,
`manager@workshop.local / manager123`, `handler@workshop.local / handler123`.
Manual price-override password: `override123`.

---

## What the seed does (and what is safe to re-run)

`packages/db/prisma/seed.ts` splits into two halves, gated by `SEED_DEMO`
(`= NODE_ENV !== "production"` unless `SEED_DEMO` is set explicitly):

**Always runs (both dev & prod) — fully idempotent, upsert-only:**
- `seedPermissions()` — the role → permission matrix from the `@workshop/core` registry.
  Uses `upsert` with `update: {}`, so **re-seeding adds any new permission keys without
  clobbering an admin's edits.** This is the safe way to roll out a new permission.
- `seedSettings()` — currency, rates, override-password hash. Upsert, `update: {}`.

**Demo half (dev only, `SEED_DEMO=true`):**
- `seedUsers()`, `seedCustomers()`, `seedDiscounts()` — **upsert** (safe to re-run).
- `seedFilaments()`, `seedOrders()` — **`create()`, NOT upsert.** ⚠️ Re-running on a DB
  that already has them throws a unique-constraint error (e.g. duplicate `orderNumber`).
  This is the usual cause of a "seed failed" on a second run. Fix = reset (dev) or just
  don't re-seed.

> So: the **permissions/settings** seed is something you *can* safely run any time,
> including production. The **demo** seed is one-shot per fresh dev DB.

---

## Future schema changes — DEV

When you change `schema.prisma`, generate a migration (it applies + auto-seeds):

```powershell
pnpm db:migrate     # = prisma migrate dev; prompts for a migration name, applies it
```

When you **pull** someone else's new migrations:

```powershell
pnpm db:generate
pnpm db:migrate     # applies any pending migrations
```

Adding a **new permission key** in `@workshop/core`? The permissions upsert in the seed
picks it up — but the demo `create()` rows collide on an already-seeded DB and abort the
run. To roll out just the new permission without a full reset, run the permission upsert
in isolation (or reset the dev DB).

**If your dev DB is wedged / half-seeded** (and you don't care about its data):

```powershell
pnpm --filter @workshop/db exec prisma migrate reset   # ⚠️ drops everything, re-applies migrations, re-seeds
```

(The old `pnpm db:push --force-reset && pnpm db:seed` still works, but `migrate reset`
also restores migration history and runs the seed for you.)

---

## Production: safe updates

The dev workflow above (`db push`, demo `db:seed`, `--force-reset`) will **destroy
production data**. Use this instead.

### Migration baseline — DONE

The initial baseline (`prisma/migrations/…_init/`) was created on 2026-05-31 and is
committed. No action needed. From here, schema changes are made with `prisma migrate dev`
(dev) and applied to prod with `prisma migrate deploy` (no prompts, no resets,
forward-only).

> Migrating an **existing** Postgres prod DB that predates migrations? Baseline it once
> with `prisma migrate resolve --applied <migration_name>` so `migrate deploy` doesn't try
> to re-create existing tables. A brand-new prod DB just runs `migrate deploy` from empty.

### Each production update

```powershell
# 1. BACK UP FIRST (Postgres example)
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql      # SQLite: just copy the .db file

# 2. Apply schema changes via migrations — NEVER db push, NEVER --force-reset
pnpm --filter @workshop/db exec prisma migrate deploy

# 3. (Optional) refresh permissions/settings only — safe, upsert-only, NO demo data
$env:NODE_ENV = "production"      # ensures SEED_DEMO=false
pnpm db:seed
```

Step 3 is safe because in production the seed:
- skips all demo users/customers/filaments/orders entirely,
- only upserts the permission matrix (adds new keys, preserves admin edits) and settings,
- bootstraps **one** admin only if `ADMIN_EMAIL` + `ADMIN_PASSWORD` are set (upsert — won't
  duplicate or overwrite an existing admin's password).

You can run step 3 on every deploy to roll out newly-added permissions without touching
real data. If you prefer zero risk, skip it and add new permission rows by hand.

### Production DON'Ts

- ❌ `prisma db push` (can silently drop/recreate columns → data loss on some diffs)
- ❌ `prisma db push --force-reset` (wipes everything)
- ❌ `pnpm db:seed` **without** `NODE_ENV=production` (would attempt to insert demo data)
- ❌ deploying a schema change without a migration + a backup

---

## Quick recovery cheatsheet (DEV only)

```powershell
pnpm db:studio                       # browse/edit data in a GUI
pnpm db:push                         # re-sync schema (non-destructive)
pnpm db:push --force-reset && pnpm db:seed   # nuke & repave
```

## Related docs
- `../../SECURITY.md` — AUTH_SECRET, prod admin bootstrap, cleartext-traffic rules.
- `../../HANDOFF.md` — machine locations, the per-machine "sync" steps, gotchas.
