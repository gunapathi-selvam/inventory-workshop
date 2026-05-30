"use client";
import * as React from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { IndianRupee, TrendingUp, ShoppingCart, Users, AlertTriangle, Boxes } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  PageHeader,
  Skeleton,
} from "@workshop/ui";
import { api } from "~/trpc/react";
import { money, dateShort, STATUS_VARIANT } from "~/lib/format";

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

export default function DashboardPage() {
  const { data, isLoading } = api.dashboard.stats.useQuery({ days: 30 });

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="Dashboard" description="Last 30 days" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </>
    );
  }

  const trend = data.trend.map((t) => ({
    date: t.date.slice(5),
    Revenue: t.revenue / 100,
    Profit: t.profit / 100,
  }));
  const statusData = data.statusCounts.filter((s) => s.count > 0);
  const statusColors: Record<string, string> = {
    DRAFT: "hsl(var(--color-muted-foreground))",
    CONFIRMED: "hsl(var(--color-info))",
    PRINTING: "hsl(var(--color-primary))",
    DONE: "hsl(var(--color-success))",
    DELIVERED: "hsl(var(--color-chart-2))",
    CANCELLED: "hsl(var(--color-danger))",
  };

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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--color-primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--color-primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--color-success))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--color-success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--color-muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--color-muted-foreground))" width={48} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--color-card))",
                    border: "1px solid hsl(var(--color-border))",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="hsl(var(--color-primary))" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="Profit" stroke="hsl(var(--color-success))" fill="url(#prof)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                <XAxis dataKey="status" tick={{ fontSize: 9 }} stroke="hsl(var(--color-muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--color-muted-foreground))" width={28} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--color-card))",
                    border: "1px solid hsl(var(--color-border))",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((s) => (
                    <Cell key={s.status} fill={statusColors[s.status] ?? "hsl(var(--color-primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
