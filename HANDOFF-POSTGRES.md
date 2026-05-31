# HANDOFF — Postgres migration & data-transfer work

**Branch:** `feature/postgres-local`  ·  **Status:** parked, not merged to `main`
**Audience:** future me + Claude, picking this up later (date unknown).

Paste this into a new chat (or say "read HANDOFF-POSTGRES.md") to continue without losing
context. This file is ONLY about the database engine switch (SQLite → Postgres) and the
data-transfer tool. For the broader project, see [HANDOFF.md](HANDOFF.md).

---

## TL;DR — where things stand

- The app currently runs on **SQLite on `main`** (working, has my real data on the other
  machine). I have NOT switched my working setup to Postgres.
- All the **Postgres work is isolated on the `feature/postgres-local` branch** so `main`
  keeps working. Nothing is merged.
- On the branch: the app is wired for **Postgres via Docker**, the migration was
  regenerated for Postgres, and there's a **data export/import tool** so I can move data
  between SQLite and Postgres **without losing it**.
- **I have not run the transfer tool against a real database yet** — it's typechecked and
  loads, but needs a real test on a machine with Docker (see "How to test" below).
- **No backend is deployed** and I don't want to pay for hosting yet. Local Next.js +
  local Postgres (Docker) is the plan. A free tunnel (Cloudflare Tunnel / ngrok) is the
  no-cost way to demo to others later.

---

## Who I am / how I work (for Claude)

- I'm **not a backend developer** — keep explanations plain, give copy-paste commands, and
  flag anything destructive loudly. The two DB docs are written in that style on purpose.
- **I don't want to lose data.** Any migration must be export-first, reversible, tested on
  throwaway data before real data.
- **I don't want to spend on hosting right now.** Local-first.
- I work across two machines, kept in sync via git:
  - **Work PC:** `c:\New folder\3d-inventory` (Node 24, no Docker). This is where the docs
    were written. The SQLite `dev.db` here is throwaway.
  - **Other machine:** `D:\WORK\inventory-workshop` — has the **working SQLite app with my
    real data**, plus **DBeaver** and (intended) **Docker**. This is the machine for the
    real Postgres test/migration.

---

## How we got here (the journey)

1. Hit `P2021: table ... does not exist` running the web app on the other machine. Cause:
   the dev DB is **gitignored**, so a synced machine starts empty. Fix was to create +
   seed the DB.
2. The seed failed on a re-run because `seedFilaments`/`seedOrders` use `create()` (not
   upsert) → unique-constraint collisions. Fix: reset the dev DB (it's throwaway).
3. Wrote DB docs and set up a **migration baseline** (there were no migrations before —
   only `prisma db push`). This gives production a safe `prisma migrate deploy` path.
4. Decided the highest-value next step is NOT a framework upgrade (all blocked/cosmetic)
   and NOT a new in-app feature — it's getting the app **deployable**. As a first step I
   wanted to **test on Postgres locally** before any hosting spend.
5. Switched the branch to Postgres + Docker, consolidated docs to two beginner-friendly
   files, then added a **data-transfer tool** because I was worried about losing data when
   switching engines (now or in future, both directions).

---

## What changed on `feature/postgres-local`

**Committed** (`e33ea12 — update 7 - post update`):
- `packages/db/prisma/schema.prisma` — datasource provider `sqlite` → **`postgresql`**.
- `packages/db/prisma/migrations/20260531120000_init/` — **Postgres** baseline migration
  (the old SQLite `20260531042943_init` was deleted; SQLite SQL can't run on Postgres).
  Generated offline with `prisma migrate diff` (no live DB needed).
- `packages/db/prisma/migrations/migration_lock.toml` — provider → `postgresql`.
- `docker-compose.yml` (root) — local Postgres 16. `docker compose up -d`. user/pass/db all
  `workshop`, port `5432`.
- `scripts/setup-env.mjs` — now writes a **Postgres** `DATABASE_URL`
  (`postgresql://workshop:workshop@localhost:5432/workshop?schema=public`) and PRESERVES a
  custom/hosted URL if one is already set.
- `.env.example` — Postgres example URL.
- Docs consolidated to **two** files (deleted the old technical `DATABASE.md`):
  - `packages/db/DATABASE-STEPS.md` — ultra-basic numbered steps.
  - `packages/db/DATABASE-BASICS.md` — plain-English guide (concepts, recipes, DBeaver,
    production warning, deploy section).

**Uncommitted as of writing this handoff** (commit these — see TODO #1):
- `packages/db/prisma/transfer.ts` — engine-independent **data export/import** tool.
- `packages/db/package.json` + root `package.json` — new scripts `db:export` / `db:import`.
- `.gitignore` — ignores `packages/db/prisma/data-backup.json` (dumps may hold real data).
- `packages/db/prisma/schema.prisma` — header comment updated (no longer says "SQLite now").
- `DATABASE-BASICS.md` / `DATABASE-STEPS.md` — added "Switching databases & moving your
  data" + a copy-paste **"Check the export/import works"** test flow.
- `HANDOFF-POSTGRES.md` — this file.

---

## `main` vs `feature/postgres-local`

| | `main` (my working app) | `feature/postgres-local` |
|---|---|---|
| Engine | **SQLite** (local file, no Docker) | **Postgres** (Docker) |
| Migration | `20260531042943_init` (SQLite) | `20260531120000_init` (Postgres) |
| Docs | 1 (SQLite-flavored `DATABASE-BASICS.md`) | 2 (`DATABASE-BASICS.md` + `DATABASE-STEPS.md`, Postgres) |
| Transfer tool | ❌ not present yet (see TODO #2) | ✅ present (once TODO #1 is committed) |
| Setup | `setup:env` → `db:generate` → `db:migrate` | + `docker compose up -d` |

⚠️ **Do NOT checkout/merge this branch on the machine with my real SQLite data unless I
mean to switch it to Postgres.** Doing so makes the app expect Postgres (needs Docker) and
my SQLite data does NOT auto-transfer — it must be moved with the export/import tool.

---

## The data-transfer tool (how it works)

`packages/db/prisma/transfer.ts`, run via `pnpm db:export` / `pnpm db:import`.
- It uses the **Prisma client**, so it's engine-agnostic and works **both directions**.
- Export dumps every table to `packages/db/prisma/data-backup.json` (git-ignored).
- Import loads that JSON into the current DB, inserting **parent-before-child** so foreign
  keys resolve (order is hard-coded in `MODELS` in the script, derived from the schema).
- Import expects an **empty, freshly-migrated** target (no de-dup — importing twice
  double-inserts).

**Real move SQLite → Postgres:** `db:export` on SQLite → switch to Postgres branch +
`db:migrate` → (empty it with `migrate reset --skip-seed`) → `db:import`. Reverse is the
same with setups swapped. Full steps in `DATABASE-BASICS.md`.

---

## How to test the tool works (safe — won't touch real data)

Run on a machine with **Docker**. Postgres-only round-trip; SQLite is never touched.

```powershell
git checkout feature/postgres-local
pnpm install
pnpm run setup:env
docker compose up -d
pnpm db:generate
pnpm db:migrate          # tables + demo sample data

pnpm db:export           # prints counts e.g. "exported 3 user" — WRITE THEM DOWN
pnpm --filter @workshop/db exec prisma migrate reset --skip-seed   # empty tables, answer y
pnpm db:import           # should print the SAME counts
pnpm db:studio           # confirm rows are present
```

**Works if** import counts == export counts and the rows show up. If a count is 0 or it
errors, capture the output — likely a Date/JSON coercion or FK-order issue in `transfer.ts`.

---

## Outstanding TODOs (in order)

1. **Commit the uncommitted changes** above to `feature/postgres-local` and push. *(Being
   done in the same step that created this handoff — if you're reading this fresh, it's
   done.)*
2. **Add the transfer tool to `main`** so I can export my REAL SQLite data later. Just
   cherry-pick / re-add `transfer.ts`, the `db:export`/`db:import` script lines, and the
   `.gitignore` line onto `main`. **Do NOT** bring the Postgres provider/migration to
   `main` — keep `main` on SQLite and working.
3. **Actually test the tool** on the other machine (Docker) using the flow above. Until
   this passes, treat the tool as unverified.
4. **Decide: stay on SQLite or adopt Postgres.** If adopting: test → move real data with
   export/import → merge the branch to `main`.
5. **Deployment (later, when ready to maybe spend):** need a host for Next.js + a hosted
   Postgres. Free interim option for demos: Cloudflare Tunnel / ngrok pointing at the local
   server (no hosting bill, PC must be on). Switching to hosted Postgres is then just a
   `DATABASE_URL` change + `prisma migrate deploy`.

---

## Key facts & gotchas

- **The dev DB is gitignored** — every machine builds its own; `git pull` never carries data.
- **Migrations are engine-specific** — a SQLite migration can't run on Postgres and vice
  versa. Switching engines = regenerate the migration for the new engine.
- **Prisma only allows ONE provider** in `schema.prisma` — so the engine is effectively
  chosen per-branch here. No "both at once."
- **The seed is already production-safe:** in `NODE_ENV=production` it seeds only the
  permission matrix + settings (upsert) and an optional env admin — NEVER demo data. So
  production "can't reset to dummy data" unless you deliberately run a reset/force command.
- **Prisma 7 deprecation warning** (`package.json#prisma` → `prisma.config.ts`) appears on
  every command. Harmless on Prisma 6.19; address only when bumping to Prisma 7.
- **Node 24 breaks the Expo CLI** (`Body is unusable`) — use Node 20 or the
  `EXPO_NO_DEPENDENCY_VALIDATION=1` workaround (mobile only; see HANDOFF.md).

---

## Command cheat sheet

```powershell
docker compose up -d                                   # start local Postgres (branch only)
pnpm db:migrate                                        # apply migrations (+auto-seed)
pnpm --filter @workshop/db exec prisma migrate reset   # nuke + re-apply + re-seed (DEV only)
pnpm --filter @workshop/db exec prisma migrate reset --skip-seed   # nuke to EMPTY (for import test)
pnpm db:export                                         # dump current DB -> data-backup.json
pnpm db:import                                         # load data-backup.json -> current DB
pnpm db:studio                                         # browse data in a GUI
```

DBeaver connection (local Postgres): host `localhost`, port `5432`, db/user/pass = `workshop`.

---

## Related files
- `packages/db/DATABASE-STEPS.md` — bare numbered steps.
- `packages/db/DATABASE-BASICS.md` — full plain-English guide + data-move + deploy notes.
- `packages/db/prisma/transfer.ts` — the export/import tool.
- `docker-compose.yml` — local Postgres.
- `scripts/setup-env.mjs` — writes the env files (Postgres URL on this branch).
- `HANDOFF.md` — the broader project handoff (mobile, security, deploy context).
