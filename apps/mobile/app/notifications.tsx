/** Notifications — the current user's notifications; tap marks one read,
 *  header action marks all read. */
import * as React from "react";
import { FlatList, Pressable, View } from "react-native";
import { useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/theme";
import { Card, EmptyState, Icon, Row, Spinner, Stack, Text } from "~/components";
import { api } from "~/api/trpc";
import { dateTime, titleCase } from "~/lib/format";

export default function NotificationsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const query = api.notification.list.useQuery();
  const utils = api.useUtils();
  const invalidate = () =>
    Promise.all([utils.notification.list.invalidate(), utils.notification.unreadCount.invalidate()]);

  const markRead = api.notification.markRead.useMutation({ onSuccess: invalidate });
  const markAll = api.notification.markAllRead.useMutation({ onSuccess: invalidate });

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => markAll.mutate()}
          hitSlop={theme.sizing.layout.hitSlop}
          style={{ paddingHorizontal: theme.spacing.md }}
        >
          <Text variant="label" color="primary">
            Mark all
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, theme, markAll]);

  if (query.isLoading) return <Spinner label="Loading notifications…" />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        padding: theme.layoutSpacing.page,
        paddingBottom: insets.bottom + theme.layoutSpacing.section,
        gap: theme.spacing.sm,
      }}
      data={query.data ?? []}
      keyExtractor={(n) => n.id}
      renderItem={({ item }) => (
        <Card onPress={item.read ? undefined : () => markRead.mutate({ id: item.id })} elevation={item.read ? "none" : "sm"}>
          <Row justify="space-between" align="flex-start" gap="md">
            <Stack gap="xxs" style={{ flex: 1 }}>
              <Row gap="sm">
                {!item.read ? (
                  <View style={{ width: theme.spacing.sm, height: theme.spacing.sm, borderRadius: theme.radii.pill, backgroundColor: theme.colors.primary }} />
                ) : null}
                <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                  {item.title}
                </Text>
              </Row>
              {item.body ? (
                <Text variant="caption" color="mutedForeground">
                  {item.body}
                </Text>
              ) : null}
              <Text variant="caption" color="mutedForeground">
                {titleCase(item.type)} · {dateTime(item.createdAt)}
              </Text>
            </Stack>
            <Icon name="notifications-outline" size="sm" color={item.read ? "mutedForeground" : "primary"} />
          </Row>
        </Card>
      )}
      ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="No notifications" message="You're all caught up." />}
      refreshing={query.isFetching}
      onRefresh={() => query.refetch()}
    />
  );
}
