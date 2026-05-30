/**
 * THEME PROVIDER + hooks. Wraps the app, follows the OS color scheme by default,
 * and lets the user override it (system / light / dark). The choice is persisted
 * to the OS keychain (expo-secure-store) and restored on launch — the first
 * paint is held until the saved value is read, so a forced light/dark choice
 * never flashes the system theme first. `useTheme()` is the single entry point
 * every component uses to read design tokens.
 */
import * as React from "react";
import { View, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { themes, type Theme, type SchemeName } from "./theme";

type ThemePreference = SchemeName | "system";

const PREFERENCE_KEY = "workshop.themePreference";

function isPreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

interface ThemeContextValue {
  theme: Theme;
  /** "system" follows the OS; otherwise a forced scheme. */
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = React.useState<ThemePreference>("system");
  const [hydrated, setHydrated] = React.useState(false);

  // Restore the saved preference once on launch. Always resolve `hydrated` (even
  // if SecureStore throws on a device) so the gate below can never hang.
  React.useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(PREFERENCE_KEY);
        if (isPreference(saved)) setPreferenceState(saved);
      } catch (e) {
        console.warn("Theme preference unavailable; following the OS scheme.", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setPreference = React.useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    // Fire-and-forget; a failed write just means the choice isn't remembered.
    SecureStore.setItemAsync(PREFERENCE_KEY, p).catch((e) =>
      console.warn("Failed to persist theme preference.", e),
    );
  }, []);

  const scheme: SchemeName = preference === "system" ? (system ?? "light") : preference;
  const theme = themes[scheme];

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference }),
    [theme, preference, setPreference],
  );

  // Hold the first paint until the saved preference is read so the rest of the
  // tree mounts already in the right scheme. The gate is filled with the active
  // theme's background (not a white default), so there's no white flash.
  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

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
