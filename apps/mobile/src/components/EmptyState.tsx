/** EmptyState — friendly placeholder for empty lists or errors. */
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "~/theme";
import { Icon, type IoniconName } from "./Icon";
import { Text } from "./Text";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: IoniconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = "file-tray-outline", title, message, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.center, { gap: theme.spacing.md, padding: theme.spacing.xxl }]}>
      <Icon name={icon} size="xl" color="mutedForeground" />
      <Text variant="subtitle" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="mutedForeground" align="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="outline" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
