"use client";
import { Modal, Skeleton, Table, THead, TBody, TR, TH, TD, EmptyState } from "@workshop/ui";
import type { ChangeEntity } from "@workshop/core";
import { api } from "~/trpc/react";
import { dateTime } from "~/lib/format";

/** Shows name/email change history for a customer or user. */
export function HistoryModal({
  entity,
  id,
  onClose,
}: {
  entity: ChangeEntity;
  id: string | null;
  onClose: () => void;
}) {
  const customer = api.customer.history.useQuery({ id: id! }, { enabled: !!id && entity === "CUSTOMER" });
  const user = api.user.history.useQuery({ id: id! }, { enabled: !!id && entity === "USER" });
  const q = entity === "CUSTOMER" ? customer : user;

  return (
    <Modal open={!!id} onClose={onClose} title="Change history" description="Past name & email values">
      {q.isLoading ? (
        <Skeleton className="h-32" />
      ) : !q.data || q.data.length === 0 ? (
        <EmptyState title="No changes recorded" description="Name/email have not been changed yet." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>When</TH>
              <TH>Field</TH>
              <TH>Old</TH>
              <TH>New</TH>
            </TR>
          </THead>
          <TBody>
            {q.data.map((h) => (
              <TR key={h.id}>
                <TD>{dateTime(h.createdAt)}</TD>
                <TD className="capitalize">{h.field}</TD>
                <TD className="text-muted-foreground line-through">{h.oldValue || "—"}</TD>
                <TD className="font-medium">{h.newValue || "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Modal>
  );
}
