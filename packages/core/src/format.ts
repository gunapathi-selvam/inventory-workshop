/**
 * Shared, platform-agnostic formatting helpers used by both the web and mobile
 * apps so dates, labels, and status colors render identically everywhere.
 * (Currency lives in money.ts as `formatMoney`.)
 */

/** e.g. "05 Jun 2026" */
export function dateShort(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** e.g. "05 Jun, 02:30 PM" */
export function dateTime(d: Date | string): string {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Human-friendly label for an UPPER_SNAKE enum value, e.g. "IN_PROGRESS" → "In Progress". */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Semantic color token names shared by the web Badge `variant` and mobile Badge `tone`. */
export type StatusColor = "default" | "primary" | "success" | "warning" | "danger" | "info";

/** Order status → badge color. Single source of truth for web + mobile. */
export const ORDER_STATUS_COLOR: Record<string, StatusColor> = {
  DRAFT: "default",
  CONFIRMED: "info",
  PRINTING: "primary",
  DONE: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
};
