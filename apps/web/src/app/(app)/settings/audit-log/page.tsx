import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, Table, THead, TBody, TR, TH, TD, Badge, EmptyState } from "@workshop/ui";
import { titleCase } from "@workshop/core";
import { getServerApi } from "~/trpc/server";
import { dateTime } from "~/lib/format";
import { AuditFilters } from "./audit-filters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const search = str("q");
  const from = str("from");
  const to = str("to");
  const page = Math.max(1, Number(str("page")) || 1);

  const api = await getServerApi();
  const data = await api.audit.list({
    page,
    pageSize: 50,
    search,
    dateFrom: from ? new Date(from) : undefined,
    dateTo: to ? new Date(to) : undefined,
  });

  const hrefFor = (p: number) => {
    const q = new URLSearchParams();
    if (search) q.set("q", search);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (p > 1) q.set("page", String(p));
    return `?${q.toString()}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <AuditFilters />

      {data.items.length === 0 ? (
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
                {data.items.map((a) => (
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
              <span>{data.total} entries</span>
              <div className="flex items-center gap-2">
                <PagerLink href={hrefFor(page - 1)} disabled={page <= 1}>
                  Prev
                </PagerLink>
                <span>
                  Page {page} / {data.pageCount}
                </span>
                <PagerLink href={hrefFor(page + 1)} disabled={page >= data.pageCount}>
                  Next
                </PagerLink>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PagerLink({ href, disabled, children }: { href: string; disabled: boolean; children: ReactNode }) {
  const cls = "rounded-md border border-border px-3 py-1.5 text-sm";
  if (disabled) return <span className={`${cls} opacity-50`}>{children}</span>;
  return (
    <Link href={href} className={`${cls} hover:bg-muted`}>
      {children}
    </Link>
  );
}
