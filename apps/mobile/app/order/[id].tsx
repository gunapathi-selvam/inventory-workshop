/** Order detail — customer, line items, pricing breakdown, and (permission-
 *  gated) status changes. */
import * as React from "react";
import { Alert, View } from "react-native";
import { Stack as RouterStack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { ORDER_STATUS } from "@workshop/core";
import { useTheme } from "~/theme";
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  FieldRow,
  Row,
  Screen,
  Spinner,
  Stack,
  Text,
} from "~/components";
import { api } from "~/api/trpc";
import { useAuth } from "~/api/auth";
import { useCan } from "~/lib/permissions";
import { dateShort, money, STATUS_TONE, titleCase } from "~/lib/format";
import { toErrorMessage } from "~/lib/errors";

export default function OrderDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const canChangeStatus = useCan("orders.changeStatus");

  const query = api.order.byId.useQuery({ id: id! }, { enabled: !!id });
  const utils = api.useUtils();
  const changeStatus = api.order.changeStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.order.byId.invalidate({ id: id! }), utils.order.list.invalidate(), utils.dashboard.stats.invalidate()]);
    },
    onError: (e) => Alert.alert("Couldn't update status", toErrorMessage(e)),
  });

  React.useLayoutEffect(() => {
    if (query.data) navigation.setOptions({ title: query.data.orderNumber });
  }, [navigation, query.data]);

  if (query.isLoading) return <Spinner label="Loading order…" />;
  if (query.isError || !query.data)
    return <EmptyState icon="warning-outline" title="Order not found" actionLabel="Go back" onAction={() => router.back()} />;

  const order = query.data;
  const isAdmin = user?.role === "ADMIN";

  const promptStatus = () => {
    const options = ORDER_STATUS.filter((s) => s !== order.status);
    Alert.alert("Change status", `Current: ${titleCase(order.status)}`, [
      ...options.map((s) => ({ text: titleCase(s), onPress: () => changeStatus.mutate({ id: order.id, status: s }) })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  return (
    <Screen scroll refreshing={query.isFetching} onRefresh={() => query.refetch()}>
      <RouterStack.Screen options={{ title: order.orderNumber }} />
      <Stack gap="section">
        {/* Status header */}
        <Row justify="space-between">
          <Stack gap="xxs">
            <Text variant="caption" color="mutedForeground">
              Created {dateShort(order.createdAt)}
            </Text>
            <Text variant="caption" color="mutedForeground">
              by {order.createdBy?.name ?? "—"}
            </Text>
          </Stack>
          <Badge label={titleCase(order.status)} tone={STATUS_TONE[order.status] ?? "default"} solid />
        </Row>

        {canChangeStatus ? (
          <Button label="Change status" icon="swap-horizontal" variant="outline" onPress={promptStatus} loading={changeStatus.isPending} fullWidth />
        ) : null}

        {/* Customer */}
        <Stack gap="md">
          <Text variant="heading">Customer</Text>
          <Card onPress={() => router.push(`/customer/${order.customer.id}`)}>
            <Row justify="space-between">
              <Stack gap="xxs">
                <Text variant="bodyStrong">{order.customer.name}</Text>
                {order.customer.phone ? (
                  <Text variant="caption" color="mutedForeground">
                    {order.customer.phone}
                  </Text>
                ) : null}
              </Stack>
              <Text variant="label" color="primary">
                View
              </Text>
            </Row>
          </Card>
        </Stack>

        {/* Items */}
        <Stack gap="md">
          <Text variant="heading">Items</Text>
          <Card>
            {order.items.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 ? <Divider style={{ marginVertical: theme.spacing.sm }} /> : null}
                <Row justify="space-between" align="flex-start">
                  <Stack gap="xxs" style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{item.name}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {item.filament ? `${item.filament.type} · ${item.filament.color} · ` : ""}
                      {item.gramsPerUnit} g × {item.qty}
                      {item.printHours ? ` · ${item.printHours} h` : ""}
                    </Text>
                  </Stack>
                  <Text variant="bodyStrong">{money(item.linePrice)}</Text>
                </Row>
              </View>
            ))}
          </Card>
        </Stack>

        {/* Pricing */}
        <Stack gap="md">
          <Text variant="heading">Pricing</Text>
          <Card>
            <FieldRow label="Mode" value={titleCase(order.pricingMode)} />
            <Divider />
            <FieldRow label="Subtotal" value={money(order.subtotal)} />
            {order.discountAmount > 0 ? (
              <FieldRow
                label={`Discount${order.discountCode ? ` (${order.discountCode.code})` : ""}`}
                value={`– ${money(order.discountAmount)}`}
              />
            ) : null}
            <Divider />
            <FieldRow label="Total" value={money(order.total)} />
            {isAdmin ? (
              <>
                <FieldRow label="Material cost" value={money(order.costTotal)} />
                <FieldRow
                  label="Profit"
                  value={<Text variant="bodyStrong" color={order.profit >= 0 ? "success" : "danger"}>{money(order.profit)}</Text>}
                />
              </>
            ) : null}
          </Card>
        </Stack>

        {/* Fulfillment */}
        {(order.deliveryDate || order.paymentType || order.courierName || order.trackingId) ? (
          <Stack gap="md">
            <Text variant="heading">Fulfillment</Text>
            <Card>
              {order.deliveryDate ? <FieldRow label="Delivery" value={dateShort(order.deliveryDate)} /> : null}
              {order.paymentType ? <FieldRow label="Payment" value={titleCase(order.paymentType)} /> : null}
              {order.courierName ? <FieldRow label="Courier" value={order.courierName} /> : null}
              {order.trackingId ? <FieldRow label="Tracking" value={order.trackingId} /> : null}
            </Card>
          </Stack>
        ) : null}

        {order.notes ? (
          <Stack gap="md">
            <Text variant="heading">Notes</Text>
            <Card>
              <Text variant="body" color="mutedForeground">
                {order.notes}
              </Text>
            </Card>
          </Stack>
        ) : null}
      </Stack>
    </Screen>
  );
}
