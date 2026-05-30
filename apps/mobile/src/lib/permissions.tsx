/**
 * PermissionsProvider — loads the current user's effective permission map once
 * and exposes `useCan(key)` for UI gating, mirroring the web app's approach.
 * Server procedures still enforce permissions independently; this only hides
 * controls the user can't use.
 */
import * as React from "react";
import type { PermissionKey } from "@workshop/core";
import { api } from "~/api/trpc";
import { useAuth } from "~/api/auth";

type PermissionMap = Record<string, boolean>;

const PermissionsContext = React.createContext<PermissionMap>({});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const query = api.auth.myPermissions.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: 5 * 60_000,
  });
  // Memoize so the context value is stable across renders where the permission
  // data hasn't changed — otherwise every `useCan()` consumer re-renders. (The
  // web PermissionsProvider already does this.)
  const map = React.useMemo(
    () => (query.data as PermissionMap | undefined) ?? {},
    [query.data],
  );
  return <PermissionsContext.Provider value={map}>{children}</PermissionsContext.Provider>;
}

/** Whether the current user has a given permission. */
export function useCan(key: PermissionKey): boolean {
  const map = React.useContext(PermissionsContext);
  return map[key] ?? false;
}
