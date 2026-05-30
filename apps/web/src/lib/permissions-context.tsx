"use client";
import * as React from "react";
import type { Role, PermissionKey } from "@workshop/core";

export interface CurrentUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
}

interface PermissionsValue {
  user: CurrentUser;
  permissions: Record<string, boolean>;
}

const Ctx = React.createContext<PermissionsValue | null>(null);

export function PermissionsProvider({
  user,
  permissions,
  children,
}: PermissionsValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ user, permissions }), [user, permissions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): CurrentUser {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within PermissionsProvider");
  return ctx.user;
}

/** UI-side permission check. Server still enforces every action independently. */
export function useCan(key: PermissionKey): boolean {
  const ctx = React.useContext(Ctx);
  return ctx?.permissions[key] ?? false;
}

export function usePermissions(): Record<string, boolean> {
  const ctx = React.useContext(Ctx);
  return ctx?.permissions ?? {};
}
