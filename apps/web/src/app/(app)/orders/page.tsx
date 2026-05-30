"use client";
import * as React from "react";
import Link from "next/link";
import { Plus, Download, ExternalLink } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Select,
  Input,
  PageHeader,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
  Skeleton,
  useToast,
} from "@workshop/ui";
import { ORDER_STATUS, type OrderStatus } from "@workshop/core";
import { api } from "~/trpc/react";
import { useCan, useSession } from "~/lib/permissions-context";
import { money, dateShort, STATUS_VARIANT } from "~/lib/format";
import { DateRangeFilter, rangeToApi, type DateRangeValue } from "~/components/date-range";
import { CustomerViewModal } from "~/components/customer-view-modal";
import { useDebouncedValue } from "~/lib/hooks";
import { exportToXlsx } from "~/lib/export-xlsx";

export default function OrdersPage() {
  const toast = useToast();
  const utils = api.useUtils();
  const canCreate = useCan("orders.create");
  const isAdmin = useSession().role === "ADMIN";

  const [status, setStatus] = React.useState<OrderStatus | "">("");
  const [range, setRange] = React.useState<DateRangeValue>({});
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search, 300);
  const [viewCustomer, setViewCustomer] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const list = api.order.list.useQuery({
    page: 1,
    pageSize: 100,
    status: status || undefined,
    search: debounced || undefined,
    ...rangeToApi(range),
  });

  async function handleExport() {
    setExporting(true);
    try {
      const rows = await utils.order.export.fetch({ status: status || undefined, ...rangeToApi(range) });
      if (rows.length === 0) {
        toast.error("Nothing to export", "No orders match the current filter.");
        return;
      }
      exportToXlsx(`orders-${new Date().toISOString().slice(0, 10)}.xlsx`, rows, "Orders");
      toast.success("Exported", `${rows.length} orders`);
    } catch (e) {
      toast.error("Export failed", (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="All print orders with auto-calculated pricing"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} loading={exporting}>
              <Download className="size-4" /> Export
            </Button>
            {canCreate && (
              <Link href="/orders/new">
                <Button>
                  <Plus className="size-4" /> New order
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select className="w-40" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "")}>
          <option value="">All statuses</option>
          {ORDER_STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input
          className="w-56"
          placeholder="Search order #, customer or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {list.isLoading ? (
        <Skeleton className="h-64" />
      ) : !list.data || list.data.items.length === 0 ? (
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
                {list.data.items.map((o) => (
                  <TR key={o.id}>
                    <TD className="font-mono font-medium">
                      <Link href={`/orders/${o.id}`} className="hover:underline">
                        {o.orderNumber}
                      </Link>
                    </TD>
                    <TD>
                      <button
                        className="text-left hover:text-primary hover:underline"
                        onClick={() => setViewCustomer(o.customer.id)}
                      >
                        {o.customer.name}
                      </button>
                    </TD>
                    <TD className="font-medium">{money(o.total)}</TD>
                    {isAdmin && (
                      <TD className={o.profit >= 0 ? "text-success" : "text-danger"}>{money(o.profit)}</TD>
                    )}
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

      <CustomerViewModal id={viewCustomer} onClose={() => setViewCustomer(null)} />
    </>
  );
}
