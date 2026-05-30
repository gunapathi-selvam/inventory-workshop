/** Bottom tab navigator. Tabs hide themselves when the user lacks the matching
 *  view permission (server still enforces it independently). */
import * as React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/theme";
import { useCan } from "~/lib/permissions";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const canOrders = useCan("orders.view");
  const canCustomers = useCan("customers.view");
  const canInventory = useCan("inventory.view");
  const canDashboard = useCan("dashboard.view");

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.foreground,
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        // Add the bottom safe-area inset to the bar's height and padding so the
        // tab icons/labels sit ABOVE the Android system nav buttons (Expo SDK 53
        // draws edge-to-edge by default, so without this the bar is occluded).
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: theme.sizing.layout.tabBarHeight + insets.bottom,
          paddingBottom: theme.spacing.sm + insets.bottom,
          paddingTop: theme.spacing.xs,
        },
        tabBarLabelStyle: { fontSize: theme.typography.fontSize.xs },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: tabIcon("grid-outline"),
          href: canDashboard ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: tabIcon("cart-outline"),
          href: canOrders ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
          tabBarIcon: tabIcon("people-outline"),
          href: canCustomers ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: tabIcon("layers-outline"),
          href: canInventory ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More", tabBarIcon: tabIcon("ellipsis-horizontal") }}
      />
    </Tabs>
  );
}
