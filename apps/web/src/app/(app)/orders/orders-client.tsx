"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { Button, Select, Input, useToast } from "@workshop/ui";
import { ORDER_STATUS, type OrderStatus } from "@workshop/core";
import { api } from "~/trpc/react";
import { useCan } from "~/lib/permissions-context";
import { DateRangeFilter, type DateRangeValue } from "~/components/date-range";
import { CustomerViewModal } from "~/components/customer-view-modal";
import { useDebouncedValue } from "~/lib/hooks";

/** Status / search / date filters that drive the server page via URL params. */
export function OrdersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const status = params.get("status") ?? "";
  const [search, setSearch] = React.useState(params.get("q") ?? "");
  const debounced = useDebouncedValue(search, 300);
  const range: DateRangeValue = { from: params.get("from") ?? undefined, to: params.get("to") ?? undefined };

  const apply = (mutate: (sp: URLSearchParams) => void) => {
    const sp = new URLSearchParams(params.toString());
    mutate(sp);
    router.replace(`${pathname}?${sp.toString()}`);
  };

  React.useEffect(() => {
    if (debounced === (params.get("q") ?? "")) return;
    apply((sp) => (debounced ? sp.set("q", debounced) : sp.delete("q")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        className="w-40"
        value={status}
        onChange={(e) => apply((sp) => (e.target.value ? sp.set("status", e.target.value) : sp.delete("status")))}
      >
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
      <DateRangeFilter
        value={range}
        onChange={(v) =>
          apply((sp) => {
            v.from ? sp.set("from", v.from) : sp.delete("from");
            v.to ? sp.set("to", v.to) : sp.delete("to");
          })
        }
      />
    </div>
  );
}

/** Export (lazy xlsx, respects current URL filters) + New order (permission-gated). */
export function OrdersActions() {
  const params = useSearchParams();
  const toast = useToast();
  const utils = api.useUtils();
  const canCreate = useCan("orders.create");
  const [exporting, setExporting] = React.useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const statusParam = params.get("status");
      const from = params.get("from");
      const to = params.get("to");
      const rows = await utils.order.export.fetch({
        status: (statusParam as OrderStatus) || undefined,
        dateFrom: from ? new Date(from) : undefined,
        dateTo: to ? new Date(to) : undefined,
      });
      if (rows.length === 0) {
        toast.error("Nothing to export", "No orders match the current filter.");
        return;
      }
      const { exportToXlsx } = await import("~/lib/export-xlsx");
      exportToXlsx(`orders-${new Date().toISOString().slice(0, 10)}.xlsx`, rows, "Orders");
      toast.success("Exported", `${rows.length} orders`);
    } catch (e) {
      toast.error("Export failed", (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
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
  );
}

/** Customer name that opens the read-only customer modal (one instance per row,
 *  only the clicked one renders an open modal). */
export function CustomerLink({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button className="text-left hover:text-primary hover:underline" onClick={() => setOpen(true)}>
        {name}
      </button>
      <CustomerViewModal id={open ? id : null} onClose={() => setOpen(false)} />
    </>
  );
}
