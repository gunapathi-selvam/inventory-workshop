/**
 * Settings service — typed access to the key/value Setting table, including the
 * hashed manual-price override password. Centralizes all reads/writes so the
 * rest of the app never touches the Setting table directly.
 */
import { prisma } from "@workshop/db";
import { DEFAULT_CURRENCY } from "@workshop/core";
import { hashSecret, verifySecret } from "@workshop/auth";

export interface PricingSettings {
  machineRatePerHour: number; // minor units / hour
  defaultLaborFee: number; // minor units
  defaultMarginPercent: number; // percent * 100
  currency: string;
}

const DEFAULTS: PricingSettings = {
  machineRatePerHour: 2000,
  defaultLaborFee: 0,
  defaultMarginPercent: 0,
  currency: DEFAULT_CURRENCY,
};

async function getRaw<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row ? (row.value as T) : fallback;
}

async function setRaw(key: string, value: unknown): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as object },
    create: { key, value: value as object },
  });
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const [machineRatePerHour, defaultLaborFee, defaultMarginPercent, currency] = await Promise.all([
    getRaw("machineRatePerHour", DEFAULTS.machineRatePerHour),
    getRaw("defaultLaborFee", DEFAULTS.defaultLaborFee),
    getRaw("defaultMarginPercent", DEFAULTS.defaultMarginPercent),
    getRaw("currency", DEFAULTS.currency),
  ]);
  return { machineRatePerHour, defaultLaborFee, defaultMarginPercent, currency };
}

export async function setPricingSettings(s: PricingSettings): Promise<void> {
  await Promise.all([
    setRaw("machineRatePerHour", s.machineRatePerHour),
    setRaw("defaultLaborFee", s.defaultLaborFee),
    setRaw("defaultMarginPercent", s.defaultMarginPercent),
    setRaw("currency", s.currency),
  ]);
}

/** Verify the manual-price override password against the stored hash. */
export async function verifyOverridePassword(plain: string): Promise<boolean> {
  const hash = await getRaw<string | null>("priceOverridePasswordHash", null);
  if (!hash) return false;
  return verifySecret(hash, plain);
}

export async function setOverridePassword(plain: string): Promise<void> {
  const hash = await hashSecret(plain);
  await setRaw("priceOverridePasswordHash", hash);
}

export interface EmailSettings {
  enabled: boolean;
  from: string;
}
export async function getEmailSettings(): Promise<EmailSettings> {
  return getRaw<EmailSettings>("email", { enabled: false, from: "Workshop <no-reply@workshop.local>" });
}
