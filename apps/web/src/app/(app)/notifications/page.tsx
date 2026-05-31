import Link from "next/link";
import { Card, CardContent, PageHeader, Badge, EmptyState, cn } from "@workshop/ui";
import { getServerApi } from "~/trpc/server";
import { dateTime } from "~/lib/format";
import { MarkAllReadButton, MarkReadButton } from "./notifications-actions";

export default async function NotificationsPage() {
  const api = await getServerApi();
  const list = await api.notification.list();

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Low-stock alerts, order updates and system messages"
        actions={<MarkAllReadButton />}
      />

      {list.length === 0 ? (
        <EmptyState title="You're all caught up" description="No notifications right now." />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-card">
            {list.map((n) => (
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
                {!n.read && <MarkReadButton id={n.id} />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
