/**
 * THEME ASSEMBLY — combines every token segment into a single `Theme` object,
 * one per color scheme. Components receive this via `useTheme()` and read tokens
 * by name; nothing in the UI layer imports the individual segment files.
 */
import { lightColors, darkColors, type ColorScheme } from "./colors";
import { typography } from "./typography";
import { spacing, layoutSpacing } from "./spacing";
import { radii } from "./radii";
import { createShadows, type Shadows } from "./shadows";
import { sizing } from "./sizing";
import { opacity } from "./opacity";

export type SchemeName = "light" | "dark";

export interface Theme {
  scheme: SchemeName;
  isDark: boolean;
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  layoutSpacing: typeof layoutSpacing;
  radii: typeof radii;
  shadows: Shadows;
  sizing: typeof sizing;
  opacity: typeof opacity;
}

function build(scheme: SchemeName): Theme {
  const isDark = scheme === "dark";
  return {
    scheme,
    isDark,
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    layoutSpacing,
    radii,
    shadows: createShadows(isDark),
    sizing,
    opacity,
  };
}

export const lightTheme: Theme = build("light");
export const darkTheme: Theme = build("dark");

export const themes: Record<SchemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};
