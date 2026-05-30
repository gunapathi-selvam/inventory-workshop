"use client";
import * as React from "react";
import Link from "next/link";
import { Plus, Pencil, ShieldCheck, History } from "lucide-react";
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
  Skeleton,
  useToast,
} from "@workshop/ui";
import { ROLES } from "@workshop/core";
import { api } from "~/trpc/react";
import { useCan } from "~/lib/permissions-context";
import { CustomFields } from "~/components/custom-fields";
import { HistoryModal } from "~/components/history-modal";

interface UForm {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: (typeof ROLES)[number];
  status: "ACTIVE" | "SUSPENDED";
  overridePassword: string;
  customFields: Record<string, unknown>;
}
const EMPTY: UForm = {
  name: "",
  email: "",
  password: "",
  role: "HANDLER",
  status: "ACTIVE",
  overridePassword: "",
  customFields: {},
};

const ROLE_VARIANT: Record<string, "primary" | "info" | "default"> = {
  ADMIN: "primary",
  MANAGER: "info",
  HANDLER: "default",
};

export default function UsersPage() {
  const toast = useToast();
  const utils = api.useUtils();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<UForm>(EMPTY);
  const [historyFor, setHistoryFor] = React.useState<string | null>(null);
  const canManage = useCan("users.manage");

  const list = api.user.list.useQuery({ page: 1, pageSize: 100 });
  const invalidate = () => utils.user.list.invalidate();

  const create = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("User created");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error("Could not save", e.message),
  });
  const update = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("User updated");
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error("Could not save", e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.id) {
      update.mutate({
        id: form.id,
        name: form.name,
        email: form.email,
        role: form.role,
        status: form.status,
        customFields: form.customFields,
        overridePassword: form.overridePassword || undefined,
        ...(form.password ? { password: form.password } : {}),
      });
    } else {
      create.mutate({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        status: form.status,
        customFields: form.customFields,
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Users & roles"
        description="Create team members and assign roles"
        actions={
          canManage && (
            <Button
              onClick={() => {
                setForm(EMPTY);
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> New user
            </Button>
          )
        }
      />

      {list.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          <CardContent className="pt-card">
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.data?.items.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium">{u.name}</TD>
                    <TD>{u.email}</TD>
                    <TD>
                      <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge>
                    </TD>
                    <TD>
                      <Badge variant={u.status === "ACTIVE" ? "success" : "danger"}>{u.status}</Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/settings/access-control?user=${u.id}`}>
                          <Button variant="ghost" size="icon" title="Per-user permissions">
                            <ShieldCheck className="size-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" title="Change history" onClick={() => setHistoryFor(u.id)}>
                          <History className="size-4" />
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setForm({
                                id: u.id,
                                name: u.name,
                                email: u.email,
                                password: "",
                                role: u.role as (typeof ROLES)[number],
                                status: u.status as "ACTIVE" | "SUSPENDED",
                                overridePassword: "",
                                customFields: (u.customFields as Record<string, unknown>) ?? {},
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit user" : "New user"}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="u-form" type="submit" loading={create.isPending || update.isPending}>
              Save
            </Button>
          </>
        }
      >
        <form id="u-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label={form.id ? "New password (optional)" : "Password"} required={!form.id} hint="Min 8 characters">
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!form.id}
            />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as (typeof ROLES)[number] })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "SUSPENDED" })}>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <CustomFields entity="USER" value={form.customFields} onChange={(cf) => setForm({ ...form, customFields: cf })} />
          </div>
          {form.id && (
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

      <HistoryModal entity="USER" id={historyFor} onClose={() => setHistoryFor(null)} />
    </>
  );
}
