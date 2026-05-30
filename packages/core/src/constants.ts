/**
 * Shared domain constants. These string-literal unions are the single source of
 * truth used by both client and server (the Prisma schema mirrors them). Adding
 * a value here is the first step to extending a domain.
 */

export const ROLES = ["ADMIN", "MANAGER", "HANDLER"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUS = ["ACTIVE", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const ORDER_STATUS = [
  "DRAFT",
  "CONFIRMED",
  "PRINTING",
  "DONE",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

/** Statuses at which filament stock is considered consumed. */
export const STOCK_CONSUMED_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "PRINTING",
  "DONE",
  "DELIVERED",
];

export const PRICING_MODE = ["PRESET", "DIRECT_RATE", "MANUAL"] as const;
export type PricingMode = (typeof PRICING_MODE)[number];

export const DISCOUNT_TYPE = ["PERCENT", "FLAT"] as const;
export type DiscountType = (typeof DISCOUNT_TYPE)[number];

export const PAYMENT_TYPE = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"] as const;
export type PaymentType = (typeof PAYMENT_TYPE)[number];

/** Entities whose name/email changes are tracked in ChangeHistory. */
export const CHANGE_ENTITY = ["CUSTOMER", "USER"] as const;
export type ChangeEntity = (typeof CHANGE_ENTITY)[number];

/** Entities that support runtime custom fields. */
export const CUSTOM_FIELD_ENTITY = ["CUSTOMER", "USER", "ORDER"] as const;
export type CustomFieldEntity = (typeof CUSTOM_FIELD_ENTITY)[number];

export const FIELD_TYPE = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT", "TEXTAREA"] as const;
export type FieldType = (typeof FIELD_TYPE)[number];

export const NOTIFICATION_TYPE = [
  "LOW_STOCK",
  "ORDER_STATUS",
  "ASSIGNMENT",
  "SYSTEM",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[number];

export const PERMISSION_OVERRIDE = ["ALLOW", "DENY"] as const;
export type PermissionOverride = (typeof PERMISSION_OVERRIDE)[number];

export const DEFAULT_CURRENCY = "INR";

/**
 * Default React Query options shared by the web and mobile tRPC clients so both
 * apps cache and retry identically. Plain object (no react-query import) — it's
 * structurally compatible with `QueryClient`'s `defaultOptions`.
 */
export const QUERY_CLIENT_OPTIONS = {
  queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
};
