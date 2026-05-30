"use client";
import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@workshop/ui";
import { useSession } from "~/lib/permissions-context";
import { NotificationBell } from "./notification-bell";

export function Topbar() {
  const user = useSession();
  const [menu, setMenu] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-header items-center justify-end gap-2 border-b border-border bg-card/80 px-page backdrop-blur">
      <NotificationBell />
      <div className="relative">
        <button
          onClick={() => setMenu((m) => !m)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {user.name?.charAt(0).toUpperCase() ?? "U"}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block font-medium leading-tight">{user.name}</span>
            <span className="block text-xs capitalize text-muted-foreground">{user.role.toLowerCase()}</span>
          </span>
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
              <div className="flex items-center gap-2 px-2 py-2 text-sm">
                <UserIcon className="size-4 text-muted-foreground" />
                <span className="truncate">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-danger"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
