import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Button,
} from "@workshop/ui";
import { getServerApi } from "~/trpc/server";
import { dateTime } from "~/lib/format";

export default async function FilamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = await getServerApi();
  const data = await api.filament.byId({ id }).catch(() => notFound());

  return (
    <>
      <Link href="/inventory">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> Inventory
        </Button>
      </Link>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.type} {data.color}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={data.lowStock ? "warning" : "success"}>{data.weightRemainingG}g in stock</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-card">
            <p className="text-xs text-muted-foreground">Selling rate</p>
            <p className="text-lg font-semibold">₹{data.sellRatePerGram.toFixed(2)}/g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-card">
            <p className="text-xs text-muted-foreground">Cost rate</p>
            <p className="text-lg font-semibold">₹{data.costPerGram.toFixed(2)}/g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-card">
            <p className="text-xs text-muted-foreground">Threshold</p>
            <p className="text-lg font-semibold">{data.lowStockThresholdG}g</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock movements</CardTitle>
        </CardHeader>
        <CardContent>
          {data.stockMoves.length === 0 ? (
            <p className="text-sm text-muted-foreground">No movements yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>Change</TH>
                  <TH>Reason</TH>
                  <TH>Note</TH>
                </TR>
              </THead>
              <TBody>
                {data.stockMoves.map((m) => (
                  <TR key={m.id}>
                    <TD>{dateTime(m.createdAt)}</TD>
                    <TD className={m.deltaG < 0 ? "text-danger" : "text-success"}>
                      {m.deltaG > 0 ? "+" : ""}
                      {m.deltaG}g
                    </TD>
                    <TD>{m.reason}</TD>
                    <TD>{m.note ?? "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
