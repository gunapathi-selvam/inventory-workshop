/**
 * Card — a raised surface. Optional `onPress` makes it a tappable row/tile.
 * Padding, radius, border, and elevation all come from theme tokens.
 */
import * as React from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "~/theme";
import type { Theme, ShadowName } from "~/theme";

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevation?: ShadowName;
  padded?: boolean;
  style?: ViewStyle;
}

export function Card({ children, onPress, elevation = "sm", padded = true, style }: CardProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const base = [
    styles.card,
    theme.shadows[elevation] as ViewStyle,
    padded && styles.padded,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...base, { opacity: pressed ? theme.opacity.pressed : theme.opacity.full }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radii.lg,
      borderWidth: theme.sizing.borderWidth.hairline,
      borderColor: theme.colors.border,
    },
    padded: {
      padding: theme.layoutSpacing.card,
    },
  });
