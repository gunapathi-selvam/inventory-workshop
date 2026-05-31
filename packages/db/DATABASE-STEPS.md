# Get the database running — step by step

The shortest possible path. Just do the steps in order. If you want explanations or you
hit a problem, open **[DATABASE-BASICS.md](DATABASE-BASICS.md)** instead.

---

## Before you start (one time per computer)

1. Install **Docker Desktop** → https://www.docker.com/products/docker-desktop/
2. Open Docker Desktop and wait until it says it's running (whale icon in the tray).
3. Install **Node 20** and **pnpm** if you haven't (`npm install -g pnpm`).

---

## First-time setup

Open a terminal in the project's main folder and run these **one at a time, in order**:

```powershell
pnpm install
```
```powershell
pnpm run setup:env
```
```powershell
docker compose up -d
```
```powershell
pnpm db:generate
```
```powershell
pnpm db:migrate
```

That's it. Now start the app:

```powershell
pnpm dev
```

Open http://localhost:3000 and log in:

- **Email:** `admin@workshop.local`
- **Password:** `admin123`

---

## Look at the data (DBeaver)

Make sure `docker compose up -d` has been run, then in DBeaver make a new Postgres
connection with:

| Field    | Value       |
|----------|-------------|
| Host     | `localhost` |
| Port     | `5432`      |
| Database | `workshop`  |
| Username | `workshop`  |
| Password | `workshop`  |

---

## If something breaks (on your own computer only)

**App says "table does not exist" or won't load:**
```powershell
docker compose up -d
pnpm db:migrate
```

**Still broken / want a totally fresh start** (erases your local sample data — fine, it's fake):
```powershell
pnpm --filter @workshop/db exec prisma migrate reset
```
Press `y` if it asks. This rebuilds everything and re-adds the sample data.

**After you `git pull` new code:**
```powershell
pnpm db:generate
pnpm db:migrate
```

**Moving your data between SQLite and Postgres (without losing it):**
See **[DATABASE-BASICS.md](DATABASE-BASICS.md) → "Switching databases & moving your data"**.
Short version: `pnpm db:export` on the old one, switch, then `pnpm db:import` on the new one.

---

> 🚨 These commands are for **your own computer**. Never run `migrate reset` against the
> real live app — it deletes real data. If unsure, ask. See **[DATABASE-BASICS.md](DATABASE-BASICS.md)**.
