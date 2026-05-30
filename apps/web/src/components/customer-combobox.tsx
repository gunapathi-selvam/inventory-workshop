"use client";
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Input, cn } from "@workshop/ui";

export interface CustomerOption {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

/** Searchable customer picker — filters by name OR email. */
export function CustomerCombobox({
  options,
  value,
  onChange,
}: {
  options: CustomerOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const selected = options.find((o) => o.id === value);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options
      .filter((o) => o.name.toLowerCase().includes(q) || (o.email ?? "").toLowerCase().includes(q))
      .slice(0, 50);
  }, [options, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected ? selected.name : "Select customer…"}
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
            <div className="p-2">
              <Input
                autoFocus
                placeholder="Search name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">No matches</p>
              )}
              {filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    o.id === value && "bg-muted",
                  )}
                >
                  <span>
                    <span className="font-medium">{o.name}</span>
                    {o.email && <span className="ml-2 text-xs text-muted-foreground">{o.email}</span>}
                  </span>
                  {o.id === value && <Check className="size-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
