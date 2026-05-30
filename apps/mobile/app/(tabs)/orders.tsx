/** Orders list — search + status filter, tap through to an order's detail. */
import * as React from "react";
import { FlatList, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ORDER_STATUS } from "@workshop/core";
import { useTheme } from "~/theme";
import {
  Badge,
  Chip,
  EmptyState,
  ListRow,
  SearchBar,
  Spinner,
  Stack,
  Text,
} from "~/components";
import { api } from "~/api/trpc";
import { money, STATUS_TONE, titleCase } from "~/lib/format";

type StatusFilter = (typeof ORDER_STATUS)[number] | "ALL";

export default function OrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("ALL");

  const query = api.order.list.useQuery({
    page: 1,
    pageSize: 50,
    search: search.trim() || undefined,
    status: status === "ALL" ? undefined : status,
  });

  const items = query.data?.items ?? [];

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        padding: theme.layoutSpacing.page,
        paddingBottom: insets.bottom + theme.layoutSpacing.section,
        gap: theme.spacing.sm,
      }}
      data={items}
      keyExtractor={(o) => o.id}
      ListHeaderComponent={
        <Stack gap="md" style={{ marginBottom: theme.spacing.sm }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search orders or customers" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
            <Chip label="All" selected={status === "ALL"} onPress={() => setStatus("ALL")} />
            {ORDER_STATUS.map((s) => (
              <Chip key={s} label={titleCase(s)} selected={status === s} onPress={() => setStatus(s)} />
            ))}
          </ScrollView>
        </Stack>
      }
      renderItem={({ item }) => (
        <ListRow
          title={item.orderNumber}
          subtitle={item.customer?.name ?? "—"}
          trailing={<Badge label={titleCase(item.status)} tone={STATUS_TONE[item.status] ?? "default"} />}
          caption={`${item.items.length} item${item.items.length === 1 ? "" : "s"} · ${money(item.total)}`}
          onPress={() => router.push(`/order/${item.id}`)}
        />
      )}
      ListEmptyComponent={
        query.isLoading ? (
          <View style={{ paddingTop: theme.spacing.huge }}>
            <Spinner label="Loading orders…" />
          </View>
        ) : (
          <EmptyState icon="cart-outline" title="No orders found" message="Try a different search or filter." />
        )
      }
      ListFooterComponent={
        query.data && query.data.total > items.length ? (
          <Text variant="caption" color="mutedForeground" align="center" style={{ paddingVertical: theme.spacing.md }}>
            Showing {items.length} of {query.data.total}
          </Text>
        ) : null
      }
      refreshing={query.isFetching}
      onRefresh={() => query.refetch()}
    />
  );
}
