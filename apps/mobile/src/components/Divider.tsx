/** Divider — a hairline rule using the border token. */
import * as React from "react";
import { View, type ViewStyle } from "react-native";
import { useTheme } from "~/theme";

export function Divider({ style }: { style?: ViewStyle }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          height: theme.sizing.borderWidth.hairline,
          backgroundColor: theme.colors.border,
        },
        style,
      ]}
    />
  );
}
