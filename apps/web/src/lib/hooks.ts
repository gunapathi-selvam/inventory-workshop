"use client";
import * as React from "react";
import type { useToast } from "@workshop/ui";

/** Debounce a fast-changing value (search inputs etc). */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type Toast = ReturnType<typeof useToast>;

/**
 * Standard tRPC mutation handlers — removes the repeated success/error toast +
 * callback boilerplate across every page. Pass it the toast instance.
 */
export function mutationToast(
  toast: Toast,
  opts: { success?: string; error?: string; onDone?: () => void } = {},
) {
  return {
    onSuccess: () => {
      if (opts.success) toast.success(opts.success);
      opts.onDone?.();
    },
    onError: (e: { message: string }) => toast.error(opts.error ?? "Something went wrong", e.message),
  };
}
