"use client";
import * as React from "react";
import Link from "next/link";
import {
  Modal,
  Input,
  Badge,
  Skeleton,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@workshop/ui";
import { api } from "~/trpc/react";
import { money, dateShort, STATUS_VARIANT } from "~/lib/format";
import { DateRangeFilter, rangeToApi, type DateRangeValue } from "./date-range";
import { useDebouncedValue } from "~/lib/hooks";

/** A customer's orders with date-range + order-number search (per customer). */
export function CustomerOrdersModal({
  customer,
  onClose,
}: {
  customer: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const [range, setRange] = React.useState<DateRangeValue>({});
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search, 300);

  const q = api.customer.orders.useQuery(
    { customerId: customer?.id ?? "", ...rangeToApi(range), search: debounced || undefined },
    { enabled: !!customer },
  );

  React.useEffect(() => {
    if (!customer) {
      setRange({});
      setSearch("");
    }
  }, [customer]);

  return (
    <Modal open={!!customer} onClose={onClose} title={`Orders — ${customer?.name ?? ""}`} className="max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <DateRangeFilter value={range} onChange={setRange} compact />
        <Input
          className="h-8 w-44"
          placeholder="Search order #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {!q.data ? (
        <Skeleton className="h-48" />
      ) : q.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No orders for this filter.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Items</TH>
              <TH>Total</TH>
              <TH>Status</TH>
              <TH>Date</TH>
            </TR>
          </THead>
          <TBody>
            {q.data.map((o) => (
              <TR key={o.id}>
                <TD className="font-mono font-medium">
                  <Link href={`/orders/${o.id}`} className="hover:underline" onClick={onClose}>
                    {o.orderNumber}
                  </Link>
                </TD>
                <TD>{o.items.length}</TD>
                <TD className="font-medium">{money(o.total)}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                </TD>
                <TD>{dateShort(o.createdAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Modal>
  );
}
