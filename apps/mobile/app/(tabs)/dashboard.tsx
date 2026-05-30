/** Dashboard — KPIs, order status breakdown, low-stock alerts, recent orders.
 *  Mirrors the web dashboard, reading the same dashboard.stats endpoint. */
import * as React from "react";
import { Pressable, View } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useTheme } from "~/theme";
import {
  Badge,
  Card,
  EmptyState,
  Icon,
  ListRow,
  Row,
  Screen,
  Spinner,
  Stack,
  StatCard,
  Text,
} from "~/components";
import { api } from "~/api/trpc";
import { useAuth } from "~/api/auth";
import { money, STATUS_TONE, titleCase } from "~/lib/format";

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const stats = api.dashboard.stats.useQuery({ days: 30 });

  // A notifications bell in the header.
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push("/notifications")}
          hitSlop={theme.sizing.layout.hitSlop}
          style={{ paddingHorizontal: theme.spacing.md }}
        >
          <Icon name="notifications-outline" size="md" color="foreground" />
        </Pressable>
      ),
    });
  }, [navigation, router, theme]);

  if (stats.isLoading) return <Spinner label="Loading dashboard…" />;
  if (stats.isError || !stats.data)
    return <EmptyState icon="warning-outline" title="Couldn't load dashboard" message="Pull to retry." />;

  const { kpis, statusCounts, lowStockItems, recent } = stats.data;
  const isAdmin = user?.role === "ADMIN";

  const tiles = [
    { label: "Revenue (30d)", value: money(kpis.revenue), icon: "cash-outline" as const, tone: "success" as const },
    ...(isAdmin
      ? [{ label: "Profit (30d)", value: money(kpis.profit), icon: "trending-up-outline" as const, tone: "primary" as const }]
      : []),
    { label: "Orders (30d)", value: String(kpis.orderCount), icon: "cart-outline" as const, tone: "info" as const },
    { label: "Customers", value: String(kpis.customerCount), icon: "people-outline" as const, tone: "accent" as const },
    { label: "Low stock", value: String(kpis.lowStockCount), icon: "alert-circle-outline" as const, tone: "warning" as const },
  ];

  return (
    <Screen scroll refreshing={stats.isFetching} onRefresh={() => stats.refetch()}>
      <Stack gap="section">
        {/* KPI grid: two tiles per row */}
        <Stack gap="md">
          {chunk(tiles, 2).map((pair, i) => (
            <Row key={i} gap="md" align="stretch">
              {pair.map((t) => (
                <StatCard key={t.label} label={t.label} value={t.value} icon={t.icon} tone={t.tone} />
              ))}
              {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </Row>
          ))}
        </Stack>

        {/* Status breakdown */}
        <Stack gap="md">
          <Text variant="heading">Orders by status</Text>
          <Card>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
              {statusCounts.map((s) => (
                <View key={s.status} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                  <Badge label={titleCase(s.status)} tone={STATUS_TONE[s.status] ?? "default"} />
                  <Text variant="bodyStrong">{s.count}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Stack>

        {/* Low stock */}
        {lowStockItems.length > 0 ? (
          <Stack gap="md">
            <Text variant="heading">Low stock</Text>
            <Stack gap="sm">
              {lowStockItems.map((f) => (
                <ListRow
                  key={f.id}
                  title={`${f.type} · ${f.color}`}
                  subtitle={`${f.weightRemainingG} g left · threshold ${f.lowStockThresholdG} g`}
                  trailing={<Badge label="Low" tone="warning" />}
                  onPress={() => router.push(`/filament/${f.id}`)}
                />
              ))}
            </Stack>
          </Stack>
        ) : null}

        {/* Recent orders */}
        <Stack gap="md">
          <Text variant="heading">Recent orders</Text>
          {recent.length === 0 ? (
            <EmptyState icon="cart-outline" title="No orders yet" />
          ) : (
            <Stack gap="sm">
              {recent.map((o) => (
                <ListRow
                  key={o.id}
                  title={o.orderNumber}
                  subtitle={o.customer?.name ?? "—"}
                  trailing={<Badge label={titleCase(o.status)} tone={STATUS_TONE[o.status] ?? "default"} />}
                  caption={money(o.total)}
                  onPress={() => router.push(`/order/${o.id}`)}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Screen>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
