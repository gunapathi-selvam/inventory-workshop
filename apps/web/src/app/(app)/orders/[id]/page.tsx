import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@workshop/ui";
import type { PaymentType } from "@workshop/core";
import { getServerApi, getServerUser } from "~/trpc/server";
import { money, dateTime, STATUS_VARIANT } from "~/lib/format";
import { OrderStatusSelect, FulfillmentForm } from "./order-actions";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = await getServerApi();
  const [data, user] = await Promise.all([
    api.order.byId({ id }).catch(() => notFound()),
    getServerUser(),
  ]);
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" /> Orders
          </Button>
        </Link>
        <OrderStatusSelect id={id} status={data.status} />
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
                <Row
                  label={`Discount${data.discountCode ? ` (${data.discountCode.code})` : ""}`}
                  value={`- ${money(data.discountAmount)}`}
                />
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
              <FulfillmentForm
                id={id}
                init={{
                  trackingId: data.trackingId,
                  trackingUrl: data.trackingUrl,
                  deliveryDate: data.deliveryDate ? new Date(data.deliveryDate).toISOString().slice(0, 10) : "",
                  paymentType: (data.paymentType as PaymentType) ?? "",
                  courierName: data.courierName ?? "",
                }}
              />
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
