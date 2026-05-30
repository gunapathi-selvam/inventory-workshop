/** FieldRow — a label/value pair for detail screens. */
import * as React from "react";
import { View } from "react-native";
import { useTheme } from "~/theme";
import { Text } from "./Text";

export interface FieldRowProps {
  label: string;
  value?: React.ReactNode;
}

export function FieldRow({ label, value }: FieldRowProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Text variant="body" color="mutedForeground">
        {label}
      </Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text variant="bodyStrong" style={{ flexShrink: 1, textAlign: "right" }}>
          {value}
        </Text>
      ) : (
        value ?? <Text variant="body" color="mutedForeground">—</Text>
      )}
    </View>
  );
}
