"use client";
import * as React from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Field,
  Input,
  Select,
  Modal,
  PageHeader,
  Badge,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Switch,
  EmptyState,
  Skeleton,
  useToast,
} from "@workshop/ui";
import { api } from "~/trpc/react";
import { useCan } from "~/lib/permissions-context";

interface DForm {
  id?: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  active: boolean;
  maxUses?: number;
}
const EMPTY: DForm = { code: "", type: "PERCENT", value: 10, active: true };

export default function DiscountsPage() {
  const toast = useToast();
  const utils = api.useUtils();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<DForm>(EMPTY);
  const canManage = useCan("discounts.manage");

  const list = api.discount.list.useQuery();
  const invalidate = () => utils.discount.list.invalidate();

  const create = api.discount.create.useMutation({
    onSuccess: () => {
      toast.success("Discount created");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error("Could not save", e.message),
  });
  const update = api.discount.update.useMutation({
    onSuccess: () => {
      toast.success("Discount updated");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error("Could not save", e.message),
  });
  const remove = api.discount.remove.useMutation({
    onSuccess: () => {
      toast.success("Discount removed");
      invalidate();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { code: form.code, type: form.type, value: form.value, active: form.active, maxUses: form.maxUses };
    if (form.id) update.mutate({ id: form.id, ...payload });
    else create.mutate(payload);
  };

  return (
    <>
      <PageHeader
        title="Discount codes"
        description="Percentage or flat discounts applied at checkout"
        actions={
          canManage && (
            <Button
              onClick={() => {
                setForm(EMPTY);
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> New code
            </Button>
          )
        }
      />

      {list.isLoading ? (
        <Skeleton className="h-48" />
      ) : !list.data || list.data.length === 0 ? (
        <EmptyState title="No discount codes" description="Create codes like WELCOME10 to offer discounts on orders." />
      ) : (
        <Card>
          <CardContent className="pt-card">
            <Table>
              <THead>
                <TR>
                  <TH>Code</TH>
                  <TH>Type</TH>
                  <TH>Value</TH>
                  <TH>Used</TH>
                  <TH>Status</TH>
                  {canManage && <TH className="text-right">Actions</TH>}
                </TR>
              </THead>
              <TBody>
                {list.data.map((d) => (
                  <TR key={d.id}>
                    <TD className="font-mono font-medium">{d.code}</TD>
                    <TD>{d.type}</TD>
                    <TD>{d.type === "PERCENT" ? `${d.displayValue}%` : `₹${d.displayValue}`}</TD>
                    <TD>
                      {d.usedCount}
                      {d.maxUses ? ` / ${d.maxUses}` : ""}
                    </TD>
                    <TD>
                      <Badge variant={d.active ? "success" : "default"}>{d.active ? "Active" : "Inactive"}</Badge>
                    </TD>
                    {canManage && (
                      <TD className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setForm({
                                id: d.id,
                                code: d.code,
                                type: d.type as "PERCENT" | "FLAT",
                                value: d.displayValue,
                                active: d.active,
                                maxUses: d.maxUses ?? undefined,
                              });
                              setOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-danger"
                            onClick={() => confirm(`Remove ${d.code}?`) && remove.mutate({ id: d.id })}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TD>
                    )}
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
        title={form.id ? "Edit discount" : "New discount"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="d-form" type="submit" loading={create.isPending || update.isPending}>
              Save
            </Button>
          </>
        }
      >
        <form id="d-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" required>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="WELCOME10"
              required
            />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENT" | "FLAT" })}>
              <option value="PERCENT">Percent (%)</option>
              <option value="FLAT">Flat (₹)</option>
            </Select>
          </Field>
          <Field label={form.type === "PERCENT" ? "Percent" : "Amount (₹)"} required>
            <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </Field>
          <Field label="Max uses" hint="Leave empty for unlimited">
            <Input
              type="number"
              value={form.maxUses ?? ""}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </Field>
          <Field label="Active">
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
