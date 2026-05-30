/**
 * App-specific formatting wrappers. Shared, platform-agnostic helpers live in
 * @workshop/core (dateShort, dateTime, ORDER_STATUS_COLOR).
 */
import { formatMoney } from "@workshop/core";

export { dateShort, dateTime } from "@workshop/core";

/** Format integer minor units (paise) as currency. */
export function money(minor: number, currency = "INR"): string {
  return formatMoney(minor, currency);
}

/** Order status → Badge `variant` (shared single source of truth). */
export { ORDER_STATUS_COLOR as STATUS_VARIANT } from "@workshop/core";
