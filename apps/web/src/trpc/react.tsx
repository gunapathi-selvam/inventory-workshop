"use client";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { QUERY_CLIENT_OPTIONS } from "@workshop/core";
import type { AppRouter } from "@workshop/api/client";

export const api = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({ defaultOptions: QUERY_CLIENT_OPTIONS }));
  const [trpcClient] = React.useState(() =>
    api.createClient({
      links: [httpBatchLink({ url: `${getBaseUrl()}/api/trpc`, transformer: superjson })],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
