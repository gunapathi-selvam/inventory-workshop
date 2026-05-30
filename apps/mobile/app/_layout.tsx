// Must be the first import for react-native-gesture-handler to initialize
// correctly (expo-router / react-navigation rely on it).
import "react-native-gesture-handler";

import * as React from "react";
import { Stack, useRouter, useRootNavigationState, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "~/theme";
import { TRPCProvider } from "~/api/trpc";
import { AuthProvider, useAuth } from "~/api/auth";
import { PermissionsProvider } from "~/lib/permissions";
import { ErrorBoundary, Spinner } from "~/components";

/** Redirects between the auth flow and the app shell based on session status.
 *  Waits for the navigator to be mounted before navigating (calling replace()
 *  too early throws the Expo Go "Something went wrong" error). */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();
  const navReady = !!navState?.key;

  React.useEffect(() => {
    if (!navReady || status === "loading") return;
    const inAuthFlow = segments[0] === "login";
    if (status === "unauthenticated" && !inAuthFlow) {
      router.replace("/login");
    } else if (status === "authenticated" && inAuthFlow) {
      router.replace("/(tabs)/dashboard");
    }
  }, [navReady, status, segments, router]);

  if (status === "loading") {
    return <Spinner label="Loading…" />;
  }
  return <>{children}</>;
}

function ThemedNavigator() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <AuthGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.card },
            headerTintColor: theme.colors.foreground,
            headerTitleStyle: { fontFamily: theme.typography.fontFamily.sans },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="order/[id]" options={{ title: "Order" }} />
          <Stack.Screen name="customer/[id]" options={{ title: "Customer" }} />
          <Stack.Screen name="filament/[id]" options={{ title: "Filament" }} />
          <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
          <Stack.Screen name="discounts" options={{ title: "Discount codes" }} />
          <Stack.Screen name="users" options={{ title: "Team members" }} />
        </Stack>
      </AuthGate>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <ErrorBoundary>
            <TRPCProvider>
              <AuthProvider>
                <PermissionsProvider>
                  <ThemedNavigator />
                </PermissionsProvider>
              </AuthProvider>
            </TRPCProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
