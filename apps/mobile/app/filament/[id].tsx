/** Filament detail — rates, stock, threshold, movement history, and a
 *  permission-gated restock/adjust form. */
import * as React from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useTheme } from "~/theme";
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  FieldRow,
  Row,
  Screen,
  Spinner,
  Stack,
  Text,
  TextField,
} from "~/components";
import { api } from "~/api/trpc";
import { useCan } from "~/lib/permissions";
import { dateTime, ratePerGram, titleCase } from "~/lib/format";
import { toErrorMessage } from "~/lib/errors";

type Reason = "RESTOCK" | "ADJUSTMENT";

export default function FilamentDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const canAdjust = useCan("inventory.adjustStock");

  const query = api.filament.byId.useQuery({ id: id! }, { enabled: !!id });
  const utils = api.useUtils();

  const [showForm, setShowForm] = React.useState(false);
  const [delta, setDelta] = React.useState("");
  const [reason, setReason] = React.useState<Reason>("RESTOCK");
  const [note, setNote] = React.useState("");

  const adjust = api.filament.adjustStock.useMutation({
    onSuccess: async () => {
      setShowForm(false);
      setDelta("");
      setNote("");
      await Promise.all([utils.filament.byId.invalidate({ id: id! }), utils.filament.list.invalidate(), utils.dashboard.stats.invalidate()]);
    },
    onError: (e) => Alert.alert("Couldn't adjust stock", toErrorMessage(e)),
  });

  React.useLayoutEffect(() => {
    if (query.data) navigation.setOptions({ title: `${query.data.type} · ${query.data.color}` });
  }, [navigation, query.data]);

  if (query.isLoading) return <Spinner label="Loading filament…" />;
  if (query.isError || !query.data)
    return <EmptyState icon="warning-outline" title="Filament not found" actionLabel="Go back" onAction={() => router.back()} />;

  const f = query.data;

  const submit = () => {
    const value = Number(delta);
    if (!value || Number.isNaN(value)) {
      Alert.alert("Enter a quantity", "Provide a non-zero gram amount (negative to remove).");
      return;
    }
    adjust.mutate({ filamentId: f.id, deltaG: value, reason, note: note.trim() || undefined });
  };

  return (
    <Screen scroll refreshing={query.isFetching} onRefresh={() => query.refetch()}>
      <Stack gap="section">
        <Row justify="space-between">
          <Text variant="title">{f.type} · {f.color}</Text>
          {f.lowStock ? <Badge label="Low stock" tone="warning" solid /> : <Badge label="In stock" tone="success" solid />}
        </Row>

        <Card>
          <FieldRow label="In stock" value={`${f.weightRemainingG} g`} />
          <Divider />
          <FieldRow label="Spools" value={String(f.spoolCount)} />
          <Divider />
          <FieldRow label="Low-stock threshold" value={`${f.lowStockThresholdG} g`} />
          <Divider />
          <FieldRow label="Sell rate" value={ratePerGram(f.sellRatePerGram)} />
          <Divider />
          <FieldRow label="Cost rate" value={ratePerGram(f.costPerGram)} />
        </Card>

        {canAdjust ? (
          showForm ? (
            <Card>
              <Stack gap="md">
                <Text variant="heading">Adjust stock</Text>
                <Row gap="sm">
                  <Chip label="Restock (+)" selected={reason === "RESTOCK"} onPress={() => setReason("RESTOCK")} />
                  <Chip label="Adjustment" selected={reason === "ADJUSTMENT"} onPress={() => setReason("ADJUSTMENT")} />
                </Row>
                <TextField
                  label="Grams (negative to remove)"
                  value={delta}
                  onChangeText={setDelta}
                  keyboardType="numbers-and-punctuation"
                  placeholder="e.g. 500 or -120"
                />
                <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="Reason / reference" />
                <Row gap="sm">
                  <Button label="Cancel" variant="ghost" onPress={() => setShowForm(false)} />
                  <Button label="Save" onPress={submit} loading={adjust.isPending} style={{ flex: 1 }} fullWidth />
                </Row>
              </Stack>
            </Card>
          ) : (
            <Button label="Adjust stock" icon="add-circle-outline" variant="outline" onPress={() => setShowForm(true)} fullWidth />
          )
        ) : null}

        <Stack gap="md">
          <Text variant="heading">Movement history</Text>
          {f.stockMoves.length === 0 ? (
            <EmptyState icon="time-outline" title="No movements yet" />
          ) : (
            <Card>
              {f.stockMoves.map((m, idx) => (
                <View key={m.id}>
                  {idx > 0 ? <Divider style={{ marginVertical: theme.spacing.sm }} /> : null}
                  <Row justify="space-between">
                    <Stack gap="xxs" style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{titleCase(m.reason)}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {dateTime(m.createdAt)}
                        {m.note ? ` · ${m.note}` : ""}
                      </Text>
                    </Stack>
                    <Text variant="bodyStrong" color={m.deltaG >= 0 ? "success" : "danger"}>
                      {m.deltaG >= 0 ? "+" : ""}
                      {m.deltaG} g
                    </Text>
                  </Row>
                </View>
              ))}
            </Card>
          )}
        </Stack>
      </Stack>
    </Screen>
  );
}
