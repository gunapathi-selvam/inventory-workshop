/**
 * TextField — labeled text input with optional helper/error text. Colors,
 * height, radius, and spacing are theme tokens; focus uses the ring token.
 */
import * as React from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "~/theme";
import type { Theme } from "~/theme";
import { Text } from "./Text";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  helper?: string;
}

export function TextField({ label, error, helper, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="label" color="foreground" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.mutedForeground}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            borderColor: error ? theme.colors.danger : focused ? theme.colors.ring : theme.colors.input,
          },
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger" style={styles.hint}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="mutedForeground" style={styles.hint}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { gap: theme.spacing.xs },
    label: { marginBottom: theme.spacing.xxs },
    input: {
      height: theme.sizing.controlHeight.md,
      borderWidth: theme.sizing.borderWidth.thin,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.background,
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.sans,
    },
    hint: { marginTop: theme.spacing.xxs },
  });
