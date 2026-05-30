"use client";
import * as React from "react";
import { Modal, Button, Field, Input, Skeleton, useToast } from "@workshop/ui";
import { api } from "~/trpc/react";
import { mutationToast } from "~/lib/hooks";

/**
 * Edit a customer's address & phone only (no override password needed — name and
 * email are intentionally not editable here). Used from the order wizard.
 */
export function EditContactModal({
  customerId,
  onClose,
}: {
  customerId: string | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const utils = api.useUtils();
  const q = api.customer.basic.useQuery({ id: customerId! }, { enabled: !!customerId });
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");

  React.useEffect(() => {
    if (q.data) {
      setPhone(q.data.phone ?? "");
      setAddress(q.data.address ?? "");
    }
  }, [q.data]);

  const update = api.customer.update.useMutation(
    mutationToast(toast, {
      success: "Contact updated",
      error: "Could not update",
      onDone: () => {
        utils.customer.basic.invalidate({ id: customerId! });
        utils.customer.options.invalidate();
        onClose();
      },
    }),
  );

  return (
    <Modal
      open={!!customerId}
      onClose={onClose}
      title="Edit contact"
      description="Update phone & address. Name/email are changed from the Customers page."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={update.isPending}
            onClick={() => customerId && update.mutate({ id: customerId, phone, address })}
          >
            Save
          </Button>
        </>
      }
    >
      {!q.data ? (
        <Skeleton className="h-28" />
      ) : (
        <div className="grid gap-4">
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
        </div>
      )}
    </Modal>
  );
}
