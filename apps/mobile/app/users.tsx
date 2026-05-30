/** Team members — read-only list of users with role and status. */
import * as React from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/theme";
import { Avatar, Badge, EmptyState, ListRow, SearchBar, Spinner } from "~/components";
import { api } from "~/api/trpc";
import { titleCase } from "~/lib/format";

export default function UsersScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState("");
  const query = api.user.list.useQuery({ page: 1, pageSize: 50, search: search.trim() || undefined });
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
      keyExtractor={(u) => u.id}
      ListHeaderComponent={
        <View style={{ marginBottom: theme.spacing.sm }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search name or email" />
        </View>
      }
      renderItem={({ item }) => (
        <ListRow
          title={item.name}
          subtitle={item.email}
          trailing={<Badge label={titleCase(item.role)} tone="primary" />}
          caption={item.status === "ACTIVE" ? undefined : titleCase(item.status)}
          chevron={false}
        />
      )}
      ListEmptyComponent={
        query.isLoading ? (
          <View style={{ paddingTop: theme.spacing.huge }}>
            <Spinner label="Loading team…" />
          </View>
        ) : (
          <EmptyState icon="people-outline" title="No team members" />
        )
      }
      refreshing={query.isFetching}
      onRefresh={() => query.refetch()}
    />
  );
}
