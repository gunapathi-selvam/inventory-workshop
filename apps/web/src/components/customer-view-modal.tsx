"use client";
import { Modal, Skeleton, Badge } from "@workshop/ui";
import { api } from "~/trpc/react";

/** View-only customer contact card (used when clicking a customer name). */
export function CustomerViewModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const q = api.customer.basic.useQuery({ id: id! }, { enabled: !!id });
  return (
    <Modal open={!!id} onClose={onClose} title="Customer details">
      {!q.data ? (
        <Skeleton className="h-32" />
      ) : (
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="col-span-2 font-medium">{q.data.name}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="col-span-2">{q.data.phone || "—"}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="col-span-2">{q.data.email || "—"}</dd>
          <dt className="text-muted-foreground">Address</dt>
          <dd className="col-span-2">{q.data.address || "—"}</dd>
          <dt className="text-muted-foreground">Tier</dt>
          <dd className="col-span-2">{q.data.tier ? <Badge variant="outline">{q.data.tier}</Badge> : "—"}</dd>
          {q.data.notes && (
            <>
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="col-span-2">{q.data.notes}</dd>
            </>
          )}
        </dl>
      )}
    </Modal>
  );
}
