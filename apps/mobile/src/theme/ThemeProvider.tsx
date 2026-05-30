/**
 * THEME PROVIDER + hooks. Wraps the app, follows the OS color scheme by default,
 * and lets the user override it. `useTheme()` is the single entry point every
 * component uses to read design tokens; `useThemedStyles()` builds a memoized
 * StyleSheet from the active theme so style objects aren't recreated each render.
 */
import * as React from "react";
import { useColorScheme } from "react-native";
import { themes, type Theme, type SchemeName } from "./theme";

type ThemePreference = SchemeName | "system";

interface ThemeContextValue {
  theme: Theme;
  /** "system" follows the OS; otherwise a forced scheme. */
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreference] = React.useState<ThemePreference>("system");

  const scheme: SchemeName = preference === "system" ? (system ?? "light") : preference;
  const theme = themes[scheme];

  const toggle = React.useCallback(() => {
    setPreference(scheme === "dark" ? "light" : "dark");
  }, [scheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference, toggle }),
    [theme, preference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

/** Read the active theme tokens. */
export function useTheme(): Theme {
  return useThemeContext().theme;
}
