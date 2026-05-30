"use client";
import * as React from "react";
import { ThemeProvider } from "next-themes";
import { TRPCProvider } from "~/trpc/react";
import { ToastProvider } from "@workshop/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TRPCProvider>
        <ToastProvider>{children}</ToastProvider>
      </TRPCProvider>
    </ThemeProvider>
  );
}
