/**
 * SEMANTIC COLOR TOKENS.
 *
 * Components reference semantic names (`colors.primary`, `colors.cardForeground`)
 * — never a palette primitive and never a literal. Each scheme maps the same
 * semantic names onto different palette entries, so dark mode is automatic.
 */
import { palette } from "./palette";

export interface ColorScheme {
  /** App background. */
  background: string;
  /** Default text on background. */
  foreground: string;

  /** Raised surfaces (cards, sheets, headers). */
  card: string;
  cardForeground: string;

  /** Low-emphasis surface + text (chips, secondary panels, hints). */
  muted: string;
  mutedForeground: string;

  /** Hairlines and input outlines. */
  border: string;
  input: string;
  /** Focus ring. */
  ring: string;

  /** Primary brand action. */
  primary: string;
  primaryForeground: string;
  /** Subtle neutral button surface. */
  secondary: string;
  secondaryForeground: string;
  /** Accent (secondary brand hue). */
  accent: string;
  accentForeground: string;

  /** Status colors + readable text on each. */
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  danger: string;
  dangerForeground: string;
  info: string;
  infoForeground: string;

  /** Chart series palette. */
  chart: [string, string, string, string, string];
}

export const lightColors: ColorScheme = {
  background: palette.white,
  foreground: palette.ink900,

  card: palette.white,
  cardForeground: palette.ink900,

  muted: palette.slate50,
  mutedForeground: palette.slate500,

  border: palette.slate200,
  input: palette.slate200,
  ring: palette.indigo500,

  primary: palette.indigo500,
  primaryForeground: palette.white,
  secondary: palette.slate100,
  secondaryForeground: palette.ink800,
  accent: palette.violet500,
  accentForeground: palette.white,

  success: palette.green600,
  successForeground: palette.white,
  warning: palette.amber500,
  warningForeground: palette.amber950,
  danger: palette.red600,
  dangerForeground: palette.white,
  info: palette.blue500,
  infoForeground: palette.white,

  chart: [palette.indigo500, palette.green600, palette.amber500, palette.violet500, palette.red600],
};

export const darkColors: ColorScheme = {
  background: palette.night950,
  foreground: palette.fog200,

  card: palette.night900,
  cardForeground: palette.fog200,

  muted: palette.night700,
  mutedForeground: palette.fog400,

  border: palette.night600,
  input: palette.night600,
  ring: palette.indigo400,

  primary: palette.indigo400,
  primaryForeground: palette.night950,
  secondary: palette.night800,
  secondaryForeground: palette.fog200,
  accent: palette.violet400,
  accentForeground: palette.night950,

  success: palette.green500,
  successForeground: palette.white,
  warning: palette.amber400,
  warningForeground: palette.amber950,
  danger: palette.red500,
  dangerForeground: palette.white,
  info: palette.blue400,
  infoForeground: palette.white,

  chart: [palette.indigo400, palette.green500, palette.amber400, palette.violet400, palette.red500],
};
