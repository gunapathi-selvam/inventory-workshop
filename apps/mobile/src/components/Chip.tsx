/** Chip — a selectable filter pill. Selected state uses the primary token. */
import * as React from "react";
import { Pressable } from "react-native";
import { useTheme } from "~/theme";
import { Text } from "./Text";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radii.pill,
        borderWidth: theme.sizing.borderWidth.thin,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primary : theme.colors.card,
        opacity: pressed ? theme.opacity.pressed : theme.opacity.full,
      })}
    >
      <Text variant="label" color={selected ? "primaryForeground" : "mutedForeground"}>
        {label}
      </Text>
    </Pressable>
  );
}
