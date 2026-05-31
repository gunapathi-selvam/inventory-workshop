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
