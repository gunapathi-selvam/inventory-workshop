"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@workshop/ui";
import { DateRangeFilter, type DateRangeValue } from "~/components/date-range";
import { useDebouncedValue } from "~/lib/hooks";

/** Search + date-range filters that drive the server page via URL params. */
export function AuditFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = React.useState(params.get("q") ?? "");
  const debounced = useDebouncedValue(search, 300);
  const range: DateRangeValue = { from: params.get("from") ?? undefined, to: params.get("to") ?? undefined };

  function apply(mutate: (sp: URLSearchParams) => void) {
    const sp = new URLSearchParams(params.toString());
    mutate(sp);
    sp.delete("page"); // any filter change resets to page 1
    router.replace(`${pathname}?${sp.toString()}`);
  }

  // Push the debounced search term into the URL (replace → no history spam).
  React.useEffect(() => {
    if (debounced === (params.get("q") ?? "")) return;
    apply((sp) => (debounced ? sp.set("q", debounced) : sp.delete("q")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search action, entity or id…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />
      <DateRangeFilter
        value={range}
        onChange={(v) =>
          apply((sp) => {
            v.from ? sp.set("from", v.from) : sp.delete("from");
            v.to ? sp.set("to", v.to) : sp.delete("to");
          })
        }
      />
    </div>
  );
}
