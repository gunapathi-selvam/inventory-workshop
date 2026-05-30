/** StatCard — a KPI tile for the dashboard: label, big value, optional icon. */
import * as React from "react";
import { View } from "react-native";
import { useTheme } from "~/theme";
import type { ColorScheme } from "~/theme";
import { Card } from "./Card";
import { Text } from "./Text";
import { Icon, type IoniconName } from "./Icon";
import { Row } from "./Stack";

export interface StatCardProps {
  label: string;
  value: string;
  icon?: IoniconName;
  tone?: keyof ColorScheme;
  hint?: string;
}

export function StatCard({ label, value, icon, tone = "primary", hint }: StatCardProps) {
  const theme = useTheme();
  return (
    <Card style={{ flex: 1, minWidth: 0 }}>
      <Row justify="space-between" align="flex-start">
        <Text variant="caption" color="mutedForeground">
          {label}
        </Text>
        {icon ? <Icon name={icon} size="sm" color={tone} /> : null}
      </Row>
      <View style={{ height: theme.spacing.sm }} />
      <Text variant="title" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color="mutedForeground" style={{ marginTop: theme.spacing.xxs }}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}
