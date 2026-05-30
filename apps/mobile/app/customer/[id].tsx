/** Customer detail — contact card plus the customer's recent orders. */
import * as React from "react";
import { Linking } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useTheme } from "~/theme";
import {
  Avatar,
  Badge,
  Card,
  Divider,
  EmptyState,
  FieldRow,
  ListRow,
  Row,
  Screen,
  Spinner,
  Stack,
  Text,
} from "~/components";
import { api } from "~/api/trpc";
import { dateShort, money, STATUS_TONE, titleCase } from "~/lib/format";

export default function CustomerDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = api.customer.byId.useQuery({ id: id! }, { enabled: !!id });

  React.useLayoutEffect(() => {
    if (query.data) navigation.setOptions({ title: query.data.name });
  }, [navigation, query.data]);

  if (query.isLoading) return <Spinner label="Loading customer…" />;
  if (query.isError || !query.data)
    return <EmptyState icon="warning-outline" title="Customer not found" actionLabel="Go back" onAction={() => router.back()} />;

  const customer = query.data;

  return (
    <Screen scroll refreshing={query.isFetching} onRefresh={() => query.refetch()}>
      <Stack gap="section">
        <Row gap="md">
          <Avatar name={customer.name} size="lg" />
          <Stack gap="xxs" style={{ flex: 1 }}>
            <Text variant="title">{customer.name}</Text>
            {customer.tier ? <Badge label={customer.tier} tone="accent" /> : null}
          </Stack>
        </Row>

        <Stack gap="md">
          <Text variant="heading">Contact</Text>
          <Card>
            <FieldRow
              label="Phone"
              value={
                customer.phone ? (
                  <Text variant="bodyStrong" color="primary" onPress={() => Linking.openURL(`tel:${customer.phone}`)}>
                    {customer.phone}
                  </Text>
                ) : undefined
              }
            />
            <Divider />
            <FieldRow
              label="Email"
              value={
                customer.email ? (
                  <Text variant="bodyStrong" color="primary" onPress={() => Linking.openURL(`mailto:${customer.email}`)}>
                    {customer.email}
                  </Text>
                ) : undefined
              }
            />
            {customer.address ? (
              <>
                <Divider />
                <FieldRow label="Address" value={customer.address} />
              </>
            ) : null}
          </Card>
        </Stack>

        {customer.notes ? (
          <Stack gap="md">
            <Text variant="heading">Notes</Text>
            <Card>
              <Text variant="body" color="mutedForeground">
                {customer.notes}
              </Text>
            </Card>
          </Stack>
        ) : null}

        <Stack gap="md">
          <Text variant="heading">Recent orders</Text>
          {customer.orders.length === 0 ? (
            <EmptyState icon="cart-outline" title="No orders yet" />
          ) : (
            <Stack gap="sm">
              {customer.orders.map((o) => (
                <ListRow
                  key={o.id}
                  title={o.orderNumber}
                  subtitle={dateShort(o.createdAt)}
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
