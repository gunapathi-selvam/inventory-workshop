"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  Switch,
  Select,
  Badge,
  Skeleton,
  useToast,
} from "@workshop/ui";
import { api } from "~/trpc/react";

function groupBy<T extends { group: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const it of items) {
    if (!map.has(it.group)) map.set(it.group, []);
    map.get(it.group)!.push(it);
  }
  return [...map.entries()];
}

function ByRole() {
  const toast = useToast();
  const utils = api.useUtils();
  const matrix = api.permission.matrix.useQuery();
  const setPerm = api.permission.setRolePermission.useMutation({
    onSuccess: () => utils.permission.matrix.invalidate(),
    onError: (e) => toast.error("Could not update", e.message),
  });

  if (matrix.isLoading || !matrix.data) return <Skeleton className="h-96" />;
  const { roles, permissions, matrix: m } = matrix.data;

  return (
    <Card>
      <CardContent className="overflow-x-auto pt-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="py-2 pr-4">Permission</th>
              {roles.map((r) => (
                <th key={r} className="px-3 py-2 text-center">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupBy(permissions).map(([group, perms]) => (
              <React.Fragment key={group}>
                <tr>
                  <td colSpan={roles.length + 1} className="bg-muted/40 px-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group}
                  </td>
                </tr>
                {perms.map((p) => (
                  <tr key={p.key} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4">{p.label}</td>
                    {roles.map((role) => (
                      <td key={role} className="px-3 py-2 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={m[role]?.[p.key] ?? false}
                            onCheckedChange={(allowed) =>
                              setPerm.mutate({ role, permissionKey: p.key, allowed })
                            }
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ByUser({ initialUser }: { initialUser?: string }) {
  const toast = useToast();
  const utils = api.useUtils();
  const users = api.user.list.useQuery({ page: 1, pageSize: 100 });
  const [userId, setUserId] = React.useState(initialUser ?? "");

  React.useEffect(() => {
    if (!userId && users.data?.items[0]) setUserId(users.data.items[0].id);
  }, [users.data, userId]);

  const data = api.permission.userOverrides.useQuery({ userId }, { enabled: !!userId });
  const setOverride = api.permission.setUserOverride.useMutation({
    onSuccess: () => {
      utils.permission.userOverrides.invalidate({ userId });
      toast.success("Override updated");
    },
    onError: (e) => toast.error("Could not update", e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Per-user overrides</CardTitle>
        <p className="text-sm text-muted-foreground">
          An override wins over the user&apos;s role default. Set to <em>Inherit</em> to fall back to the role.
        </p>
        <div className="max-w-xs pt-2">
          <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
            {users.data?.items.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!data.data ? (
          <Skeleton className="h-80" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-4">Permission</th>
                <th className="px-3 py-2">Effective</th>
                <th className="px-3 py-2">Override</th>
              </tr>
            </thead>
            <tbody>
              {groupBy(data.data.permissions ?? []).map(([group, perms]) => (
                <React.Fragment key={group}>
                  <tr>
                    <td colSpan={3} className="bg-muted/40 px-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group}
                    </td>
                  </tr>
                  {perms.map((p) => {
                    const effective = data.data!.effective[p.key];
                    const override = data.data!.overrides[p.key] ?? "INHERIT";
                    return (
                      <tr key={p.key} className="border-b border-border last:border-0">
                        <td className="py-2 pr-4">{p.label}</td>
                        <td className="px-3 py-2">
                          <Badge variant={effective ? "success" : "default"}>{effective ? "Allowed" : "Denied"}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            className="max-w-[8rem]"
                            value={override}
                            onChange={(e) =>
                              setOverride.mutate({
                                userId,
                                permissionKey: p.key,
                                effect: e.target.value as "ALLOW" | "DENY" | "INHERIT",
                              })
                            }
                          >
                            <option value="INHERIT">Inherit</option>
                            <option value="ALLOW">Allow</option>
                            <option value="DENY">Deny</option>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export default function AccessControlPage() {
  const params = useSearchParams();
  const initialUser = params.get("user") ?? undefined;
  const [tab, setTab] = React.useState(initialUser ? "user" : "role");

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "role", label: "By role" },
          { value: "user", label: "By user" },
        ]}
      />
      {tab === "role" ? <ByRole /> : <ByUser initialUser={initialUser} />}
    </div>
  );
}
