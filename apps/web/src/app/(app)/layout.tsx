import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser, getEffectivePermissions } from "@workshop/auth";
import { getPagePermission } from "@workshop/core";
import { PermissionsProvider } from "~/lib/permissions-context";
import { Sidebar } from "~/components/sidebar";
import { Topbar } from "~/components/topbar";
import { Forbidden } from "~/components/forbidden";
import { RouteProgress } from "~/components/route-progress";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const permissions = await getEffectivePermissions(user.id, user.role);

  // Fine-grained page guard (the edge middleware only checks authentication).
  const pathname = (await headers()).get("x-pathname") ?? "";
  const pagePerm = getPagePermission(pathname);
  const allowedPage = !pagePerm || permissions[pagePerm.key];

  return (
    <PermissionsProvider user={user} permissions={permissions}>
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <div className="min-h-screen">
        <Sidebar />
        <div className="md:pl-sidebar">
          <Topbar />
          <main className="mx-auto flex max-w-7xl flex-col gap-section p-page">
            {allowedPage ? children : <Forbidden />}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
