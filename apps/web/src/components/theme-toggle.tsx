"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/** Light/dark toggle for the topbar. `mounted` guards against a hydration
 *  mismatch — the resolved theme is only known on the client. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const className =
    "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  // Before mount the resolved theme is unknown on the server/first paint. Render
  // a theme-neutral placeholder so the SSR and client-hydration markup are
  // identical (every theme-dependent attribute — aria-label, onClick, icon —
  // must be gated, not just the icon).
  if (!mounted) {
    return (
      <button type="button" aria-label="Toggle theme" className={className}>
        <Sun className="size-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={className}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
