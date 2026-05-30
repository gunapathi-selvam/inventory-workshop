/**
 * Badge — small status pill. `tone` selects a semantic color; the soft style
 * (default) tints text on the muted surface, `solid` fills with the tone color.
 */
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "~/theme";
import type { Theme } from "~/theme";
import { Text } from "./Text";

export type BadgeTone = "default" | "primary" | "success" | "warning" | "danger" | "info" | "accent";

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  solid?: boolean;
}

function toneColors(theme: Theme, tone: BadgeTone) {
  const c = theme.colors;
  const map: Record<BadgeTone, { color: string; on: keyof Theme["colors"] }> = {
    default: { color: c.mutedForeground, on: "secondaryForeground" },
    primary: { color: c.primary, on: "primaryForeground" },
    success: { color: c.success, on: "successForeground" },
    warning: { color: c.warning, on: "warningForeground" },
    danger: { color: c.danger, on: "dangerForeground" },
    info: { color: c.info, on: "infoForeground" },
    accent: { color: c.accent, on: "accentForeground" },
  };
  return map[tone];
}

export function Badge({ label, tone = "default", solid = false }: BadgeProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const t = toneColors(theme, tone);

  return (
    <View style={[styles.badge, { backgroundColor: solid ? t.color : theme.colors.muted }]}>
      <Text
        variant="caption"
        style={{ color: solid ? (theme.colors[t.on] as string) : t.color, fontWeight: theme.typography.fontWeight.semibold }}
      >
        {label}
      </Text>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.radii.pill,
    },
  });
