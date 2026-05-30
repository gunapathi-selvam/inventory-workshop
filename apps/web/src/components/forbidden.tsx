import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button, EmptyState } from "@workshop/ui";

export function Forbidden() {
  return (
    <EmptyState
      icon={<ShieldX className="size-10" />}
      title="Access denied"
      description="You don't have permission to view this page. Ask an admin to grant access."
      action={
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      }
    />
  );
}
