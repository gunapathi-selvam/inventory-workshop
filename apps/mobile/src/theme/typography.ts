/**
 * TYPOGRAPHY TOKENS — font families, the type scale, weights, line heights,
 * letter spacing, and the named text variants components use.
 *
 * A <Text> in this app always picks a `variant`; it never sets a raw fontSize.
 */
import { Platform } from "react-native";

export const fontFamily = {
  sans: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
  medium: Platform.select({ ios: "System", android: "sans-serif-medium", default: "System" }),
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  display: 36,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeight = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.45,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  tight: -0.3,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
} as const;

export interface TextVariant {
  fontSize: number;
  lineHeight: number;
  fontWeight: (typeof fontWeight)[keyof typeof fontWeight];
  fontFamily: string;
  letterSpacing: number;
  textTransform?: "none" | "uppercase";
}

const variant = (
  size: number,
  weight: (typeof fontWeight)[keyof typeof fontWeight],
  lh: number,
  ls: number = letterSpacing.normal,
  family: string = fontFamily.sans,
  textTransform: "none" | "uppercase" = "none",
): TextVariant => ({
  fontSize: size,
  lineHeight: Math.round(size * lh),
  fontWeight: weight,
  fontFamily: family,
  letterSpacing: ls,
  textTransform,
});

export const textVariants = {
  display: variant(fontSize.display, fontWeight.bold, lineHeight.tight, letterSpacing.tight),
  title: variant(fontSize["2xl"], fontWeight.bold, lineHeight.tight, letterSpacing.tight),
  heading: variant(fontSize.xl, fontWeight.semibold, lineHeight.snug),
  subtitle: variant(fontSize.lg, fontWeight.semibold, lineHeight.snug),
  body: variant(fontSize.md, fontWeight.regular, lineHeight.normal),
  bodyStrong: variant(fontSize.md, fontWeight.semibold, lineHeight.normal),
  label: variant(fontSize.sm, fontWeight.medium, lineHeight.snug),
  caption: variant(fontSize.xs, fontWeight.regular, lineHeight.snug),
  overline: variant(fontSize.xs, fontWeight.semibold, lineHeight.snug, letterSpacing.wider, fontFamily.medium, "uppercase"),
  mono: variant(fontSize.sm, fontWeight.regular, lineHeight.normal, letterSpacing.normal, fontFamily.mono),
} as const;

export type TextVariantName = keyof typeof textVariants;

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  variants: textVariants,
} as const;
