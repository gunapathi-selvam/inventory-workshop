"use client";
import * as React from "react";
import Link from "next/link";
import { Plus, Pencil, PackagePlus } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Field,
  Input,
  Modal,
  PageHeader,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
  Skeleton,
  useToast,
} from "@workshop/ui";
import { api } from "~/trpc/react";
import { useCan } from "~/lib/permissions-context";
import { money } from "~/lib/format";

interface FilForm {
  id?: string;
  type: string;
  color: string;
  sellRatePerGram: number;
  costPerGram: number;
  weightRemainingG: number;
  spoolCount: number;
  lowStockThresholdG: number;
}
const EMPTY: FilForm = {
  type: "PLA",
  color: "",
  sellRatePerGram: 0,
  costPerGram: 0,
  weightRemainingG: 0,
  spoolCount: 0,
  lowStockThresholdG: 0,
};

export default function InventoryPage() {
  const toast = useToast();
  const utils = api.useUtils();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FilForm>(EMPTY);
  const [adjust, setAdjust] = React.useState<{ id: string; label: string } | null>(null);
  const [adjustG, setAdjustG] = React.useState(0);

  const canCreate = useCan("inventory.create");
  const canEdit = useCan("inventory.edit");
  const canAdjust = useCan("inventory.adjustStock");

  const list = api.filament.list.useQuery({ page: 1, pageSize: 100 });
  const invalidate = () => utils.filament.list.invalidate();

  const create = api.filament.create.useMutation({
    onSuccess: () => {
      toast.success("Filament added");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error("Could not save", e.message),
  });
  const update = api.filament.update.useMutation({
    onSuccess: () => {
      toast.success("Filament updated");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error("Could not save", e.message),
  });
  const adjustStock = api.filament.adjustStock.useMutation({
    onSuccess: () => {
      toast.success("Stock updated");
      setAdjust(null);
      setAdjustG(0);
      invalidate();
    },
    onError: (e) => toast.error("Could not adjust", e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.id) update.mutate({ ...form, id: form.id });
    else create.mutate(form);
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Filament stock, rates and thresholds"
        actions={
          canCreate && (
            <Button
              onClick={() => {
                setForm(EMPTY);
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> Add filament
            </Button>
          )
        }
      />

      {list.isLoading ? (
        <Skeleton className="h-64" />
      ) : !list.data || list.data.items.length === 0 ? (
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
                {list.data.items.map((f) => (
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
                      <div className="flex justify-end gap-1">
                        {canAdjust && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Adjust stock"
                            onClick={() => setAdjust({ id: f.id, label: `${f.type} ${f.color}` })}
                          >
                            <PackagePlus className="size-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setForm({
                                id: f.id,
                                type: f.type,
                                color: f.color,
                                sellRatePerGram: f.sellRatePerGram,
                                costPerGram: f.costPerGram,
                                weightRemainingG: f.weightRemainingG,
                                spoolCount: f.spoolCount,
                                lowStockThresholdG: f.lowStockThresholdG,
                              });
                              setOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create / edit */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit filament" : "Add filament"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="fil-form" type="submit" loading={create.isPending || update.isPending}>
              Save
            </Button>
          </>
        }
      >
        <form id="fil-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" required>
            <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
          </Field>
          <Field label="Color" required>
            <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} required />
          </Field>
          <Field label="Selling rate (₹/gram)" required>
            <Input
              type="number"
              step="0.01"
              value={form.sellRatePerGram}
              onChange={(e) => setForm({ ...form, sellRatePerGram: Number(e.target.value) })}
            />
          </Field>
          <Field label="Cost rate (₹/gram)" required hint="Your material cost — profit basis">
            <Input
              type="number"
              step="0.01"
              value={form.costPerGram}
              onChange={(e) => setForm({ ...form, costPerGram: Number(e.target.value) })}
            />
          </Field>
          <Field label="Stock (grams)">
            <Input
              type="number"
              value={form.weightRemainingG}
              onChange={(e) => setForm({ ...form, weightRemainingG: Number(e.target.value) })}
              disabled={!!form.id}
            />
          </Field>
          <Field label="Spool count">
            <Input
              type="number"
              value={form.spoolCount}
              onChange={(e) => setForm({ ...form, spoolCount: Number(e.target.value) })}
            />
          </Field>
          <Field label="Low-stock threshold (grams)">
            <Input
              type="number"
              value={form.lowStockThresholdG}
              onChange={(e) => setForm({ ...form, lowStockThresholdG: Number(e.target.value) })}
            />
          </Field>
        </form>
        {form.id && (
          <p className="mt-2 text-xs text-muted-foreground">
            To change stock on an existing filament, use the adjust-stock action instead (keeps history).
          </p>
        )}
      </Modal>

      {/* Adjust stock */}
      <Modal
        open={!!adjust}
        onClose={() => setAdjust(null)}
        title={`Adjust stock — ${adjust?.label ?? ""}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjust(null)}>
              Cancel
            </Button>
            <Button
              loading={adjustStock.isPending}
              onClick={() =>
                adjust &&
                adjustStock.mutate({
                  filamentId: adjust.id,
                  deltaG: adjustG,
                  reason: adjustG >= 0 ? "RESTOCK" : "ADJUSTMENT",
                })
              }
            >
              Apply
            </Button>
          </>
        }
      >
        <Field label="Change in grams" hint="Use a positive number to restock, negative to deduct">
          <Input type="number" value={adjustG} onChange={(e) => setAdjustG(Number(e.target.value))} />
        </Field>
      </Modal>
    </>
  );
}
