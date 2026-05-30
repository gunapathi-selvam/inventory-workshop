"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Input,
  Field,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Skeleton,
  useToast,
} from "@workshop/ui";
import { ORDER_STATUS, PAYMENT_TYPE, type OrderStatus, type PaymentType } from "@workshop/core";
import { api } from "~/trpc/react";
import { useCan, useSession } from "~/lib/permissions-context";
import { money, dateTime, STATUS_VARIANT } from "~/lib/format";
import { mutationToast } from "~/lib/hooks";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const utils = api.useUtils();
  const canChange = useCan("orders.changeStatus");
  const isAdmin = useSession().role === "ADMIN";

  const { data, isLoading } = api.order.byId.useQuery({ id });
  const changeStatus = api.order.changeStatus.useMutation(
    mutationToast(toast, { success: "Status updated", error: "Could not update", onDone: () => utils.order.byId.invalidate({ id }) }),
  );

  const [fulfillment, setFulfillment] = React.useState({
    deliveryDate: "",
    paymentType: "" as PaymentType | "",
    courierName: "",
    trackingId: "",
    trackingUrl: "",
  });
  React.useEffect(() => {
    if (data) {
      setFulfillment({
        deliveryDate: data.deliveryDate ? String(data.deliveryDate).slice(0, 10) : "",
        paymentType: (data.paymentType as PaymentType) ?? "",
        courierName: data.courierName ?? "",
        trackingId: data.trackingId ?? "",
        trackingUrl: data.trackingUrl ?? "",
      });
    }
  }, [data]);

  const setFulfill = api.order.setFulfillment.useMutation(
    mutationToast(toast, { success: "Fulfillment saved", error: "Could not save", onDone: () => utils.order.byId.invalidate({ id }) }),
  );

  if (isLoading || !data) return <Skeleton className="h-96" />;

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" /> Orders
          </Button>
        </Link>
        {canChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select
              className="w-40"
              value={data.status}
              onChange={(e) => changeStatus.mutate({ id, status: e.target.value as OrderStatus })}
            >
              {ORDER_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold">{data.orderNumber}</h1>
        <Badge variant={STATUS_VARIANT[data.status]}>{data.status}</Badge>
        {data.overrideUsed && <Badge variant="warning">Manual price</Badge>}
        <Badge variant="outline">{data.pricingMode}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Item</TH>
                  <TH>Filament</TH>
                  <TH>Grams/unit</TH>
                  <TH>Qty</TH>
                  <TH className="text-right">Line price</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((it) => (
                  <TR key={it.id}>
                    <TD className="font-medium">{it.name}</TD>
                    <TD>{it.filament ? `${it.filament.type} ${it.filament.color}` : "—"}</TD>
                    <TD>{it.gramsPerUnit}g</TD>
                    <TD>{it.qty}</TD>
                    <TD className="text-right">{money(it.linePrice)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{data.customer.name}</p>
              {data.customer.phone && <p className="text-muted-foreground">{data.customer.phone}</p>}
              {data.customer.email && <p className="text-muted-foreground">{data.customer.email}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totals</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 text-sm">
              <Row label="Subtotal" value={money(data.subtotal)} />
              {data.discountAmount > 0 && (
                <Row label={`Discount${data.discountCode ? ` (${data.discountCode.code})` : ""}`} value={`- ${money(data.discountAmount)}`} />
              )}
              <div className="my-1 border-t border-border" />
              <Row label="Total" value={money(data.total)} bold />
              {isAdmin && (
                <>
                  <Row label="Material cost" value={money(data.costTotal)} muted />
                  <Row label="Profit" value={money(data.profit)} accent={data.profit >= 0 ? "success" : "danger"} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fulfillment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.trackingId && data.trackingUrl && (
                <a
                  href={data.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Track {data.trackingId} <ExternalLink className="size-3" />
                </a>
              )}
              <Field label="Delivery date">
                <Input
                  type="date"
                  disabled={!canChange}
                  value={fulfillment.deliveryDate}
                  onChange={(e) => setFulfillment({ ...fulfillment, deliveryDate: e.target.value })}
                />
              </Field>
              <Field label="Payment type">
                <Select
                  disabled={!canChange}
                  value={fulfillment.paymentType}
                  onChange={(e) => setFulfillment({ ...fulfillment, paymentType: e.target.value as PaymentType | "" })}
                >
                  <option value="">—</option>
                  {PAYMENT_TYPE.map((p) => (
                    <option key={p} value={p}>
                      {p.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Courier">
                <Input
                  disabled={!canChange}
                  value={fulfillment.courierName}
                  onChange={(e) => setFulfillment({ ...fulfillment, courierName: e.target.value })}
                  placeholder="DTDC, India Post…"
                />
              </Field>
              <Field label="Tracking ID">
                <Input
                  disabled={!canChange}
                  value={fulfillment.trackingId}
                  onChange={(e) => setFulfillment({ ...fulfillment, trackingId: e.target.value })}
                />
              </Field>
              <Field label="Tracking URL">
                <Input
                  disabled={!canChange}
                  value={fulfillment.trackingUrl}
                  onChange={(e) => setFulfillment({ ...fulfillment, trackingUrl: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
              {canChange && (
                <Button
                  loading={setFulfill.isPending}
                  onClick={() =>
                    setFulfill.mutate({
                      id,
                      deliveryDate: fulfillment.deliveryDate ? new Date(fulfillment.deliveryDate) : null,
                      paymentType: fulfillment.paymentType || null,
                      courierName: fulfillment.courierName || null,
                      trackingId: fulfillment.trackingId || null,
                      trackingUrl: fulfillment.trackingUrl || null,
                    })
                  }
                >
                  Save fulfillment
                </Button>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Created {dateTime(data.createdAt)}
            {data.createdBy ? ` by ${data.createdBy.name}` : ""}
          </p>
        </div>
      </div>
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
