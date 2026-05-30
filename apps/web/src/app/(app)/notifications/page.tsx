"use client";
import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button, Card, CardContent, PageHeader, Badge, EmptyState, Skeleton, cn, useToast } from "@workshop/ui";
import { api } from "~/trpc/react";
import { dateTime } from "~/lib/format";

export default function NotificationsPage() {
  const toast = useToast();
  const utils = api.useUtils();
  const list = api.notification.list.useQuery();
  const markAll = api.notification.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("All marked as read");
      utils.notification.invalidate();
    },
  });
  const markRead = api.notification.markRead.useMutation({ onSuccess: () => utils.notification.invalidate() });

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Low-stock alerts, order updates and system messages"
        actions={
          <Button variant="outline" onClick={() => markAll.mutate()}>
            <Check className="size-4" /> Mark all read
          </Button>
        }
      />

      {list.isLoading ? (
        <Skeleton className="h-64" />
      ) : !list.data || list.data.length === 0 ? (
        <EmptyState title="You're all caught up" description="No notifications right now." />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-card">
            {list.data.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-md border border-border p-3",
                  !n.read && "bg-primary/5",
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    {n.link ? (
                      <Link href={n.link} className="font-medium hover:underline">
                        {n.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{n.title}</span>
                    )}
                    <Badge variant="outline">{n.type}</Badge>
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">{dateTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ id: n.id })}>
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
