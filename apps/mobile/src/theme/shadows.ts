/**
 * ELEVATION / SHADOW TOKENS. React Native needs both iOS shadow* props and an
 * Android `elevation`, so each token is a ready-to-spread style object. Shadow
 * color depends on the scheme, so these are produced per color scheme.
 */
import type { ViewStyle } from "react-native";

export interface ShadowToken {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface Shadows {
  none: ViewStyle;
  sm: ShadowToken;
  md: ShadowToken;
  lg: ShadowToken;
}

/** Build the shadow set for a scheme. Dark mode uses pure-black, denser shadows. */
export function createShadows(isDark: boolean): Shadows {
  const shadowColor = isDark ? "hsl(0, 0%, 0%)" : "hsl(222, 30%, 12%)";
  const o = (light: number, dark: number) => (isDark ? dark : light);
  return {
    none: { shadowColor: "transparent", shadowOpacity: 0, elevation: 0 },
    sm: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: o(0.06, 0.3),
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: o(0.1, 0.45),
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: o(0.16, 0.6),
      shadowRadius: 24,
      elevation: 12,
    },
  };
}

export type ShadowName = keyof Shadows;
