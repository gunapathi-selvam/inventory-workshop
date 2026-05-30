/**
 * PALETTE — the ONLY file in the app where raw color literals are allowed.
 *
 * Everything else (colors.ts, components, screens) references these names; no
 * screen or component ever writes a hex/hsl string. Re-brand the whole app by
 * editing values here. Values mirror the web design tokens
 * (packages/ui/src/tokens.css) so web and mobile stay visually identical.
 *
 * Colors are authored as HSL channels and rendered with `hsl(h, s%, l%)`,
 * which React Native's color parser understands.
 */

/** Build an `hsl()` string React Native can parse. */
export const hsl = (h: number, s: number, l: number): string => `hsl(${h}, ${s}%, ${l}%)`;

export const palette = {
  white: hsl(0, 0, 100),
  black: hsl(0, 0, 0),

  // Neutral / ink ramp (light)
  ink900: hsl(222, 30, 12),
  ink800: hsl(222, 30, 16),
  slate50: hsl(220, 16, 96),
  slate100: hsl(220, 16, 94),
  slate200: hsl(220, 16, 88),
  slate500: hsl(220, 10, 44),

  // Neutral / ink ramp (dark)
  night950: hsl(222, 28, 9),
  night900: hsl(222, 26, 12),
  night800: hsl(222, 20, 18),
  night700: hsl(222, 20, 16),
  night600: hsl(222, 18, 22),
  fog200: hsl(220, 16, 92),
  fog400: hsl(220, 12, 60),

  // Brand + accents (light)
  indigo500: hsl(244, 75, 58),
  indigo400: hsl(244, 75, 64),
  violet500: hsl(270, 70, 60),
  violet400: hsl(270, 70, 66),

  // Status (light)
  green600: hsl(152, 60, 40),
  green500: hsl(152, 55, 46),
  amber500: hsl(38, 92, 50),
  amber400: hsl(38, 92, 56),
  amber950: hsl(30, 40, 14),
  red600: hsl(0, 72, 51),
  red500: hsl(0, 72, 58),
  blue500: hsl(210, 90, 54),
  blue400: hsl(210, 90, 60),
} as const;

export type PaletteToken = keyof typeof palette;
