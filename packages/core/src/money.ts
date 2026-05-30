/**
 * Money helpers. All monetary amounts are stored and computed as integer
 * "minor units" (paise/cents) to avoid floating-point drift, and formatted
 * for display only at the edge.
 */
import { DEFAULT_CURRENCY } from "./constants.js";

/** Round to 2 decimals safely (for rate * grams style math on major units). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function toMinor(major: number): number {
  return Math.round(major * 100);
}

export function toMajor(minor: number): number {
  return round2(minor / 100);
}

export function formatMoney(minor: number, currency = DEFAULT_CURRENCY, locale = "en-IN"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(toMajor(minor));
}

export function clampNonNegative(n: number): number {
  return n < 0 ? 0 : n;
}
