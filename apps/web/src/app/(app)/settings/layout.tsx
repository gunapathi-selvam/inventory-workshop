"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, ListPlus, IndianRupee, type LucideIcon } from "lucide-react";
import { cn, PageHeader } from "@workshop/ui";
import type { PermissionKey } from "@workshop/core";
import { useCan } from "~/lib/permissions-context";

function Tab({ href, label, icon: Icon, perm }: { href: string; label: string; icon: LucideIcon; perm: PermissionKey }) {
  const pathname = usePathname();
  const allowed = useCan(perm);
  if (!allowed) return null;
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" description="Configure access, fields and pricing" />
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <Tab href="/settings/access-control" label="Access control" icon={ShieldCheck} perm="settings.accessControl" />
        <Tab href="/settings/fields" label="Custom fields" icon={ListPlus} perm="settings.fields" />
        <Tab href="/settings/pricing" label="Pricing" icon={IndianRupee} perm="settings.pricing" />
      </div>
      {children}
    </>
  );
}
