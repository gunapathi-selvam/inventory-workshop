/** Discount codes — read-only list of codes, their value, and status. */
import * as React from "react";
import { FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/theme";
import { Badge, EmptyState, ListRow, Spinner } from "~/components";
import { api } from "~/api/trpc";
import { money } from "~/lib/format";

export default function DiscountsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const query = api.discount.list.useQuery();

  if (query.isLoading) return <Spinner label="Loading discounts…" />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        padding: theme.layoutSpacing.page,
        paddingBottom: insets.bottom + theme.layoutSpacing.section,
        gap: theme.spacing.sm,
      }}
      data={query.data ?? []}
      keyExtractor={(d) => d.id}
      renderItem={({ item }) => {
        const value = item.type === "PERCENT" ? `${item.displayValue}%` : money(Math.round(item.displayValue * 100));
        const usage = item.maxUses ? `${item.usedCount}/${item.maxUses} used` : `${item.usedCount} used`;
        return (
          <ListRow
            title={item.code}
            subtitle={`${value} off · ${usage}`}
            trailing={<Badge label={item.active ? "Active" : "Inactive"} tone={item.active ? "success" : "default"} />}
            chevron={false}
          />
        );
      }}
      ListEmptyComponent={<EmptyState icon="pricetags-outline" title="No discount codes" />}
      refreshing={query.isFetching}
      onRefresh={() => query.refetch()}
    />
  );
}
