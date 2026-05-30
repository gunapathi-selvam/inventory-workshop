/**
 * tRPC + React Query client for the mobile app. Reuses the SAME AppRouter type
 * as the web app (imported from @workshop/api/client — types only, no server
 * code), so every query/mutation is end-to-end type-safe against one backend.
 *
 * Every request attaches `Authorization: Bearer <token>` when a token exists.
 */
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { QUERY_CLIENT_OPTIONS } from "@workshop/core";
import type { AppRouter } from "@workshop/api/client";
import { TRPC_URL } from "~/config";
import { authToken } from "./auth-token";

export const api = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({ defaultOptions: QUERY_CLIENT_OPTIONS }));

  const [trpcClient] = React.useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: TRPC_URL,
          transformer: superjson,
          headers() {
            const token = authToken.get();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
