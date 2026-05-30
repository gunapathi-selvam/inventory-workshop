"use client";
import * as React from "react";
import { Input, Button } from "@workshop/ui";

export interface DateRangeValue {
  from?: string; // yyyy-mm-dd
  to?: string;
}

/** Reusable from/to date filter. Emits ISO yyyy-mm-dd strings (or undefined). */
export function DateRangeFilter({
  value,
  onChange,
  compact,
}: {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        className={compact ? "h-8 w-36" : "w-40"}
        value={value.from ?? ""}
        onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type="date"
        className={compact ? "h-8 w-36" : "w-40"}
        value={value.to ?? ""}
        onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
      />
      {(value.from || value.to) && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          Clear
        </Button>
      )}
    </div>
  );
}

/** Convert the range strings to the API's optional Date inputs. */
export function rangeToApi(v: DateRangeValue) {
  return {
    dateFrom: v.from ? new Date(v.from) : undefined,
    dateTo: v.to ? new Date(v.to) : undefined,
  };
}
