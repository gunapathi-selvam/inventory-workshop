/**
 * Stack / Row — layout primitives. Spacing between children comes from a
 * spacing token name (`gap`), so screens don't hard-code margins. Both the raw
 * scale (`md`, `lg`…) and the named layout spacings (`section`, `card`…) are
 * accepted.
 */
import * as React from "react";
import { View, type ViewStyle } from "react-native";
import { useTheme } from "~/theme";
import type { SpacingToken } from "~/theme";
import { layoutSpacing } from "~/theme";

type GapToken = SpacingToken | keyof typeof layoutSpacing;

interface StackProps {
  children: React.ReactNode;
  gap?: GapToken;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  style?: ViewStyle;
}

/** Resolve a gap token from either the raw scale or the named layout spacings. */
function useGap(gap: GapToken): number {
  const theme = useTheme();
  if (gap in theme.spacing) return theme.spacing[gap as SpacingToken];
  return theme.layoutSpacing[gap as keyof typeof layoutSpacing];
}

export function Stack({ children, gap = "md", align, justify, style }: StackProps) {
  const value = useGap(gap);
  return (
    <View style={[{ gap: value, alignItems: align, justifyContent: justify }, style]}>{children}</View>
  );
}

export function Row({ children, gap = "sm", align = "center", justify, style }: StackProps) {
  const value = useGap(gap);
  return (
    <View
      style={[
        { flexDirection: "row", gap: value, alignItems: align, justifyContent: justify },
        style,
      ]}
    >
      {children}
    </View>
  );
}
