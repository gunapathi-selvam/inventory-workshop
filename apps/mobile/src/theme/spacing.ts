/**
 * SPACING SCALE — every margin, padding, and gap in the app comes from here.
 * Values are density-independent pixels (React Native's unitless numbers).
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

/** Named, intent-based spacing used by layout primitives. */
export const layoutSpacing = {
  /** Default screen edge padding. */
  page: spacing.lg,
  /** Gap between major sections on a screen. */
  section: spacing.xl,
  /** Inner padding of cards/list items. */
  card: spacing.lg,
  /** Default gap between stacked elements. */
  gap: spacing.md,
  /** Tight gap (icon ↔ label). */
  inline: spacing.sm,
} as const;

export type SpacingToken = keyof typeof spacing;
