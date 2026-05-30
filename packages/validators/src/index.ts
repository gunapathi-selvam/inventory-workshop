/**
 * Shared Zod schemas — one definition reused by client forms (react-hook-form)
 * and server routers (tRPC input). Money inputs are accepted in MAJOR units
 * (rupees) from the UI and converted to minor units in services.
 */
import { z } from "zod";
import {
  ROLES,
  USER_STATUS,
  ORDER_STATUS,
  PRICING_MODE,
  DISCOUNT_TYPE,
  PAYMENT_TYPE,
  CUSTOM_FIELD_ENTITY,
  FIELD_TYPE,
} from "@workshop/core";

export const idSchema = z.string().min(1);

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});
export type Pagination = z.infer<typeof paginationSchema>;

/** Custom fields are an open record; per-field validation runs against
 *  FieldDefinition at the service layer. */
export const customFieldsSchema = z.record(z.string(), z.unknown()).optional();

/* ----------------------------- Auth ----------------------------- */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/* ----------------------------- User ----------------------------- */
export const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Min 8 characters"),
  role: z.enum(ROLES),
  status: z.enum(USER_STATUS).default("ACTIVE"),
  customFields: customFieldsSchema,
});
export const userUpdateSchema = userCreateSchema
  .partial()
  .omit({ password: true })
  .extend({
    id: idSchema,
    password: z.string().min(8).optional(),
    // Required by the server only when name/email actually change.
    overridePassword: z.string().optional(),
  });

/* --------------------------- Customer --------------------------- */
export const customerCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  tier: z.string().optional(),
  notes: z.string().optional(),
  customFields: customFieldsSchema,
});
export const customerUpdateSchema = customerCreateSchema.partial().extend({
  id: idSchema,
  // Required by the server only when name/email actually change.
  overridePassword: z.string().optional(),
});

/* --------------------------- Filament --------------------------- */
export const filamentCreateSchema = z.object({
  type: z.string().min(1),
  color: z.string().min(1),
  sellRatePerGram: z.number().nonnegative(), // rupees/gram
  costPerGram: z.number().nonnegative(), // rupees/gram
  weightRemainingG: z.number().nonnegative().default(0),
  spoolCount: z.number().int().nonnegative().default(0),
  lowStockThresholdG: z.number().nonnegative().default(0),
});
export const filamentUpdateSchema = filamentCreateSchema.partial().extend({ id: idSchema });

export const stockAdjustSchema = z.object({
  filamentId: idSchema,
  deltaG: z.number(), // +restock / -adjust
  reason: z.enum(["RESTOCK", "ADJUSTMENT"]).default("RESTOCK"),
  note: z.string().optional(),
});

/* ---------------------------- Orders ---------------------------- */
export const orderItemInputSchema = z.object({
  name: z.string().min(1),
  filamentId: idSchema.optional(),
  gramsPerUnit: z.number().nonnegative().default(0),
  qty: z.number().int().min(1).default(1),
  printHours: z.number().nonnegative().default(0),
  /** For DIRECT_RATE mode: per-gram rate in rupees entered by admin. */
  directRatePerGram: z.number().nonnegative().optional(),
});

export const orderPricingInputSchema = z.object({
  mode: z.enum(PRICING_MODE),
  laborFee: z.number().nonnegative().default(0), // rupees
  marginPercent: z.number().min(0).max(100).default(0),
  applyMachineTime: z.boolean().default(false),
  /** MANUAL mode only: final price (rupees) + override password. */
  manualTotal: z.number().nonnegative().optional(),
  overridePassword: z.string().optional(),
  /** Discounts (apply to every mode). */
  discountCode: z.string().optional(),
  manualDiscountType: z.enum(DISCOUNT_TYPE).optional(),
  manualDiscountValue: z.number().nonnegative().optional(), // percent or rupees
});

/** Fulfillment fields shared by create/update/fulfillment endpoints. */
export const fulfillmentFieldsSchema = z.object({
  deliveryDate: z.coerce.date().optional().nullable(),
  paymentType: z.enum(PAYMENT_TYPE).optional().nullable(),
  courierName: z.string().optional().nullable(),
  trackingId: z.string().optional().nullable(),
  trackingUrl: z.string().url().optional().or(z.literal("")).nullable().optional(),
});

export const orderCreateSchema = z
  .object({
    customerId: idSchema,
    notes: z.string().optional(),
    items: z.array(orderItemInputSchema).min(1, "Add at least one item"),
    pricing: orderPricingInputSchema,
    customFields: customFieldsSchema,
  })
  .merge(fulfillmentFieldsSchema);

export const orderUpdateSchema = orderCreateSchema.partial().extend({ id: idSchema });

export const orderStatusSchema = z.object({
  id: idSchema,
  status: z.enum(ORDER_STATUS),
});

/** Update only fulfillment fields (delivery, payment, courier/tracking). */
export const orderFulfillmentSchema = fulfillmentFieldsSchema.extend({ id: idSchema });

/** Orders list filters: pagination + status + created date range. */
export const orderListSchema = paginationSchema.extend({
  status: z.enum(ORDER_STATUS).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

/** Excel export filter (date range). */
export const orderExportSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  status: z.enum(ORDER_STATUS).optional(),
});

/** Orders for a single customer with date range + order-number search. */
export const customerOrdersSchema = z.object({
  customerId: idSchema,
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().trim().optional(),
});

/** Standalone price preview (no persistence) for the order wizard. */
export const pricePreviewSchema = z.object({
  items: z.array(orderItemInputSchema).min(1),
  pricing: orderPricingInputSchema,
});

/* -------------------------- Discounts --------------------------- */
export const discountCreateSchema = z.object({
  code: z.string().min(2).transform((s) => s.toUpperCase()),
  type: z.enum(DISCOUNT_TYPE),
  value: z.number().positive(), // percent or rupees
  active: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  maxUses: z.number().int().positive().optional(),
});
export const discountUpdateSchema = discountCreateSchema.partial().extend({ id: idSchema });

/* ------------------------- Permissions -------------------------- */
export const rolePermissionSetSchema = z.object({
  role: z.enum(ROLES),
  permissionKey: z.string(),
  allowed: z.boolean(),
});
export const userOverrideSetSchema = z.object({
  userId: idSchema,
  permissionKey: z.string(),
  effect: z.enum(["ALLOW", "DENY", "INHERIT"]), // INHERIT removes the override
});

/* ------------------------ Custom fields ------------------------- */
export const fieldDefinitionCreateSchema = z.object({
  entity: z.enum(CUSTOM_FIELD_ENTITY),
  key: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Letters, numbers, underscore; must start with a letter"),
  label: z.string().min(1),
  type: z.enum(FIELD_TYPE),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
});
export const fieldDefinitionUpdateSchema = fieldDefinitionCreateSchema
  .partial()
  .omit({ entity: true, key: true })
  .extend({ id: idSchema });

/* ------------------------- Settings ----------------------------- */
export const pricingSettingsSchema = z.object({
  machineRatePerHour: z.number().nonnegative(), // rupees/hour
  defaultLaborFee: z.number().nonnegative(),
  defaultMarginPercent: z.number().min(0).max(100),
  currency: z.string().min(1),
  newOverridePassword: z.string().min(6).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type FilamentCreateInput = z.infer<typeof filamentCreateSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
export type OrderFulfillmentInput = z.infer<typeof orderFulfillmentSchema>;
export type OrderListInput = z.infer<typeof orderListSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type OrderPricingInput = z.infer<typeof orderPricingInputSchema>;
export type DiscountCreateInput = z.infer<typeof discountCreateSchema>;
export type FieldDefinitionCreateInput = z.infer<typeof fieldDefinitionCreateSchema>;
export type PricingSettingsInput = z.infer<typeof pricingSettingsSchema>;
