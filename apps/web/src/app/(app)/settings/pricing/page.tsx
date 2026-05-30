"use client";
import * as React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, Skeleton, useToast } from "@workshop/ui";
import { api } from "~/trpc/react";

export default function PricingSettingsPage() {
  const toast = useToast();
  const utils = api.useUtils();
  const data = api.settings.pricing.useQuery();
  const [form, setForm] = React.useState({
    machineRatePerHour: 0,
    defaultLaborFee: 0,
    defaultMarginPercent: 0,
    currency: "INR",
    newOverridePassword: "",
  });

  React.useEffect(() => {
    if (data.data) {
      setForm((f) => ({
        ...f,
        machineRatePerHour: data.data!.machineRatePerHour,
        defaultLaborFee: data.data!.defaultLaborFee,
        defaultMarginPercent: data.data!.defaultMarginPercent,
        currency: data.data!.currency,
      }));
    }
  }, [data.data]);

  const save = api.settings.setPricing.useMutation({
    onSuccess: () => {
      toast.success("Pricing settings saved");
      utils.settings.pricing.invalidate();
      setForm((f) => ({ ...f, newOverridePassword: "" }));
    },
    onError: (e) => toast.error("Could not save", e.message),
  });

  if (data.isLoading) return <Skeleton className="h-72" />;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Pricing defaults</CardTitle>
        <p className="text-sm text-muted-foreground">
          Used by the order pricing engine. The override password unlocks manual price entry.
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              machineRatePerHour: form.machineRatePerHour,
              defaultLaborFee: form.defaultLaborFee,
              defaultMarginPercent: form.defaultMarginPercent,
              currency: form.currency,
              newOverridePassword: form.newOverridePassword || undefined,
            });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Machine rate (₹/hour)">
            <Input
              type="number"
              step="0.01"
              value={form.machineRatePerHour}
              onChange={(e) => setForm({ ...form, machineRatePerHour: Number(e.target.value) })}
            />
          </Field>
          <Field label="Default labor fee (₹)">
            <Input
              type="number"
              step="0.01"
              value={form.defaultLaborFee}
              onChange={(e) => setForm({ ...form, defaultLaborFee: Number(e.target.value) })}
            />
          </Field>
          <Field label="Default margin (%)">
            <Input
              type="number"
              step="0.01"
              value={form.defaultMarginPercent}
              onChange={(e) => setForm({ ...form, defaultMarginPercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Currency">
            <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="New override password" hint="Leave blank to keep current. Min 6 characters.">
              <Input
                type="password"
                value={form.newOverridePassword}
                onChange={(e) => setForm({ ...form, newOverridePassword: e.target.value })}
                placeholder="••••••"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={save.isPending}>
              Save settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
