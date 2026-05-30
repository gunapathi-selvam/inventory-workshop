/**
 * AuthProvider — owns the session: restores the saved bearer token on launch,
 * validates it via `auth.me`, and exposes `login` / `logout`. The token is kept
 * in the OS keychain (expo-secure-store) and mirrored into the in-memory holder
 * the tRPC link reads.
 */
import * as React from "react";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import type { Role } from "@workshop/core";
import type { LoginInput } from "@workshop/validators";
import { api } from "./trpc";
import { authToken } from "./auth-token";

const TOKEN_KEY = "workshop.authToken";

export interface AuthUser {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
}

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // undefined → still restoring from secure storage.
  const [token, setToken] = React.useState<string | null | undefined>(undefined);
  const queryClient = useQueryClient();
  const loginMutation = api.auth.login.useMutation();

  // Restore the persisted token once on launch. Must always resolve `token` to
  // a string|null — if it stayed `undefined` (e.g. SecureStore throws on a
  // device), `status` would hang on "loading" forever (white screen).
  React.useEffect(() => {
    (async () => {
      let saved: string | null = null;
      try {
        saved = await SecureStore.getItemAsync(TOKEN_KEY);
      } catch (e) {
        console.warn("SecureStore unavailable; continuing signed out.", e);
      } finally {
        authToken.set(saved ?? null);
        setToken(saved ?? null);
      }
    })();
  }, []);

  const meQuery = api.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60_000,
  });

  // A token that the server rejects → drop it.
  React.useEffect(() => {
    if (token && meQuery.isError) {
      void clearToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, meQuery.isError]);

  const persistToken = React.useCallback(async (value: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, value);
    authToken.set(value);
    setToken(value);
  }, []);

  const clearToken = React.useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    authToken.set(null);
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  const login = React.useCallback(
    async (input: LoginInput) => {
      const result = await loginMutation.mutateAsync(input);
      await persistToken(result.token);
      await queryClient.invalidateQueries();
    },
    [loginMutation, persistToken, queryClient],
  );

  const status: Status =
    token === undefined || (!!token && meQuery.isLoading)
      ? "loading"
      : token && meQuery.data
        ? "authenticated"
        : "unauthenticated";

  const value = React.useMemo<AuthContextValue>(
    () => ({
      status,
      user: (meQuery.data as AuthUser | undefined) ?? null,
      login,
      logout: clearToken,
    }),
    [status, meQuery.data, login, clearToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
