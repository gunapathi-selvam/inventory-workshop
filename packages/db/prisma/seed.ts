/**
 * Database seed. Idempotent-ish: safe to run on a fresh DB. Seeds the role
 * permission matrix from the code registry, an admin + demo team, settings
 * (including the hashed manual-price override password), inventory, customers,
 * discount codes and a handful of orders so the dashboard has data.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  PERMISSIONS,
  ROLES,
  DEFAULT_CURRENCY,
  type Role,
} from "@workshop/core";

const prisma = new PrismaClient();

const rs = (major: number) => Math.round(major * 100); // rupees -> paise

async function seedPermissions() {
  for (const perm of PERMISSIONS) {
    for (const role of ROLES) {
      const allowed = (perm.defaultRoles as readonly Role[]).includes(role);
      await prisma.rolePermission.upsert({
        where: { role_permissionKey: { role, permissionKey: perm.key } },
        update: {}, // don't clobber admin edits on re-seed
        create: { role, permissionKey: perm.key, allowed },
      });
    }
  }
}

async function seedSettings() {
  const overrideHash = await bcrypt.hash("override123", 10); // CHANGE in production
  const settings: Record<string, unknown> = {
    currency: DEFAULT_CURRENCY,
    machineRatePerHour: rs(20), // default machine time rate (paise/hour)
    defaultLaborFee: rs(0),
    defaultMarginPercent: 0, // percent*100
    priceOverridePasswordHash: overrideHash,
    email: { enabled: false, from: "Workshop <no-reply@workshop.local>" },
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as object },
    });
  }
}

async function seedUsers() {
  const team = [
    { name: "Workshop Admin", email: "admin@workshop.local", role: "ADMIN", pass: "admin123" },
    { name: "Maya Manager", email: "manager@workshop.local", role: "MANAGER", pass: "manager123" },
    { name: "Hari Handler", email: "handler@workshop.local", role: "HANDLER", pass: "handler123" },
  ];
  const created = [];
  for (const u of team) {
    const passwordHash = await bcrypt.hash(u.pass, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, role: u.role, passwordHash },
    });
    created.push(user);
  }
  return created;
}

async function seedFilaments() {
  const data = [
    { type: "PLA", color: "Black", sell: rs(6), cost: rs(3), grams: 4000, spools: 4, thr: 500 },
    { type: "PLA", color: "White", sell: rs(6), cost: rs(3), grams: 250, spools: 1, thr: 500 },
    { type: "PETG", color: "Blue", sell: rs(9), cost: rs(5), grams: 1800, spools: 2, thr: 400 },
    { type: "ABS", color: "Red", sell: rs(8), cost: rs(4), grams: 900, spools: 1, thr: 400 },
  ];
  const out = [];
  for (const f of data) {
    out.push(
      await prisma.filament.create({
        data: {
          type: f.type,
          color: f.color,
          sellRatePerGram: f.sell,
          costPerGram: f.cost,
          weightRemainingG: f.grams,
          spoolCount: f.spools,
          lowStockThresholdG: f.thr,
        },
      }),
    );
  }
  return out;
}

async function seedCustomers() {
  const data = [
    { name: "Acme Prototypes", phone: "9000000001", email: "buy@acme.test", tier: "Business" },
    { name: "Ravi Kumar", phone: "9000000002", email: "ravi@mail.test", tier: "Retail" },
    { name: "Design Studio 9", phone: "9000000003", email: "hi@ds9.test", tier: "Business" },
  ];
  const out = [];
  for (const c of data) out.push(await prisma.customer.create({ data: c }));
  return out;
}

async function seedDiscounts() {
  await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENT", value: 1000, active: true }, // 10%
  });
  await prisma.discountCode.upsert({
    where: { code: "FLAT50" },
    update: {},
    create: { code: "FLAT50", type: "FLAT", value: rs(50), active: true },
  });
}

async function seedOrders(
  customers: { id: string }[],
  filaments: { id: string; sellRatePerGram: number; costPerGram: number }[],
  adminId: string,
) {
  if (customers.length === 0 || filaments.length === 0) return;
  const statuses = ["DELIVERED", "DONE", "PRINTING", "CONFIRMED", "DRAFT"];
  for (let i = 0; i < 8; i++) {
    const cust = customers[i % customers.length]!;
    const fil = filaments[i % filaments.length]!;
    const grams = 40 + i * 15;
    const qty = 1 + (i % 3);
    const linePrice = Math.round(grams * fil.sellRatePerGram * qty);
    const lineCost = Math.round(grams * fil.costPerGram * qty);
    const status = statuses[i % statuses.length]!;
    const number = `ORD-${String(1001 + i)}`;
    await prisma.order.create({
      data: {
        orderNumber: number,
        customerId: cust.id,
        status,
        pricingMode: "PRESET",
        subtotal: linePrice,
        total: linePrice,
        costTotal: lineCost,
        profit: linePrice - lineCost,
        stockApplied: status !== "DRAFT",
        createdById: adminId,
        items: {
          create: [
            {
              name: `Print job #${i + 1}`,
              filamentId: fil.id,
              gramsPerUnit: grams,
              qty,
              ratePerGram: fil.sellRatePerGram,
              lineCost,
              linePrice,
            },
          ],
        },
      },
    });
  }
}

async function main() {
  console.log("Seeding…");
  await seedPermissions();
  await seedSettings();
  const users = await seedUsers();
  const admin = users.find((u) => u.role === "ADMIN")!;
  const filaments = await seedFilaments();
  const customers = await seedCustomers();
  await seedDiscounts();
  await seedOrders(customers, filaments, admin.id);
  console.log("Seed complete.");
  console.log("Logins:  admin@workshop.local / admin123");
  console.log("         manager@workshop.local / manager123");
  console.log("         handler@workshop.local / handler123");
  console.log("Manual price override password: override123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
