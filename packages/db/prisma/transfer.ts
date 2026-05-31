/**
 * Engine-independent data transfer — move your data between databases without
 * losing it (e.g. SQLite <-> Postgres). It talks through the Prisma client, so it
 * works in whichever direction your current DATABASE_URL + provider point at.
 *
 *   Export (dump the CURRENT database to a JSON file):
 *     pnpm db:export                 # writes packages/db/prisma/data-backup.json
 *   Import (load a JSON file INTO the current database):
 *     pnpm db:import                 # reads packages/db/prisma/data-backup.json
 *
 * Custom file path:
 *     pnpm --filter @workshop/db exec tsx prisma/transfer.ts export ./my-dump.json
 *     pnpm --filter @workshop/db exec tsx prisma/transfer.ts import ./my-dump.json
 *
 * Typical SQLite -> Postgres move (no data loss):
 *   1) on the SQLite setup:   pnpm db:export            (creates data-backup.json)
 *   2) switch to Postgres, then `pnpm db:migrate`       (creates empty tables)
 *   3) on the Postgres setup: pnpm db:import            (loads data-backup.json)
 * Reverse (Postgres -> SQLite) is the same three steps with the setups swapped.
 *
 * Import expects a FRESHLY-MIGRATED, EMPTY target (run `prisma migrate reset` or a
 * fresh `migrate` first). It does not de-duplicate, so importing twice double-inserts.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";

const prisma = new PrismaClient();

// Parent-before-child order so foreign keys resolve on import. (Reverse for deletes.)
const MODELS = [
  "user",
  "customer",
  "filament",
  "discountCode",
  "rolePermission",
  "fieldDefinition",
  "setting",
  "changeHistory",
  "userPermissionOverride",
  "order",
  "orderItem",
  "stockMovement",
  "notification",
  "auditLog",
] as const;

// Minimal structural view of the client for dynamic model access.
type AnyModel = {
  findMany: () => Promise<unknown[]>;
  createMany: (args: { data: unknown[] }) => Promise<{ count: number }>;
};
const db = prisma as unknown as Record<string, AnyModel>;

const mode = process.argv[2];
const file = process.argv[3] ?? "prisma/data-backup.json";

async function exportData() {
  const data: Record<string, unknown[]> = {};
  for (const m of MODELS) {
    data[m] = await db[m]!.findMany();
    console.log(`exported ${data[m]!.length} ${m}`);
  }
  writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`\nWrote ${file}`);
}

async function importData() {
  const raw = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown[]>;
  for (const m of MODELS) {
    const rows = raw[m] ?? [];
    if (rows.length === 0) continue;
    const res = await db[m]!.createMany({ data: rows });
    console.log(`imported ${res.count} ${m}`);
  }
  console.log(`\nDone importing from ${file}`);
}

async function main() {
  if (mode === "export") await exportData();
  else if (mode === "import") await importData();
  else {
    console.error("Usage: tsx prisma/transfer.ts <export|import> [file]");
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
