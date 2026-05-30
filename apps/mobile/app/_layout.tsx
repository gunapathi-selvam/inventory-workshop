/**
 * Root layout — composes every provider and the themed navigation stack.
 *
 * Provider order matters: Theme (tokens) → SafeArea → tRPC (query client) →
 * Auth (needs the query client to call auth.login/me) → Permissions (needs auth).
 */
import * as React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "~/theme";
import { TRPCProvider } from "~/api/trpc";
import { AuthProvider, useAuth } from "~/api/auth";
import { PermissionsProvider } from "~/lib/permissions";
import { Spinner } from "~/components";

/** Redirects between the auth flow and the app shell based on session status. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "loading") return;
    const inAuthFlow = segments[0] === "login";
    if (status === "unauthenticated" && !inAuthFlow) {
      router.replace("/login");
    } else if (status === "authenticated" && inAuthFlow) {
      router.replace("/(tabs)/dashboard");
    }
  }, [status, segments, router]);

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
    <ThemeProvider>
      <SafeAreaProvider>
        <TRPCProvider>
          <AuthProvider>
            <PermissionsProvider>
              <ThemedNavigator />
            </PermissionsProvider>
          </AuthProvider>
        </TRPCProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
