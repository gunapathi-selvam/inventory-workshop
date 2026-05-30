/** SearchBar — a rounded search input with a leading icon. */
import * as React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "~/theme";
import type { Theme } from "~/theme";
import { Icon } from "./Icon";

export interface SearchBarProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = "Search" }: SearchBarProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.wrap}>
      <Icon name="search" size="sm" color="mutedForeground" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      height: theme.sizing.controlHeight.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.md,
      borderWidth: theme.sizing.borderWidth.thin,
      borderColor: theme.colors.input,
      backgroundColor: theme.colors.card,
    },
    input: {
      flex: 1,
      color: theme.colors.foreground,
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.sans,
    },
  });
