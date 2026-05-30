/**
 * Icon — thin wrapper over Ionicons that resolves size + color from theme
 * tokens, so screens never pass raw pixel sizes or hex colors to icons.
 */
import * as React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "~/theme";
import type { ColorScheme } from "~/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export interface IconProps {
  name: IoniconName;
  size?: keyof ReturnType<typeof useTheme>["sizing"]["iconSize"];
  color?: keyof ColorScheme;
}

export function Icon({ name, size = "md", color = "foreground" }: IconProps) {
  const theme = useTheme();
  return <Ionicons name={name} size={theme.sizing.iconSize[size]} color={theme.colors[color] as string} />;
}

export type { IoniconName };
