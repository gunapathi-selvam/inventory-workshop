/**
 * Formatting helpers — reuse the shared money logic from @workshop/core so the
 * mobile app and web format currency identically. Status → badge tone mapping
 * mirrors the web's STATUS_VARIANT.
 */
import { formatMoney } from "@workshop/core";
import type { BadgeTone } from "~/components";

/** Format integer minor units (paise) as currency. */
export function money(minor: number, currency = "INR"): string {
  return formatMoney(minor, currency);
}

export function dateShort(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function dateTime(d: Date | string): string {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Order status → Badge tone (matches the web app). */
export const STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: "default",
  CONFIRMED: "info",
  PRINTING: "primary",
  DONE: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
};

/** Format a per-gram rate given in MAJOR units (rupees/gram). */
export function ratePerGram(major: number, currency = "INR"): string {
  return `${formatMoney(Math.round(major * 100), currency)}/g`;
}

/** Human-friendly label for an UPPER_SNAKE enum value. */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
