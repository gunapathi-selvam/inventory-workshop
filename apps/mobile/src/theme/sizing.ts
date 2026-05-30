/**
 * SIZING TOKENS — fixed component and layout dimensions: control heights, icon
 * sizes, border widths, avatars, and chrome heights. No screen hard-codes a
 * pixel dimension; it reads one of these.
 */
import { StyleSheet } from "react-native";

/** Heights for tappable controls (buttons, inputs, select rows). */
export const controlHeight = {
  sm: 36,
  md: 44,
  lg: 52,
} as const;

/** Icon glyph sizes. */
export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export const borderWidth = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  thick: 2,
} as const;

export const avatarSize = {
  sm: 32,
  md: 40,
  lg: 56,
} as const;

/** App chrome + layout dimensions. */
export const layout = {
  headerHeight: 56,
  tabBarHeight: 60,
  /** Minimum touch target (accessibility). */
  hitSlop: 8,
  minTouchTarget: 44,
  /** Caps content width on tablets/large screens. */
  maxContentWidth: 640,
  /** Thickness of progress/track bars. */
  trackHeight: 8,
} as const;

export const sizing = {
  controlHeight,
  iconSize,
  borderWidth,
  avatarSize,
  layout,
} as const;
