/**
 * Text — the only text primitive in the app. Pick a typographic `variant` and a
 * semantic `color` token; never pass a raw fontSize or hex color.
 */
import * as React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { useTheme } from "~/theme";
import type { TextVariantName } from "~/theme";
import type { ColorScheme } from "~/theme";

export interface TextProps extends RNTextProps {
  variant?: TextVariantName;
  color?: keyof ColorScheme;
  align?: "auto" | "left" | "center" | "right";
}

export function Text({
  variant = "body",
  color = "foreground",
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const v = theme.typography.variants[variant];
  const resolved = theme.colors[color];
  return (
    <RNText
      style={[
        {
          fontSize: v.fontSize,
          lineHeight: v.lineHeight,
          fontWeight: v.fontWeight,
          fontFamily: v.fontFamily,
          letterSpacing: v.letterSpacing,
          textTransform: v.textTransform,
          color: typeof resolved === "string" ? resolved : theme.colors.foreground,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  );
}
