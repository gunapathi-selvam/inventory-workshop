"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Badge,
  Skeleton,
  useToast,
} from "@workshop/ui";
import { PRICING_MODE, PAYMENT_TYPE, type PricingMode, type PaymentType } from "@workshop/core";
import type { OrderItemInput, OrderPricingInput } from "@workshop/validators";
import { api } from "~/trpc/react";
import { useCan } from "~/lib/permissions-context";
import { CustomFields } from "~/components/custom-fields";
import { CustomerCombobox } from "~/components/customer-combobox";
import { EditContactModal } from "~/components/edit-contact-modal";
import { startNavigation } from "~/components/route-progress";
import { money } from "~/lib/format";

type Item = {
  name: string;
  filamentId: string;
  gramsPerUnit: number;
  qty: number;
  printHours: number;
  directRatePerGram: number;
};
const emptyItem: Item = { name: "", filamentId: "", gramsPerUnit: 0, qty: 1, printHours: 0, directRatePerGram: 0 };

export default function NewOrderPage() {
  const router = useRouter();
  const toast = useToast();
  const canOverride = useCan("orders.priceOverride");

  const customers = api.customer.options.useQuery();
  const filaments = api.filament.options.useQuery();

  const [customerId, setCustomerId] = React.useState("");
  const [editContact, setEditContact] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState("");
  const [paymentType, setPaymentType] = React.useState<PaymentType | "">("");
  const [items, setItems] = React.useState<Item[]>([{ ...emptyItem }]);
  const [customFields, setCustomFields] = React.useState<Record<string, unknown>>({});
  const [pricing, setPricing] = React.useState<OrderPricingInput>({
    mode: "PRESET",
    laborFee: 0,
    marginPercent: 0,
    applyMachineTime: false,
    manualTotal: undefined,
    overridePassword: "",
    discountCode: "",
    manualDiscountType: undefined,
    manualDiscountValue: undefined,
  });

  const preview = api.pricing.preview.useMutation();
  const create = api.order.create.useMutation({
    onSuccess: (o) => {
      toast.success("Order created", o.orderNumber);
      startNavigation();
      router.push(`/orders/${o.id}`);
    },
    onError: (e) => toast.error("Could not create order", e.message),
  });

  // Live price preview whenever inputs change.
  const previewMutate = preview.mutate;
  React.useEffect(() => {
    const valid = items.every((i) => i.name && i.qty > 0);
    if (!valid) return;
    const handle = setTimeout(() => {
      previewMutate({
        items: items.map(toItemInput),
        pricing: toPricingInput(pricing),
      });
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items), JSON.stringify(pricing)]);

  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const result = preview.data;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }
    create.mutate({
      customerId,
      notes: notes || undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      paymentType: paymentType || undefined,
      items: items.map(toItemInput),
      pricing: toPricingInput(pricing),
      customFields,
    });
  };

  if (customers.isLoading || filaments.isLoading) return <Skeleton className="h-96" />;

  return (
    <>
      <Link href="/orders">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> Orders
        </Button>
      </Link>

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer" required>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <CustomerCombobox
                      options={customers.data ?? []}
                      value={customerId}
                      onChange={setCustomerId}
                    />
                  </div>
                  {customerId && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditContact(true)}>
                      Edit contact
                    </Button>
                  )}
                </div>
              </Field>
              <Field label="Notes">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              <Field label="Delivery date">
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </Field>
              <Field label="Payment type">
                <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType | "")}>
                  <option value="">—</option>
                  {PAYMENT_TYPE.map((p) => (
                    <option key={p} value={p}>
                      {p.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Print items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, { ...emptyItem }])}>
                <Plus className="size-4" /> Add item
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {items.map((item, idx) => (
                <div key={idx} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-12">
                  <div className="sm:col-span-12 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="text-danger" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  <div className="sm:col-span-5">
                    <Field label="Name" required>
                      <Input value={item.name} onChange={(e) => updateItem(idx, { name: e.target.value })} required />
                    </Field>
                  </div>
                  <div className="sm:col-span-4">
                    <Field label="Filament">
                      <Select value={item.filamentId} onChange={(e) => updateItem(idx, { filamentId: e.target.value })}>
                        <option value="">None</option>
                        {filaments.data?.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.type} {f.color} (₹{f.sellRatePerGram}/g · {f.weightRemainingG}g)
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="sm:col-span-3">
                    <Field label="Qty">
                      <Input type="number" min={1} value={item.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })} />
                    </Field>
                  </div>
                  <div className="sm:col-span-4">
                    <Field label="Grams / unit">
                      <Input type="number" step="0.1" value={item.gramsPerUnit} onChange={(e) => updateItem(idx, { gramsPerUnit: Number(e.target.value) })} />
                    </Field>
                  </div>
                  {pricing.applyMachineTime && (
                    <div className="sm:col-span-4">
                      <Field label="Print hours">
                        <Input type="number" step="0.1" value={item.printHours} onChange={(e) => updateItem(idx, { printHours: Number(e.target.value) })} />
                      </Field>
                    </div>
                  )}
                  {pricing.mode === "DIRECT_RATE" && (
                    <div className="sm:col-span-4">
                      <Field label="Rate ₹/gram" required>
                        <Input type="number" step="0.01" value={item.directRatePerGram} onChange={(e) => updateItem(idx, { directRatePerGram: Number(e.target.value) })} />
                      </Field>
                    </div>
                  )}
                </div>
              ))}

              <CustomFields entity="ORDER" value={customFields} onChange={setCustomFields} />
            </CardContent>
          </Card>
        </div>

        {/* Pricing panel */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Field label="Mode">
                <Select
                  value={pricing.mode}
                  onChange={(e) => setPricing({ ...pricing, mode: e.target.value as PricingMode })}
                >
                  {PRICING_MODE.map((m) => (
                    <option key={m} value={m} disabled={m === "MANUAL" && !canOverride}>
                      {m === "PRESET" ? "Preset (filament rate)" : m === "DIRECT_RATE" ? "Direct rate per gram" : "Manual (override)"}
                    </option>
                  ))}
                </Select>
              </Field>

              {pricing.mode !== "MANUAL" && (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pricing.applyMachineTime}
                      onChange={(e) => setPricing({ ...pricing, applyMachineTime: e.target.checked })}
                    />
                    Add machine time charge
                  </label>
                  <Field label="Labor fee (₹)">
                    <Input type="number" step="0.01" value={pricing.laborFee} onChange={(e) => setPricing({ ...pricing, laborFee: Number(e.target.value) })} />
                  </Field>
                  <Field label="Margin (%)">
                    <Input type="number" step="0.01" value={pricing.marginPercent} onChange={(e) => setPricing({ ...pricing, marginPercent: Number(e.target.value) })} />
                  </Field>
                </>
              )}

              {pricing.mode === "MANUAL" && (
                <>
                  <Field label="Final total (₹)" required>
                    <Input
                      type="number"
                      step="0.01"
                      value={pricing.manualTotal ?? ""}
                      onChange={(e) => setPricing({ ...pricing, manualTotal: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Override password" required hint="Required to apply a manual price">
                    <Input
                      type="password"
                      value={pricing.overridePassword ?? ""}
                      onChange={(e) => setPricing({ ...pricing, overridePassword: e.target.value })}
                    />
                  </Field>
                </>
              )}

              <hr className="border-border" />
              <Field label="Discount code">
                <Input
                  value={pricing.discountCode ?? ""}
                  onChange={(e) => setPricing({ ...pricing, discountCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. WELCOME10"
                />
              </Field>
              {!pricing.discountCode && (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Manual discount">
                    <Select
                      value={pricing.manualDiscountType ?? ""}
                      onChange={(e) =>
                        setPricing({ ...pricing, manualDiscountType: (e.target.value || undefined) as "PERCENT" | "FLAT" | undefined })
                      }
                    >
                      <option value="">None</option>
                      <option value="PERCENT">Percent</option>
                      <option value="FLAT">Flat ₹</option>
                    </Select>
                  </Field>
                  <Field label="Value">
                    <Input
                      type="number"
                      step="0.01"
                      value={pricing.manualDiscountValue ?? ""}
                      onChange={(e) => setPricing({ ...pricing, manualDiscountValue: e.target.value === "" ? undefined : Number(e.target.value) })}
                      disabled={!pricing.manualDiscountType}
                    />
                  </Field>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 text-sm">
              {preview.isPending && <Skeleton className="h-24" />}
              {result && !preview.isPending && (
                <>
                  <Row label="Subtotal" value={money(result.subtotal)} />
                  {result.discountAmount > 0 && <Row label="Discount" value={`- ${money(result.discountAmount)}`} />}
                  <div className="my-1 border-t border-border" />
                  <Row label="Total" value={money(result.total)} bold />
                  <Row label="Material cost" value={money(result.costTotal)} muted />
                  <Row label="Profit" value={money(result.profit)} accent={result.profit >= 0 ? "success" : "danger"} />
                  {result.overrideUsed && (
                    <Badge variant="warning" className="mt-1 w-fit">
                      Manual override
                    </Badge>
                  )}
                </>
              )}
              {preview.error && <p className="text-xs text-danger">{preview.error.message}</p>}
              <Button type="submit" className="mt-3 w-full" loading={create.isPending}>
                Create order
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      <EditContactModal
        customerId={editContact ? customerId : null}
        onClose={() => setEditContact(false)}
      />
    </>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  accent?: "success" | "danger";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span
        className={[
          bold ? "text-base font-semibold" : "font-medium",
          accent === "success" ? "text-success" : accent === "danger" ? "text-danger" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function toItemInput(i: Item): OrderItemInput {
  return {
    name: i.name,
    filamentId: i.filamentId || undefined,
    gramsPerUnit: i.gramsPerUnit,
    qty: i.qty,
    printHours: i.printHours,
    directRatePerGram: i.directRatePerGram || undefined,
  };
}

function toPricingInput(p: OrderPricingInput): OrderPricingInput {
  return {
    ...p,
    discountCode: p.discountCode || undefined,
    overridePassword: p.overridePassword || undefined,
    manualDiscountValue: p.manualDiscountType ? p.manualDiscountValue : undefined,
  };
}
