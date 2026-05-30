/**
 * OPACITY TOKENS — interaction and emphasis states. Components use these names
 * (e.g. `opacity.disabled`) instead of magic numbers.
 */
export const opacity = {
  full: 1,
  pressed: 0.7,
  muted: 0.6,
  disabled: 0.45,
} as const;

export type OpacityToken = keyof typeof opacity;
