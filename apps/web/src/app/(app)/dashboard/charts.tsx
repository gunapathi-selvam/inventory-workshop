"use client";
/**
 * Dashboard charts, split into their own module so `recharts` (~44KB) is loaded
 * via next/dynamic only on the dashboard route instead of in the app-wide bundle.
 */
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
import { Card, CardContent, CardHeader, CardTitle } from "@workshop/ui";

export interface TrendPoint {
  date: string;
  Revenue: number;
  Profit: number;
}
export interface StatusPoint {
  status: string;
  count: number;
}

const statusColors: Record<string, string> = {
  DRAFT: "hsl(var(--color-muted-foreground))",
  CONFIRMED: "hsl(var(--color-info))",
  PRINTING: "hsl(var(--color-primary))",
  DONE: "hsl(var(--color-success))",
  DELIVERED: "hsl(var(--color-chart-2))",
  CANCELLED: "hsl(var(--color-danger))",
};

const tooltipStyle = {
  background: "hsl(var(--color-card))",
  border: "1px solid hsl(var(--color-border))",
  borderRadius: "var(--radius-md)",
  fontSize: 12,
} as const;

export default function DashboardCharts({
  trend,
  statusData,
}: {
  trend: TrendPoint[];
  statusData: StatusPoint[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Revenue &amp; Profit</CardTitle>
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
              <Tooltip contentStyle={tooltipStyle} />
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
              <Tooltip contentStyle={tooltipStyle} />
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
  );
}
