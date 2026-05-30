/**
 * Button — variants and sizes driven entirely by theme tokens. Handles pressed
 * and disabled states with opacity tokens and shows a spinner when `loading`.
 */
import * as React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "~/theme";
import type { Theme } from "~/theme";
import { Text } from "./Text";
import { Icon, type IoniconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IoniconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

interface VariantStyle {
  background: string;
  border: string;
  foreground: keyof Theme["colors"];
}

function variantStyles(theme: Theme): Record<ButtonVariant, VariantStyle> {
  const c = theme.colors;
  return {
    primary: { background: c.primary, border: c.primary, foreground: "primaryForeground" },
    secondary: { background: c.secondary, border: c.secondary, foreground: "secondaryForeground" },
    outline: { background: "transparent", border: c.border, foreground: "foreground" },
    ghost: { background: "transparent", border: "transparent", foreground: "foreground" },
    danger: { background: c.danger, border: c.danger, foreground: "dangerForeground" },
  };
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const v = variantStyles(theme)[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        {
          backgroundColor: v.background,
          borderColor: v.border,
          opacity: isDisabled
            ? theme.opacity.disabled
            : pressed
              ? theme.opacity.pressed
              : theme.opacity.full,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors[v.foreground] as string} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={size === "lg" ? "md" : "sm"} color={v.foreground} /> : null}
          <Text variant="label" color={v.foreground}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.radii.md,
      borderWidth: theme.sizing.borderWidth.thin,
      paddingHorizontal: theme.spacing.lg,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    sm: { height: theme.sizing.controlHeight.sm },
    md: { height: theme.sizing.controlHeight.md },
    lg: { height: theme.sizing.controlHeight.lg },
  });
