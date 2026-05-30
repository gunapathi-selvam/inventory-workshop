"use client";
import * as React from "react";
import { Plus, Pencil, Trash2, Search, ListOrdered, History } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Field,
  Input,
  Modal,
  PageHeader,
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
import { CustomFields } from "~/components/custom-fields";
import { CustomerOrdersModal } from "~/components/customer-orders-modal";
import { HistoryModal } from "~/components/history-modal";
import { dateShort } from "~/lib/format";

interface FormState {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  tier: string;
  notes: string;
  overridePassword: string;
  customFields: Record<string, unknown>;
}

const EMPTY: FormState = { name: "", phone: "", email: "", address: "", tier: "", notes: "", overridePassword: "", customFields: {} };

export default function CustomersPage() {
  const toast = useToast();
  const utils = api.useUtils();
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [ordersFor, setOrdersFor] = React.useState<{ id: string; name: string } | null>(null);
  const [historyFor, setHistoryFor] = React.useState<string | null>(null);

  const canCreate = useCan("customers.create");
  const canEdit = useCan("customers.edit");
  const canDelete = useCan("customers.delete");
  const canViewOrders = useCan("orders.view");

  const list = api.customer.list.useQuery({ page: 1, pageSize: 50, search: search || undefined });

  const invalidate = () => utils.customer.list.invalidate();
  const create = api.customer.create.useMutation({
    onSuccess: () => {
      toast.success("Customer created");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error("Could not save", e.message),
  });
  const update = api.customer.update.useMutation({
    onSuccess: () => {
      toast.success("Customer updated");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error("Could not save", e.message),
  });
  const remove = api.customer.remove.useMutation({
    onSuccess: () => {
      toast.success("Customer deleted");
      invalidate();
    },
    onError: (e) => toast.error("Could not delete", e.message),
  });

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (c: FormState) => {
    setForm(c);
    setOpen(true);
  };

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
    if (form.id) update.mutate({ id: form.id, ...payload, overridePassword: form.overridePassword || undefined });
    else create.mutate(payload);
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description="People and businesses you print for"
        actions={
          canCreate && (
            <Button onClick={openCreate}>
              <Plus className="size-4" /> New customer
            </Button>
          )
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {list.isLoading ? (
        <Skeleton className="h-64" />
      ) : !list.data || list.data.items.length === 0 ? (
        <EmptyState title="No customers yet" description="Create your first customer to start taking orders." />
      ) : (
        <Card>
          <CardContent className="pt-card">
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Phone</TH>
                  <TH>Email</TH>
                  <TH>Tier</TH>
                  <TH>Added</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.data.items.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.name}</TD>
                    <TD>{c.phone ?? "—"}</TD>
                    <TD>{c.email ?? "—"}</TD>
                    <TD>{c.tier ?? "—"}</TD>
                    <TD>{dateShort(c.createdAt)}</TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-1">
                        {canViewOrders && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View orders"
                            onClick={() => setOrdersFor({ id: c.id, name: c.name })}
                          >
                            <ListOrdered className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Change history"
                          onClick={() => setHistoryFor(c.id)}
                        >
                          <History className="size-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              openEdit({
                                id: c.id,
                                name: c.name,
                                phone: c.phone ?? "",
                                email: c.email ?? "",
                                address: c.address ?? "",
                                tier: c.tier ?? "",
                                notes: c.notes ?? "",
                                overridePassword: "",
                                customFields: (c.customFields as Record<string, unknown>) ?? {},
                              })
                            }
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-danger"
                            onClick={() => {
                              if (confirm(`Delete ${c.name}?`)) remove.mutate({ id: c.id });
                            }}
                          >
                            <Trash2 className="size-4" />
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit customer" : "New customer"}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
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
            <CustomFields
              entity="CUSTOMER"
              value={form.customFields}
              onChange={(cf) => setForm({ ...form, customFields: cf })}
            />
          </div>
          {form.id && (
            <div className="sm:col-span-2">
              <Field
                label="Override password"
                hint="Required only when changing the name or email"
              >
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

      <CustomerOrdersModal customer={ordersFor} onClose={() => setOrdersFor(null)} />
      <HistoryModal entity="CUSTOMER" id={historyFor} onClose={() => setHistoryFor(null)} />
    </>
  );
}
