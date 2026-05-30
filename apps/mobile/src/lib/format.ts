/**
 * App-specific formatting wrappers. Shared, platform-agnostic helpers live in
 * @workshop/core (dateShort, dateTime, titleCase, ORDER_STATUS_COLOR) so web and
 * mobile format identically.
 */
import { formatMoney, ORDER_STATUS_COLOR } from "@workshop/core";
import type { BadgeTone } from "~/components";

export { dateShort, dateTime, titleCase } from "@workshop/core";

/** Format integer minor units (paise) as currency. */
export function money(minor: number, currency = "INR"): string {
  return formatMoney(minor, currency);
}

/** Format a per-gram rate given in MAJOR units (rupees/gram). */
export function ratePerGram(major: number, currency = "INR"): string {
  return `${formatMoney(Math.round(major * 100), currency)}/g`;
}

/** Order status → Badge tone (shared map, typed to the mobile Badge's tones). */
export const STATUS_TONE: Record<string, BadgeTone> = ORDER_STATUS_COLOR;
