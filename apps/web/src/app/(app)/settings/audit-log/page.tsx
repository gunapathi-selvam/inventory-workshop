"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  Input,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Badge,
  EmptyState,
  Skeleton,
  Button,
} from "@workshop/ui";
import { titleCase } from "@workshop/core";
import { api } from "~/trpc/react";
import { dateTime } from "~/lib/format";
import { DateRangeFilter, rangeToApi, type DateRangeValue } from "~/components/date-range";
import { useDebouncedValue } from "~/lib/hooks";

export default function AuditLogPage() {
  const [search, setSearch] = React.useState("");
  const [range, setRange] = React.useState<DateRangeValue>({});
  const [page, setPage] = React.useState(1);
  const debounced = useDebouncedValue(search, 300);

  // Reset to the first page whenever the filters change.
  React.useEffect(() => setPage(1), [debounced, range]);

  const list = api.audit.list.useQuery({
    page,
    pageSize: 50,
    search: debounced || undefined,
    ...rangeToApi(range),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search action, entity or id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {list.isLoading ? (
        <Skeleton className="h-64" />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState title="No audit entries" description="Nothing matches the current filters yet." />
      ) : (
        <Card>
          <CardContent className="pt-card">
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>Actor</TH>
                  <TH>Action</TH>
                  <TH>Entity</TH>
                  <TH>Record</TH>
                </TR>
              </THead>
              <TBody>
                {list.data.items.map((a) => (
                  <TR key={a.id}>
                    <TD className="whitespace-nowrap text-muted-foreground">{dateTime(a.createdAt)}</TD>
                    <TD>{a.user?.name ?? "System"}</TD>
                    <TD>
                      <Badge variant="default">{a.action}</Badge>
                    </TD>
                    <TD>{titleCase(a.entity)}</TD>
                    <TD className="font-mono text-xs text-muted-foreground">{a.entityId ?? "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{list.data.total} entries</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Prev
                </Button>
                <span>
                  Page {page} / {list.data.pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= list.data.pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
