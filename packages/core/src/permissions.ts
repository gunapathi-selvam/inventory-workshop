/**
 * Permission registry — the catalogue of every page/feature key in the app.
 *
 * Access control resolves in two layers (user override wins over role default):
 *   effective(user, key) = UserOverride ?? RoleDefault ?? false
 *
 * `defaultRoles` here only seeds the editable role matrix on first run; after
 * that the DB (RolePermission / UserPermissionOverride) is the source of truth
 * and admins edit it from /settings/access-control.
 */
import type { Role } from "./constants.js";

export interface PermissionDef {
  key: string;
  label: string;
  group: string;
  /** Page route this permission guards, if it gates a whole page. */
  page?: string;
  /** Roles granted this permission by default on first seed. */
  defaultRoles: Role[];
}

const ALL: Role[] = ["ADMIN", "MANAGER", "HANDLER"];
const MGMT: Role[] = ["ADMIN", "MANAGER"];
const ADMIN_ONLY: Role[] = ["ADMIN"];

export const PERMISSIONS = [
  // Dashboard
  { key: "dashboard.view", label: "View dashboard", group: "Dashboard", page: "/dashboard", defaultRoles: ALL },

  // Customers
  { key: "customers.view", label: "View customers", group: "Customers", page: "/customers", defaultRoles: ALL },
  { key: "customers.create", label: "Create customers", group: "Customers", defaultRoles: MGMT },
  { key: "customers.edit", label: "Edit customers", group: "Customers", defaultRoles: MGMT },
  { key: "customers.delete", label: "Delete customers", group: "Customers", defaultRoles: ADMIN_ONLY },

  // Orders
  { key: "orders.view", label: "View orders", group: "Orders", page: "/orders", defaultRoles: ALL },
  { key: "orders.create", label: "Create orders", group: "Orders", defaultRoles: ALL },
  { key: "orders.edit", label: "Edit orders", group: "Orders", defaultRoles: MGMT },
  { key: "orders.delete", label: "Delete orders", group: "Orders", defaultRoles: ADMIN_ONLY },
  { key: "orders.changeStatus", label: "Change order status", group: "Orders", defaultRoles: ALL },
  { key: "orders.priceOverride", label: "Use manual price override", group: "Orders", defaultRoles: MGMT },

  // Inventory
  { key: "inventory.view", label: "View inventory", group: "Inventory", page: "/inventory", defaultRoles: ALL },
  { key: "inventory.create", label: "Add filament", group: "Inventory", defaultRoles: MGMT },
  { key: "inventory.edit", label: "Edit filament", group: "Inventory", defaultRoles: MGMT },
  { key: "inventory.delete", label: "Delete filament", group: "Inventory", defaultRoles: ADMIN_ONLY },
  { key: "inventory.adjustStock", label: "Adjust stock", group: "Inventory", defaultRoles: MGMT },

  // Discounts
  { key: "discounts.view", label: "View discount codes", group: "Discounts", page: "/discounts", defaultRoles: MGMT },
  { key: "discounts.manage", label: "Manage discount codes", group: "Discounts", defaultRoles: MGMT },

  // Users
  { key: "users.view", label: "View users", group: "Users", page: "/users", defaultRoles: ADMIN_ONLY },
  { key: "users.manage", label: "Create / edit users & roles", group: "Users", defaultRoles: ADMIN_ONLY },

  // Settings
  { key: "settings.accessControl", label: "Manage access control", group: "Settings", page: "/settings/access-control", defaultRoles: ADMIN_ONLY },
  { key: "settings.fields", label: "Manage custom fields", group: "Settings", page: "/settings/fields", defaultRoles: ADMIN_ONLY },
  { key: "settings.pricing", label: "Manage pricing settings", group: "Settings", page: "/settings/pricing", defaultRoles: ADMIN_ONLY },
  { key: "settings.audit", label: "View audit log", group: "Settings", page: "/settings/audit-log", defaultRoles: ADMIN_ONLY },
] as const satisfies readonly PermissionDef[];

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

export function getPagePermission(pathname: string): PermissionDef | undefined {
  // Longest matching page prefix wins (e.g. /settings/fields over /settings).
  const matches = (PERMISSIONS as readonly PermissionDef[]).filter(
    (p) => p.page && pathname.startsWith(p.page),
  );
  matches.sort((a, b) => (b.page!.length ?? 0) - (a.page!.length ?? 0));
  return matches[0];
}
