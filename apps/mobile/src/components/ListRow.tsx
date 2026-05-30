/**
 * ListRow — a tappable card row with a title, optional subtitle, a trailing
 * slot (badge/value), and a chevron. The workhorse of every list screen.
 */
import * as React from "react";
import { View } from "react-native";
import { useTheme } from "~/theme";
import { Card } from "./Card";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { Row } from "./Stack";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  caption?: string;
  onPress?: () => void;
  chevron?: boolean;
}

export function ListRow({ title, subtitle, trailing, caption, onPress, chevron = true }: ListRowProps) {
  const theme = useTheme();
  return (
    <Card onPress={onPress}>
      <Row justify="space-between">
        <View style={{ flex: 1, gap: theme.spacing.xxs }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Row gap="sm">
          <View style={{ alignItems: "flex-end", gap: theme.spacing.xxs }}>
            {trailing}
            {caption ? (
              <Text variant="caption" color="mutedForeground">
                {caption}
              </Text>
            ) : null}
          </View>
          {chevron && onPress ? <Icon name="chevron-forward" size="sm" color="mutedForeground" /> : null}
        </Row>
      </Row>
    </Card>
  );
}
