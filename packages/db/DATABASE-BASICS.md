# Database guide (plain English)

You don't need to know anything about databases to use this. This page explains the few
words you'll see, then gives you **copy-paste recipes**: find your situation, run the
command, done.

> Just want the bare steps with no explanation? See **[DATABASE-STEPS.md](DATABASE-STEPS.md)**.

---

## The 4 words you need

- **Database** — the app's filing cabinet where all data lives (users, orders, customers…).
  This project uses **Postgres**, which runs in **Docker** on your machine (one command
  starts it — see Recipe 1). Your data is **personal to your computer** and is *not* shared
  through git — so a freshly downloaded copy of the project starts with an **empty** cabinet.
- **Docker** — a tool that runs the Postgres database for you in a self-contained box, so you
  don't have to install Postgres by hand. `docker compose up -d` starts it; it keeps running
  in the background.
- **Schema** — the *shape* of the drawers (what fields an order has, etc.). It's described
  in `schema.prisma`. This *does* travel through git.
- **Seed** — filling a fresh cabinet with **fake sample data** (demo users, demo orders)
  so the app has something to show. Sample data only — safe to throw away.
- **Migration** — a recorded, safe "change the shape of the cabinet" instruction. When the
  shape changes, you run migrations so your cabinet matches without losing real data.

> **The one thing to remember:** "dev" = your practice copy, sample data, safe to wipe.
> "production" = the real live app with real people's data, **never** wipe it.

---

## Recipe 1 — "I just downloaded the project / nothing works"

Symptom: errors like `table ... does not exist`, or the dashboard shows a 500 error.

Cause: your filing cabinet is empty (see above — it doesn't come with the download).

Fix — run these from the project's main folder, in order:

```powershell
pnpm install
pnpm run setup:env      # only the first time ever on this machine
docker compose up -d    # start the Postgres database (needs Docker Desktop running)
pnpm db:generate
pnpm db:migrate         # builds the cabinet AND fills it with sample data
```

Then start the app (`pnpm dev`). Log in with `admin@workshop.local` / `admin123`.

> First time with Docker? Install **Docker Desktop**, open it once so it's running, then
> the `docker compose up -d` line works. You only `up -d` once per session — it stays up.

---

## Recipe 2 — "The database is acting weird / a command failed halfway"

Symptom: seeding failed, duplicate errors, or things look half-broken.

Fix — **wipe and rebuild** (this is totally fine on your own machine — it only ever holds
sample data):

```powershell
pnpm --filter @workshop/db exec prisma migrate reset
```

Type `y` if it asks to confirm. It empties the cabinet, rebuilds it, and refills the
sample data. Fresh start.

> ⚠️ Only ever do this on your own computer / a practice database. Doing it on the live
> app would delete real data. See the warning box below.

---

## Recipe 3 — "I pulled the latest code and someone changed the database shape"

Symptom: after `git pull`, the app complains the database is out of date.

Fix:

```powershell
pnpm db:generate
pnpm db:migrate     # catches your cabinet up to the new shape, keeps your data
```

---

## Recipe 4 — "I need to log in" (sample accounts)

After seeding, these demo accounts exist (sample data only, dev machines):

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Admin   | `admin@workshop.local`    | `admin123`   |
| Manager | `manager@workshop.local`  | `manager123` |
| Handler | `handler@workshop.local`  | `handler123` |

Manual price-override password: `override123`.

---

## Recipe 5 — "I want to look at the data in DBeaver"

Make sure Postgres is running (`docker compose up -d`), then add a connection in DBeaver:

| Field    | Value       |
|----------|-------------|
| Host     | `localhost` |
| Port     | `5432`      |
| Database | `workshop`  |
| Username | `workshop`  |
| Password | `workshop`  |

(These come from `docker-compose.yml`.) `pnpm db:studio` also opens a simple browser-based
viewer with no setup.

---

## 🚨 The production warning (read once)

"Production" means the **real, live app** that real users use, with real data. It is a
different database from the practice one on your laptop.

**Never run these against production:**
- ❌ `prisma migrate reset` — deletes ALL real data
- ❌ `prisma db push --force-reset` — same, deletes everything
- ❌ the demo seed — it's sample/fake data; it should never touch real data

The good news, already built in: when the app runs in production it **automatically
refuses to insert the fake demo data** — it only ever sets up the permission rules and
settings, and never the fake users/orders. So a normal production update can't
accidentally "reset to dummy data." You'd have to deliberately run a delete-everything
command (the ❌ ones above) to lose data — so just don't run those on production.

**If you're ever unsure whether you're about to touch production, stop and ask a backend
person first.** Deleting live data is the one mistake that's hard to undo. Everything on
your own laptop is safe to experiment with.

---

## Switching databases & moving your data (SQLite ⇄ Postgres)

**Your data does NOT move automatically.** SQLite and Postgres are different engines —
you can't copy the database file across. To switch without losing anything you **export**
the data to a file, then **import** it into the other database. We have a tool for that:
`pnpm db:export` and `pnpm db:import` (works in both directions).

### Which engine am I on?

It's decided by the **branch** (because the engine is written into `schema.prisma`):

| Branch | Engine | Setup |
|--------|--------|-------|
| `main` | **SQLite** (a local file, no Docker) | `pnpm run setup:env`, `pnpm db:generate`, `pnpm db:migrate` |
| `feature/postgres-local` | **Postgres** (via Docker) | `pnpm run setup:env`, `docker compose up -d`, `pnpm db:generate`, `pnpm db:migrate` |

So "set up on both" = each branch already carries its own correct setup. You don't edit
config by hand; switching branch + running its setup is the switch.

### Move data SQLite → Postgres (no loss)

```powershell
# 1. On SQLite (main branch) — save your current data to a file:
pnpm db:export                       # -> packages/db/prisma/data-backup.json

# 2. Switch to the Postgres branch and create empty Postgres tables:
git checkout feature/postgres-local
pnpm install
pnpm run setup:env
docker compose up -d
pnpm db:generate
pnpm db:migrate                      # tables created (will also seed demo rows — see note)

# 3. Load your saved data into Postgres:
pnpm db:import                       # reads packages/db/prisma/data-backup.json
```

> The `data-backup.json` file stays on your disk between steps (it's git-ignored, so it
> won't be committed). It carries your real rows from the old DB to the new one.

### Move data Postgres → SQLite (no loss)

Exactly the same three steps with the setups swapped:

```powershell
# 1. On Postgres: pnpm db:export
# 2. git checkout main; pnpm install; pnpm run setup:env; pnpm db:generate; pnpm db:migrate
# 3. On SQLite: pnpm db:import
```

### Two safety notes (so you never lose data)

1. **Import wants an EMPTY target.** `pnpm db:migrate` on a fresh DB may also add demo
   sample rows. If you only want *your* data, clear it first with
   `pnpm --filter @workshop/db exec prisma migrate reset` (answer `y`), then `pnpm db:import`.
   Importing into a non-empty DB double-inserts.
2. **Always export BEFORE you switch.** The export file is your backup. Keep a copy
   somewhere safe until you've confirmed the new database looks right (check it in DBeaver
   or `pnpm db:studio`).

### Check the export/import works first (safe — won't touch your real data)

A full round-trip on Postgres only, so nothing on your SQLite (`main`) side is touched.
Do this on a machine with **Docker**. Run each line one at a time:

```powershell
# Setup (Postgres branch + Docker)
git checkout feature/postgres-local
pnpm install
pnpm run setup:env
docker compose up -d
pnpm db:generate
pnpm db:migrate          # creates tables + demo sample data

# The actual test
pnpm db:export           # prints counts (e.g. "exported 3 user") -> WRITE THESE DOWN
pnpm --filter @workshop/db exec prisma migrate reset --skip-seed   # empties tables, answer y
pnpm db:import           # should print the SAME counts ("imported 3 user" ...)
pnpm db:studio           # open the viewer and confirm the rows are there
```

**It works if:** the import counts match the export counts, and `db:studio` (or the app)
shows the data after the import. If a count is 0 or you see an error, that's the signal
something needs fixing.

---

## For whoever deploys the live app (the technical bit)

You don't need this for local work — it's here so it isn't lost. The safe way to update a
**production** Postgres database:

```bash
# 1. BACK UP FIRST
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql

# 2. Apply schema changes via migrations — NEVER `migrate reset`, NEVER `db push`
pnpm --filter @workshop/db exec prisma migrate deploy

# 3. (Optional) refresh permission rules + settings only — safe, never inserts demo data
NODE_ENV=production pnpm db:seed
```

Why step 3 is safe: in production the seed skips all demo users/orders and only *upserts*
the permission matrix and settings (adds new permission keys, preserves admin edits).
That's the `SEED_DEMO` gate in `prisma/seed.ts` — it's why production "never resets to
dummy data."

**Production don'ts:** `prisma migrate reset`, `prisma db push --force-reset`, or running
the seed without `NODE_ENV=production`. And always migrate behind a backup.

First production deploy from a brand-new empty Postgres just runs `migrate deploy`. If
you're adopting migrations on an **existing** prod DB that predates them, baseline it once
with `prisma migrate resolve --applied <migration_folder_name>` so it doesn't try to
recreate existing tables.

---

## Cheat sheet

| I want to… | Run |
|------------|-----|
| Start the database | `docker compose up -d` |
| Set up a brand-new copy | `pnpm run setup:env`, `docker compose up -d`, `pnpm db:generate`, `pnpm db:migrate` |
| Fix a broken/weird local DB | `pnpm --filter @workshop/db exec prisma migrate reset` |
| Catch up after `git pull` | `pnpm db:generate` then `pnpm db:migrate` |
| Look at the data in a GUI | `pnpm db:studio` (or DBeaver — Recipe 5) |
| Stop the database | `docker compose stop` |

When in doubt on your own machine: **Recipe 2 (reset)** fixes almost anything.
On production: don't reset — read the warning box and ask for help.
