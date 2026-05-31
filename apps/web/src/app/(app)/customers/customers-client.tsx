"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search, ListOrdered, History } from "lucide-react";
import { Button, Field, Input, Modal, useToast } from "@workshop/ui";
import { api } from "~/trpc/react";
import { useCan } from "~/lib/permissions-context";
import { CustomFields } from "~/components/custom-fields";
import { CustomerOrdersModal } from "~/components/customer-orders-modal";
import { HistoryModal } from "~/components/history-modal";
import { useDebouncedValue } from "~/lib/hooks";

export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tier: string | null;
  notes: string | null;
  customFields: unknown;
}

/** Search box that drives the server page via the `q` URL param. */
export function CustomersSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = React.useState(params.get("q") ?? "");
  const debounced = useDebouncedValue(search, 300);
  React.useEffect(() => {
    if (debounced === (params.get("q") ?? "")) return;
    const sp = new URLSearchParams(params.toString());
    debounced ? sp.set("q", debounced) : sp.delete("q");
    router.replace(`${pathname}?${sp.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return (
    <div className="relative max-w-xs">
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input className="pl-8" placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
  );
}

/** Shared create/edit modal — mounted only while open, so state is always fresh. */
function CustomerFormModal({ initial, onClose }: { initial?: CustomerRow; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = React.useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    tier: initial?.tier ?? "",
    notes: initial?.notes ?? "",
    overridePassword: "",
    customFields: (initial?.customFields as Record<string, unknown>) ?? {},
  });
  const done = (msg: string) => {
    toast.success(msg);
    onClose();
    router.refresh();
  };
  const create = api.customer.create.useMutation({
    onSuccess: () => done("Customer created"),
    onError: (e) => toast.error("Could not save", e.message),
  });
  const update = api.customer.update.useMutation({
    onSuccess: () => done("Customer updated"),
    onError: (e) => toast.error("Could not save", e.message),
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      tier: form.tier || undefined,
      notes: form.notes || undefined,
      customFields: form.customFields,
    };
    if (initial) update.mutate({ id: initial.id, ...payload, overridePassword: form.overridePassword || undefined });
    else create.mutate(payload);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "Edit customer" : "New customer"}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button form="customer-form" type="submit" loading={create.isPending || update.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Tier">
          <Input value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} placeholder="Retail / Business" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <CustomFields entity="CUSTOMER" value={form.customFields} onChange={(cf) => setForm({ ...form, customFields: cf })} />
        </div>
        {initial && (
          <div className="sm:col-span-2">
            <Field label="Override password" hint="Required only when changing the name or email">
              <Input
                type="password"
                value={form.overridePassword}
                onChange={(e) => setForm({ ...form, overridePassword: e.target.value })}
                placeholder="••••••"
              />
            </Field>
          </div>
        )}
      </form>
    </Modal>
  );
}

/** "New customer" toolbar button (permission-gated). */
export function NewCustomerButton() {
  const canCreate = useCan("customers.create");
  const [open, setOpen] = React.useState(false);
  if (!canCreate) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> New customer
      </Button>
      {open && <CustomerFormModal onClose={() => setOpen(false)} />}
    </>
  );
}

/** Per-row actions: view orders, history, edit, delete (+ their modals). */
export function CustomerRowActions({ customer }: { customer: CustomerRow }) {
  const router = useRouter();
  const toast = useToast();
  const canEdit = useCan("customers.edit");
  const canDelete = useCan("customers.delete");
  const canViewOrders = useCan("orders.view");
  const [edit, setEdit] = React.useState(false);
  const [orders, setOrders] = React.useState(false);
  const [history, setHistory] = React.useState(false);
  const remove = api.customer.remove.useMutation({
    onSuccess: () => {
      toast.success("Customer deleted");
      router.refresh();
    },
    onError: (e) => toast.error("Could not delete", e.message),
  });

  return (
    <div className="flex justify-end gap-1">
      {canViewOrders && (
        <Button variant="ghost" size="icon" title="View orders" onClick={() => setOrders(true)}>
          <ListOrdered className="size-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" title="Change history" onClick={() => setHistory(true)}>
        <History className="size-4" />
      </Button>
      {canEdit && (
        <Button variant="ghost" size="icon" onClick={() => setEdit(true)}>
          <Pencil className="size-4" />
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="text-danger"
          onClick={() => {
            if (confirm(`Delete ${customer.name}?`)) remove.mutate({ id: customer.id });
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      )}

      {edit && <CustomerFormModal initial={customer} onClose={() => setEdit(false)} />}
      <CustomerOrdersModal customer={orders ? { id: customer.id, name: customer.name } : null} onClose={() => setOrders(false)} />
      <HistoryModal entity="CUSTOMER" id={history ? customer.id : null} onClose={() => setHistory(false)} />
    </div>
  );
}
