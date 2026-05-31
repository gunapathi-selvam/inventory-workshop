import * as React from "react";
import Link from "next/link";
import { IndianRupee, TrendingUp, ShoppingCart, AlertTriangle, Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, PageHeader } from "@workshop/ui";
import { getServerApi } from "~/trpc/server";
import { money, dateShort, STATUS_VARIANT } from "~/lib/format";
import DashboardChartsClient from "./charts-client";

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-card">
        <div className={`flex size-10 items-center justify-center rounded-lg ${accent ?? "bg-primary/10 text-primary"}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const api = await getServerApi();
  const data = await api.dashboard.stats({ days: 30 });

  const trend = data.trend.map((t) => ({
    date: t.date.slice(5),
    Revenue: t.revenue / 100,
    Profit: t.profit / 100,
  }));
  const statusData = data.statusCounts.filter((s) => s.count > 0);

  return (
    <>
      <PageHeader title="Dashboard" description="Performance over the last 30 days" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<IndianRupee className="size-5" />} label="Revenue" value={money(data.kpis.revenue)} />
        <Kpi
          icon={<TrendingUp className="size-5" />}
          label="Profit"
          value={money(data.kpis.profit)}
          accent="bg-success/10 text-success"
        />
        <Kpi
          icon={<ShoppingCart className="size-5" />}
          label="Orders"
          value={String(data.kpis.orderCount)}
          accent="bg-accent/10 text-accent"
        />
        <Kpi
          icon={<AlertTriangle className="size-5" />}
          label="Low stock"
          value={String(data.kpis.lowStockCount)}
          accent="bg-warning/10 text-warning"
        />
      </div>

      <DashboardChartsClient trend={trend} statusData={statusData} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.recent.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
            {data.recent.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm transition-colors hover:bg-muted"
              >
                <div>
                  <span className="font-medium">{o.orderNumber}</span>
                  <span className="ml-2 text-muted-foreground">{o.customer.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{money(o.total)}</span>
                  <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="size-4" /> Low stock filaments
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.lowStockItems.length === 0 && (
              <p className="text-sm text-muted-foreground">All filaments above threshold. 🎉</p>
            )}
            {data.lowStockItems.map((f) => (
              <Link
                key={f.id}
                href={`/inventory/${f.id}`}
                className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium">
                  {f.type} {f.color}
                </span>
                <Badge variant="warning">
                  {f.weightRemainingG}g / {f.lowStockThresholdG}g
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Showing {data.kpis.customerCount} customers · {dateShort(new Date())}
      </p>
    </>
  );
}
