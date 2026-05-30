"use client";
import * as React from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { Button, cn } from "@workshop/ui";
import { api } from "~/trpc/react";

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const utils = api.useUtils();
  const count = api.notification.unreadCount.useQuery(undefined, { refetchInterval: 30_000 });
  const list = api.notification.list.useQuery(undefined, { enabled: open });
  const markRead = api.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });
  const markAll = api.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const unread = count.data ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-sm font-semibold">Notifications</span>
              <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} disabled={unread === 0}>
                <Check className="size-3.5" /> Mark all read
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!list.data || list.data.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                list.data.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-2 border-b border-border p-3 text-sm last:border-0",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    <div className="flex-1">
                      {n.link ? (
                        <Link href={n.link} className="font-medium hover:underline" onClick={() => setOpen(false)}>
                          {n.title}
                        </Link>
                      ) : (
                        <p className="font-medium">{n.title}</p>
                      )}
                      {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markRead.mutate({ id: n.id })}
                        className="text-xs text-primary hover:underline"
                      >
                        Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <Link
              href="/notifications"
              className="block border-t border-border p-2 text-center text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
