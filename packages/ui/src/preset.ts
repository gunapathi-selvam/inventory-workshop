/**
 * Tailwind preset mapping utilities to the design tokens in tokens.css. The web
 * app's tailwind.config extends this preset, so every color/radius/shadow/font
 * utility resolves to a CSS variable — no static values in component classes.
 */
import type { Config } from "tailwindcss";

const hsl = (v: string) => `hsl(var(${v}) / <alpha-value>)`;

export const preset = {
  darkMode: "class",
  content: [],
  theme: {
    extend: {
      colors: {
        background: hsl("--color-background"),
        foreground: hsl("--color-foreground"),
        card: { DEFAULT: hsl("--color-card"), foreground: hsl("--color-card-foreground") },
        muted: { DEFAULT: hsl("--color-muted"), foreground: hsl("--color-muted-foreground") },
        border: hsl("--color-border"),
        input: hsl("--color-input"),
        ring: hsl("--color-ring"),
        primary: { DEFAULT: hsl("--color-primary"), foreground: hsl("--color-primary-foreground") },
        secondary: { DEFAULT: hsl("--color-secondary"), foreground: hsl("--color-secondary-foreground") },
        accent: { DEFAULT: hsl("--color-accent"), foreground: hsl("--color-accent-foreground") },
        success: { DEFAULT: hsl("--color-success"), foreground: hsl("--color-success-foreground") },
        warning: { DEFAULT: hsl("--color-warning"), foreground: hsl("--color-warning-foreground") },
        danger: { DEFAULT: hsl("--color-danger"), foreground: hsl("--color-danger-foreground") },
        info: { DEFAULT: hsl("--color-info"), foreground: hsl("--color-info-foreground") },
        chart: {
          1: hsl("--color-chart-1"),
          2: hsl("--color-chart-2"),
          3: hsl("--color-chart-3"),
          4: hsl("--color-chart-4"),
          5: hsl("--color-chart-5"),
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      spacing: {
        page: "var(--space-page)",
        section: "var(--space-section)",
        card: "var(--space-card)",
        sidebar: "var(--sidebar-width)",
        header: "var(--header-height)",
      },
    },
  },
  plugins: [],
} satisfies Omit<Config, "content"> & { content: string[] };
