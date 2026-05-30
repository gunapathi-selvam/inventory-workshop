/**
 * Screen — page shell. Applies safe-area insets, the background token, and
 * standard page padding. `scroll` wraps content in a ScrollView with optional
 * pull-to-refresh; otherwise it's a plain padded View.
 */
import * as React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/theme";
import type { Theme } from "~/theme";

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Respect the top safe-area inset (off when a header already does). */
  edgeTop?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  refreshing,
  onRefresh,
  edgeTop = false,
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);

  const padding: ViewStyle = {
    paddingHorizontal: padded ? theme.layoutSpacing.page : 0,
    paddingTop: edgeTop ? insets.top + theme.layoutSpacing.page : padded ? theme.layoutSpacing.page : 0,
    paddingBottom: insets.bottom + theme.layoutSpacing.section,
  };

  if (scroll) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.root, padding, contentStyle]}>{children}</View>;
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });
