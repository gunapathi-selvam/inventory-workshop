/** Avatar — initials in a colored circle. Size and colors are theme tokens. */
import * as React from "react";
import { View } from "react-native";
import { useTheme } from "~/theme";
import { Text } from "./Text";

export interface AvatarProps {
  name?: string | null;
  size?: "sm" | "md" | "lg";
}

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Avatar({ name, size = "md" }: AvatarProps) {
  const theme = useTheme();
  const dim = theme.sizing.avatarSize[size];
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: theme.radii.pill,
        backgroundColor: theme.colors.secondary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text variant={size === "lg" ? "subtitle" : "label"} color="secondaryForeground">
        {initials(name)}
      </Text>
    </View>
  );
}
