"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@workshop/ui";
import type { TrendPoint, StatusPoint } from "./charts";

// recharts is heavy and client-only — the `ssr: false` dynamic import must live
// in a client component, so this thin wrapper sits between the server page and
// the chart implementation.
const DashboardCharts = dynamic(() => import("./charts"), {
  ssr: false,
  loading: () => <Skeleton className="h-72" />,
});

export default function DashboardChartsClient(props: { trend: TrendPoint[]; statusData: StatusPoint[] }) {
  return <DashboardCharts {...props} />;
}
