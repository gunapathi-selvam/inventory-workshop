"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button, Select, Input, Field, useToast } from "@workshop/ui";
import { ORDER_STATUS, PAYMENT_TYPE, type OrderStatus, type PaymentType } from "@workshop/core";
import { api } from "~/trpc/react";
import { useCan } from "~/lib/permissions-context";
import { mutationToast } from "~/lib/hooks";

/** Status dropdown (header). Re-renders the server page on success. */
export function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const toast = useToast();
  const canChange = useCan("orders.changeStatus");
  const changeStatus = api.order.changeStatus.useMutation(
    mutationToast(toast, { success: "Status updated", error: "Could not update", onDone: () => router.refresh() }),
  );
  if (!canChange) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Status</span>
      <Select
        className="w-40"
        value={status}
        onChange={(e) => changeStatus.mutate({ id, status: e.target.value as OrderStatus })}
      >
        {ORDER_STATUS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </div>
  );
}

export interface FulfillmentInit {
  trackingId: string | null;
  trackingUrl: string | null;
  deliveryDate: string; // yyyy-mm-dd or ""
  paymentType: PaymentType | "";
  courierName: string;
}

/** Fulfillment card body: read-only tracking link + editable form. */
export function FulfillmentForm({ id, init }: { id: string; init: FulfillmentInit }) {
  const router = useRouter();
  const toast = useToast();
  const canChange = useCan("orders.changeStatus");
  const [f, setF] = React.useState({
    deliveryDate: init.deliveryDate,
    paymentType: init.paymentType,
    courierName: init.courierName,
    trackingId: init.trackingId ?? "",
    trackingUrl: init.trackingUrl ?? "",
  });
  const setFulfill = api.order.setFulfillment.useMutation(
    mutationToast(toast, { success: "Fulfillment saved", error: "Could not save", onDone: () => router.refresh() }),
  );

  return (
    <>
      {init.trackingId && init.trackingUrl && (
        <a
          href={init.trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Track {init.trackingId} <ExternalLink className="size-3" />
        </a>
      )}
      <Field label="Delivery date">
        <Input
          type="date"
          disabled={!canChange}
          value={f.deliveryDate}
          onChange={(e) => setF({ ...f, deliveryDate: e.target.value })}
        />
      </Field>
      <Field label="Payment type">
        <Select
          disabled={!canChange}
          value={f.paymentType}
          onChange={(e) => setF({ ...f, paymentType: e.target.value as PaymentType | "" })}
        >
          <option value="">—</option>
          {PAYMENT_TYPE.map((p) => (
            <option key={p} value={p}>
              {p.replace("_", " ")}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Courier">
        <Input
          disabled={!canChange}
          value={f.courierName}
          onChange={(e) => setF({ ...f, courierName: e.target.value })}
          placeholder="DTDC, India Post…"
        />
      </Field>
      <Field label="Tracking ID">
        <Input disabled={!canChange} value={f.trackingId} onChange={(e) => setF({ ...f, trackingId: e.target.value })} />
      </Field>
      <Field label="Tracking URL">
        <Input
          disabled={!canChange}
          value={f.trackingUrl}
          onChange={(e) => setF({ ...f, trackingUrl: e.target.value })}
          placeholder="https://…"
        />
      </Field>
      {canChange && (
        <Button
          loading={setFulfill.isPending}
          onClick={() =>
            setFulfill.mutate({
              id,
              deliveryDate: f.deliveryDate ? new Date(f.deliveryDate) : null,
              paymentType: f.paymentType || null,
              courierName: f.courierName || null,
              trackingId: f.trackingId || null,
              trackingUrl: f.trackingUrl || null,
            })
          }
        >
          Save fulfillment
        </Button>
      )}
    </>
  );
}
