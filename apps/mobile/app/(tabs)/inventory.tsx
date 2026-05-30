/** Inventory list — filament stock with low-stock badges; tap for detail. */
import * as React from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/theme";
import { Badge, EmptyState, ListRow, SearchBar, Spinner } from "~/components";
import { api } from "~/api/trpc";
import { ratePerGram } from "~/lib/format";

export default function InventoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState("");

  const query = api.filament.list.useQuery({ page: 1, pageSize: 50, search: search.trim() || undefined });
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
      keyExtractor={(f) => f.id}
      ListHeaderComponent={
        <View style={{ marginBottom: theme.spacing.sm }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search type or color" />
        </View>
      }
      renderItem={({ item }) => (
        <ListRow
          title={`${item.type} · ${item.color}`}
          subtitle={`${item.weightRemainingG} g · ${item.spoolCount} spool${item.spoolCount === 1 ? "" : "s"} · ${ratePerGram(item.sellRatePerGram)}`}
          trailing={item.lowStock ? <Badge label="Low" tone="warning" /> : <Badge label="OK" tone="success" />}
          onPress={() => router.push(`/filament/${item.id}`)}
        />
      )}
      ListEmptyComponent={
        query.isLoading ? (
          <View style={{ paddingTop: theme.spacing.huge }}>
            <Spinner label="Loading inventory…" />
          </View>
        ) : (
          <EmptyState icon="layers-outline" title="No filament found" />
        )
      }
      refreshing={query.isFetching}
      onRefresh={() => query.refetch()}
    />
  );
}
