"use client";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button, useToast } from "@workshop/ui";
import { api } from "~/trpc/react";

export function MarkAllReadButton() {
  const router = useRouter();
  const toast = useToast();
  const markAll = api.notification.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("All marked as read");
      router.refresh();
    },
  });
  return (
    <Button variant="outline" onClick={() => markAll.mutate()}>
      <Check className="size-4" /> Mark all read
    </Button>
  );
}

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter();
  const markRead = api.notification.markRead.useMutation({ onSuccess: () => router.refresh() });
  return (
    <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ id })}>
      Mark read
    </Button>
  );
}
