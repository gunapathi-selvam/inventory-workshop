/** Customers list — searchable, tap through to a customer's detail. */
import * as React from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/theme";
import { Avatar, EmptyState, ListRow, Row, SearchBar, Spinner, Stack } from "~/components";
import { api } from "~/api/trpc";

export default function CustomersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState("");

  const query = api.customer.list.useQuery({ page: 1, pageSize: 50, search: search.trim() || undefined });
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
      keyExtractor={(c) => c.id}
      ListHeaderComponent={
        <View style={{ marginBottom: theme.spacing.sm }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, phone or email" />
        </View>
      }
      renderItem={({ item }) => (
        <ListRow
          title={item.name}
          subtitle={item.phone || item.email || "No contact info"}
          trailing={<Avatar name={item.name} size="sm" />}
          onPress={() => router.push(`/customer/${item.id}`)}
        />
      )}
      ListEmptyComponent={
        query.isLoading ? (
          <View style={{ paddingTop: theme.spacing.huge }}>
            <Spinner label="Loading customers…" />
          </View>
        ) : (
          <EmptyState icon="people-outline" title="No customers found" />
        )
      }
      refreshing={query.isFetching}
      onRefresh={() => query.refetch()}
    />
  );
}
