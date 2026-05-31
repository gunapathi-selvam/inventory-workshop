import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  PageHeader,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
} from "@workshop/ui";
import { ORDER_STATUS, type OrderStatus } from "@workshop/core";
import { getServerApi, getServerUser } from "~/trpc/server";
import { money, dateShort, STATUS_VARIANT } from "~/lib/format";
import { OrdersActions, OrdersFilters, CustomerLink } from "./orders-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const statusRaw = str("status");
  const status = ORDER_STATUS.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : undefined;
  const search = str("q");
  const from = str("from");
  const to = str("to");

  const api = await getServerApi();
  const [data, user] = await Promise.all([
    api.order.list({
      page: 1,
      pageSize: 100,
      status,
      search,
      dateFrom: from ? new Date(from) : undefined,
      dateTo: to ? new Date(to) : undefined,
    }),
    getServerUser(),
  ]);
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      <PageHeader
        title="Orders"
        description="All print orders with auto-calculated pricing"
        actions={<OrdersActions />}
      />

      <OrdersFilters />

      {data.items.length === 0 ? (
        <EmptyState title="No orders" description="No orders match the current filters." />
      ) : (
        <Card>
          <CardContent className="pt-card">
            <Table>
              <THead>
                <TR>
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  <TH>Total</TH>
                  {isAdmin && <TH>Profit</TH>}
                  <TH>Payment</TH>
                  <TH>Status</TH>
                  <TH>Delivery</TH>
                  <TH>Tracking</TH>
                  <TH>Date</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((o) => (
                  <TR key={o.id}>
                    <TD className="font-mono font-medium">
                      <Link href={`/orders/${o.id}`} className="hover:underline">
                        {o.orderNumber}
                      </Link>
                    </TD>
                    <TD>
                      <CustomerLink id={o.customer.id} name={o.customer.name} />
                    </TD>
                    <TD className="font-medium">{money(o.total)}</TD>
                    {isAdmin && <TD className={o.profit >= 0 ? "text-success" : "text-danger"}>{money(o.profit)}</TD>}
                    <TD>{o.paymentType ? o.paymentType.replace("_", " ") : "—"}</TD>
                    <TD>
                      <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                    </TD>
                    <TD>{o.deliveryDate ? dateShort(o.deliveryDate) : "—"}</TD>
                    <TD>
                      {o.trackingId ? (
                        o.trackingUrl ? (
                          <a
                            href={o.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {o.trackingId} <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          o.trackingId
                        )
                      ) : (
                        "—"
                      )}
                    </TD>
                    <TD>{dateShort(o.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
