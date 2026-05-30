"use client";
import * as React from "react";
import { TRPCProvider } from "~/trpc/react";
import { ToastProvider } from "@workshop/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <ToastProvider>{children}</ToastProvider>
    </TRPCProvider>
  );
}
