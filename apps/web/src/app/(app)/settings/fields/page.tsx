"use client";
import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Field,
  Input,
  Select,
  Switch,
  Tabs,
  Modal,
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
import { CUSTOM_FIELD_ENTITY, FIELD_TYPE, type CustomFieldEntity } from "@workshop/core";
import { api } from "~/trpc/react";

interface FForm {
  key: string;
  label: string;
  type: (typeof FIELD_TYPE)[number];
  required: boolean;
  optionsText: string;
  active: boolean;
}
const EMPTY: FForm = { key: "", label: "", type: "TEXT", required: false, optionsText: "", active: true };

export default function FieldsPage() {
  const toast = useToast();
  const utils = api.useUtils();
  const [entity, setEntity] = React.useState<CustomFieldEntity>("CUSTOMER");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FForm>(EMPTY);

  const list = api.field.listAll.useQuery({ entity });
  const invalidate = () => {
    utils.field.listAll.invalidate({ entity });
    utils.field.byEntity.invalidate({ entity });
  };

  const create = api.field.create.useMutation({
    onSuccess: () => {
      toast.success("Field added");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error("Could not add field", e.message),
  });
  const update = api.field.update.useMutation({ onSuccess: invalidate });
  const remove = api.field.remove.useMutation({
    onSuccess: () => {
      toast.success("Field removed");
      invalidate();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      entity,
      key: form.key,
      label: form.label,
      type: form.type,
      required: form.required,
      active: form.active,
      options:
        form.type === "SELECT"
          ? form.optionsText.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Tabs
          value={entity}
          onValueChange={(v) => setEntity(v as CustomFieldEntity)}
          tabs={CUSTOM_FIELD_ENTITY.map((e) => ({ value: e, label: e.charAt(0) + e.slice(1).toLowerCase() }))}
        />
        <Button
          onClick={() => {
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Add field
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Fields defined here appear automatically on the {entity.toLowerCase()} form — no code change or redeploy.
      </p>

      {list.isLoading ? (
        <Skeleton className="h-48" />
      ) : !list.data || list.data.length === 0 ? (
        <EmptyState title="No custom fields" description={`Add fields to capture extra ${entity.toLowerCase()} details.`} />
      ) : (
        <Card>
          <CardContent className="pt-card">
            <Table>
              <THead>
                <TR>
                  <TH>Label</TH>
                  <TH>Key</TH>
                  <TH>Type</TH>
                  <TH>Required</TH>
                  <TH>Active</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.data.map((f) => (
                  <TR key={f.id}>
                    <TD className="font-medium">{f.label}</TD>
                    <TD className="font-mono text-xs">{f.key}</TD>
                    <TD>
                      <Badge variant="outline">{f.type}</Badge>
                    </TD>
                    <TD>{f.required ? "Yes" : "No"}</TD>
                    <TD>
                      <Switch
                        checked={f.active}
                        onCheckedChange={(active) => update.mutate({ id: f.id, active })}
                      />
                    </TD>
                    <TD className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-danger"
                        onClick={() => confirm(`Remove field "${f.label}"?`) && remove.mutate({ id: f.id })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
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
        title={`Add field — ${entity.toLowerCase()}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="f-form" type="submit" loading={create.isPending}>
              Add field
            </Button>
          </>
        }
      >
        <form id="f-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Label" required>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </Field>
          <Field label="Key" required hint="letters, numbers, underscore">
            <Input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="gstNumber"
              required
            />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FForm["type"] })}>
              {FIELD_TYPE.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Required">
            <Switch checked={form.required} onCheckedChange={(v) => setForm({ ...form, required: v })} />
          </Field>
          {form.type === "SELECT" && (
            <div className="sm:col-span-2">
              <Field label="Options" hint="comma separated">
                <Input
                  value={form.optionsText}
                  onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
                  placeholder="Small, Medium, Large"
                />
              </Field>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
