import { Skeleton } from "@workshop/ui";

/** Shown by Next while an (app) route segment is loading/compiling. */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
