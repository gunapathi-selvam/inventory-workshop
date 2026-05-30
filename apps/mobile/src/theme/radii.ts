/**
 * BORDER RADIUS SCALE. Mirrors the web radius tokens (rem → dp).
 */
export const radii = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  /** Fully rounded (pills, avatars, FABs). */
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;
