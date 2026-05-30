/** Spinner — centered loading indicator using the primary color token. */
import * as React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "~/theme";
import { Text } from "./Text";

export function Spinner({ label }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.center, { gap: theme.spacing.md }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {label ? (
        <Text variant="caption" color="mutedForeground">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
