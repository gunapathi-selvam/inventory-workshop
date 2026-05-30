# Moving the whole app to another machine (code + database + data)

This carries **everything** — code, schema, and all your data (customers, orders,
inventory, users). The database is one SQLite file: `packages/db/prisma/dev.db`.

> What moves vs. what's rebuilt:
> - **Carried:** all source code, the Prisma schema, and `dev.db` (your data).
> - **Rebuilt on the new machine:** `node_modules` (via `pnpm install`), the Prisma
>   client (via `pnpm db:generate`), and the `.env` files (via `pnpm run setup:env`).
> - You do **NOT** edit any paths by hand — `setup:env` fixes them automatically.

---

## Prerequisite (new machine, one time)

Install **Node.js 20 or newer** from https://nodejs.org . That's the only thing
to install — `pnpm` comes with it via the `corepack enable` step below.

---

## Option A — Copy the folder (simplest, includes your data)

### On the OLD machine

1. Close the running app (stop `pnpm dev` if it's running).
2. Open **PowerShell** and create an archive that includes the database but skips
   the big rebuildable folders:
   ```powershell
   cd "C:\New folder"
   tar --exclude=node_modules --exclude=.next --exclude=.turbo --exclude=.git -czf workshop-export.tgz sca1
   ```
   This produces `C:\New folder\workshop-export.tgz`.
   *(If you prefer, you can instead manually copy the whole `sca1` folder but
   delete its `node_modules`, `.next`, and `.turbo` subfolders first — they're huge
   and get rebuilt anyway.)*
3. Copy `workshop-export.tgz` to the new machine (USB drive, Google Drive, network
   share, etc.).

### On the NEW machine

4. Put the archive somewhere simple, e.g. `C:\New folder\`, open **PowerShell** there:
   ```powershell
   cd "C:\New folder"
   tar -xzf workshop-export.tgz          # extracts the "sca1" folder
   cd sca1
   ```
5. Enable pnpm, install dependencies, fix env, generate the client:
   ```powershell
   corepack enable
   pnpm install
   pnpm run setup:env
   pnpm db:generate
   ```
6. Start it:
   ```powershell
   pnpm dev
   ```
   Open **http://localhost:3000** — log in with your existing accounts. All your
   data is there.

> ⚠️ Do **NOT** run `pnpm db:seed` on the new machine — that's only for creating a
> fresh demo database and would add duplicate demo rows. Your real data already
> came across in `dev.db`.

---

## Option B — Git for the code + copy the DB file for the data

Use this if you want the code in a Git repo. **Important:** `.gitignore` excludes
`node_modules`, `.next`, and **`*.db`** — so Git carries the **code but not your
data**. You copy the `dev.db` file separately.

### On the OLD machine

```powershell
cd "C:\New folder\sca1"
git init
git add .
git commit -m "Workshop app"
# push to GitHub (using the GitHub CLI):
gh repo create workshop --private --source=. --push
#   …or with a remote you created yourself:
# git remote add origin https://github.com/<you>/workshop.git
# git push -u origin main
```

### On the NEW machine

```powershell
git clone https://github.com/<you>/workshop.git sca1
cd sca1
corepack enable
pnpm install
pnpm run setup:env
pnpm db:generate
```

Now bring your **data** over: copy the file
`packages\db\prisma\dev.db` from the old machine to the same path on the new
machine (USB/cloud — it is *not* in Git). Then:

```powershell
pnpm dev
```

If you don't have a `dev.db` to copy (fresh start), run this instead of copying:
```powershell
pnpm db:push
pnpm db:seed
```

---

## Backing up your data (anytime)

Your entire database is one file. To back up, just copy it somewhere safe:
```
packages\db\prisma\dev.db
```
To restore, copy it back to that same path.

---

## Troubleshooting

- **"pnpm is not recognized"** → run `corepack enable` first (needs Node 20+).
- **Port 3000 already in use** → an old server is still running; close it, or the
  app will start on 3001 (the URL is printed in the terminal).
- **Prisma EPERM / file-lock error during `db:generate`** → a Node process is
  holding the engine; close all `node`/terminal windows and run `pnpm db:generate`
  again.
- **Login fails after moving** → make sure you ran `pnpm run setup:env` (it sets a
  valid `AUTH_SECRET` and the correct database path for the new machine).
- **Empty app / no data** → you started a fresh DB. Either copy the old `dev.db`
  into `packages\db\prisma\`, or accept the fresh state and run `pnpm db:seed`.

---

## Quick reference

| Step | Command |
|---|---|
| Enable pnpm | `corepack enable` |
| Install deps | `pnpm install` |
| Write env for this machine | `pnpm run setup:env` |
| Generate Prisma client | `pnpm db:generate` |
| Run app | `pnpm dev` |
| Fresh DB (no data to copy) | `pnpm db:push && pnpm db:seed` |
| Back up data | copy `packages\db\prisma\dev.db` |
