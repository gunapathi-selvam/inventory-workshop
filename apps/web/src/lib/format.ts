import { formatMoney as coreFormatMoney } from "@workshop/core";

/** Format integer minor units (paise) as currency. */
export function money(minor: number, currency = "INR"): string {
  return coreFormatMoney(minor, currency);
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

export const STATUS_VARIANT: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "default",
  CONFIRMED: "info",
  PRINTING: "primary",
  DONE: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
};
