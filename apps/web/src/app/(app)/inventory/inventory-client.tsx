"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, PackagePlus } from "lucide-react";
import { Button, Field, Input, Modal, useToast } from "@workshop/ui";
import { api } from "~/trpc/react";
import { useCan } from "~/lib/permissions-context";

export interface FilamentRow {
  id: string;
  type: string;
  color: string;
  sellRatePerGram: number;
  costPerGram: number;
  weightRemainingG: number;
  spoolCount: number;
  lowStockThresholdG: number;
}

type FilForm = Omit<FilamentRow, "id">;
const EMPTY: FilForm = {
  type: "PLA",
  color: "",
  sellRatePerGram: 0,
  costPerGram: 0,
  weightRemainingG: 0,
  spoolCount: 0,
  lowStockThresholdG: 0,
};

/** Shared add/edit modal — mounted only while open. */
function FilamentFormModal({ initial, onClose }: { initial?: FilamentRow; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = React.useState<FilForm>(initial ? { ...initial } : EMPTY);
  const done = (msg: string) => {
    toast.success(msg);
    onClose();
    router.refresh();
  };
  const create = api.filament.create.useMutation({
    onSuccess: () => done("Filament added"),
    onError: (e) => toast.error("Could not save", e.message),
  });
  const update = api.filament.update.useMutation({
    onSuccess: () => done("Filament updated"),
    onError: (e) => toast.error("Could not save", e.message),
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) update.mutate({ ...form, id: initial.id });
    else create.mutate(form);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "Edit filament" : "Add filament"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
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
            disabled={!!initial}
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
      {initial && (
        <p className="mt-2 text-xs text-muted-foreground">
          To change stock on an existing filament, use the adjust-stock action instead (keeps history).
        </p>
      )}
    </Modal>
  );
}

/** Adjust-stock modal — mounted only while open. */
function AdjustStockModal({ id, label, onClose }: { id: string; label: string; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [deltaG, setDeltaG] = React.useState(0);
  const adjustStock = api.filament.adjustStock.useMutation({
    onSuccess: () => {
      toast.success("Stock updated");
      onClose();
      router.refresh();
    },
    onError: (e) => toast.error("Could not adjust", e.message),
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={`Adjust stock — ${label}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={adjustStock.isPending}
            onClick={() => adjustStock.mutate({ filamentId: id, deltaG, reason: deltaG >= 0 ? "RESTOCK" : "ADJUSTMENT" })}
          >
            Apply
          </Button>
        </>
      }
    >
      <Field label="Change in grams" hint="Use a positive number to restock, negative to deduct">
        <Input type="number" value={deltaG} onChange={(e) => setDeltaG(Number(e.target.value))} />
      </Field>
    </Modal>
  );
}

/** "Add filament" toolbar button (permission-gated). */
export function AddFilamentButton() {
  const canCreate = useCan("inventory.create");
  const [open, setOpen] = React.useState(false);
  if (!canCreate) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add filament
      </Button>
      {open && <FilamentFormModal onClose={() => setOpen(false)} />}
    </>
  );
}

/** Per-row actions: adjust stock + edit (+ their modals). */
export function FilamentRowActions({ filament }: { filament: FilamentRow }) {
  const canEdit = useCan("inventory.edit");
  const canAdjust = useCan("inventory.adjustStock");
  const [edit, setEdit] = React.useState(false);
  const [adjust, setAdjust] = React.useState(false);
  return (
    <div className="flex justify-end gap-1">
      {canAdjust && (
        <Button variant="ghost" size="icon" title="Adjust stock" onClick={() => setAdjust(true)}>
          <PackagePlus className="size-4" />
        </Button>
      )}
      {canEdit && (
        <Button variant="ghost" size="icon" onClick={() => setEdit(true)}>
          <Pencil className="size-4" />
        </Button>
      )}
      {edit && <FilamentFormModal initial={filament} onClose={() => setEdit(false)} />}
      {adjust && <AdjustStockModal id={filament.id} label={`${filament.type} ${filament.color}`} onClose={() => setAdjust(false)} />}
    </div>
  );
}
