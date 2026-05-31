import Link from "next/link";
import { Card, CardContent, PageHeader, Badge, Table, THead, TBody, TR, TH, TD, EmptyState } from "@workshop/ui";
import { getServerApi } from "~/trpc/server";
import { AddFilamentButton, FilamentRowActions } from "./inventory-client";

export default async function InventoryPage() {
  const api = await getServerApi();
  const data = await api.filament.list({ page: 1, pageSize: 100 });

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Filament stock, rates and thresholds"
        actions={<AddFilamentButton />}
      />

      {data.items.length === 0 ? (
        <EmptyState title="No filament yet" description="Add your first spool to start tracking stock." />
      ) : (
        <Card>
          <CardContent className="pt-card">
            <Table>
              <THead>
                <TR>
                  <TH>Type / Color</TH>
                  <TH>Sell ₹/g</TH>
                  <TH>Cost ₹/g</TH>
                  <TH>Stock</TH>
                  <TH>Spools</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((f) => (
                  <TR key={f.id}>
                    <TD>
                      <Link href={`/inventory/${f.id}`} className="font-medium hover:underline">
                        {f.type} {f.color}
                      </Link>
                    </TD>
                    <TD>₹{f.sellRatePerGram.toFixed(2)}</TD>
                    <TD>₹{f.costPerGram.toFixed(2)}</TD>
                    <TD>
                      <Badge variant={f.lowStock ? "warning" : "success"}>{f.weightRemainingG}g</Badge>
                    </TD>
                    <TD>{f.spoolCount}</TD>
                    <TD className="text-right">
                      <FilamentRowActions
                        filament={{
                          id: f.id,
                          type: f.type,
                          color: f.color,
                          sellRatePerGram: f.sellRatePerGram,
                          costPerGram: f.costPerGram,
                          weightRemainingG: f.weightRemainingG,
                          spoolCount: f.spoolCount,
                          lowStockThresholdG: f.lowStockThresholdG,
                        }}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
