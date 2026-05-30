"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Boxes,
  TicketPercent,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey } from "@workshop/core";
import { cn } from "@workshop/ui";
import { useCan } from "~/lib/permissions-context";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: PermissionKey;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/orders", label: "Orders", icon: ShoppingCart, permission: "orders.view" },
  { href: "/customers", label: "Customers", icon: Users, permission: "customers.view" },
  { href: "/inventory", label: "Inventory", icon: Boxes, permission: "inventory.view" },
  { href: "/discounts", label: "Discounts", icon: TicketPercent, permission: "discounts.view" },
  { href: "/users", label: "Users", icon: UserCog, permission: "users.view" },
  { href: "/settings/access-control", label: "Settings", icon: Settings, permission: "settings.accessControl" },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const can = useCan(item.permission);
  if (!can) return null;
  const active = pathname === item.href || pathname.startsWith(item.href + "/") ||
    (item.href.startsWith("/settings") && pathname.startsWith("/settings"));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-sidebar flex-col border-r border-border bg-card md:flex">
      <div className="flex h-header items-center gap-2 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="size-5" />
        </div>
        <span className="text-base font-semibold">Workshop</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
