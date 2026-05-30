"use client";
import * as React from "react";
import type { CustomFieldEntity } from "@workshop/core";
import { Field, Input, Select, Textarea, Switch } from "@workshop/ui";
import { api } from "~/trpc/react";

type Values = Record<string, unknown>;

/**
 * Renders the runtime admin-defined fields for an entity and is fully
 * controlled. Drop it into any create/edit form — new fields defined in
 * /settings/fields appear here automatically with no code change.
 */
export function CustomFields({
  entity,
  value,
  onChange,
}: {
  entity: CustomFieldEntity;
  value: Values;
  onChange: (next: Values) => void;
}) {
  const defs = api.field.byEntity.useQuery({ entity });

  if (!defs.data || defs.data.length === 0) return null;

  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });

  return (
    <div className="grid gap-4 rounded-lg border border-dashed border-border p-4 sm:grid-cols-2">
      <p className="col-span-full text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Additional fields
      </p>
      {defs.data.map((def) => {
        const current = value[def.key];
        switch (def.type) {
          case "TEXTAREA":
            return (
              <div key={def.id} className="col-span-full">
                <Field label={def.label} required={def.required}>
                  <Textarea
                    value={(current as string) ?? ""}
                    onChange={(e) => set(def.key, e.target.value)}
                  />
                </Field>
              </div>
            );
          case "BOOLEAN":
            return (
              <Field key={def.id} label={def.label}>
                <Switch checked={Boolean(current)} onCheckedChange={(v) => set(def.key, v)} />
              </Field>
            );
          case "SELECT":
            return (
              <Field key={def.id} label={def.label} required={def.required}>
                <Select value={(current as string) ?? ""} onChange={(e) => set(def.key, e.target.value)}>
                  <option value="">Select…</option>
                  {((def.options as string[]) ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
            );
          case "NUMBER":
            return (
              <Field key={def.id} label={def.label} required={def.required}>
                <Input
                  type="number"
                  value={(current as number) ?? ""}
                  onChange={(e) => set(def.key, e.target.value === "" ? "" : Number(e.target.value))}
                />
              </Field>
            );
          case "DATE":
            return (
              <Field key={def.id} label={def.label} required={def.required}>
                <Input
                  type="date"
                  value={current ? String(current).slice(0, 10) : ""}
                  onChange={(e) => set(def.key, e.target.value)}
                />
              </Field>
            );
          default:
            return (
              <Field key={def.id} label={def.label} required={def.required}>
                <Input value={(current as string) ?? ""} onChange={(e) => set(def.key, e.target.value)} />
              </Field>
            );
        }
      })}
    </div>
  );
}
