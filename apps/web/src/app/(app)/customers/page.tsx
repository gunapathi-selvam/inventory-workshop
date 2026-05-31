import { Card, CardContent, PageHeader, Table, THead, TBody, TR, TH, TD, EmptyState } from "@workshop/ui";
import { getServerApi } from "~/trpc/server";
import { dateShort } from "~/lib/format";
import { NewCustomerButton, CustomersSearch, CustomerRowActions } from "./customers-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q : undefined;

  const api = await getServerApi();
  const data = await api.customer.list({ page: 1, pageSize: 50, search });

  return (
    <>
      <PageHeader
        title="Customers"
        description="People and businesses you print for"
        actions={<NewCustomerButton />}
      />

      <CustomersSearch />

      {data.items.length === 0 ? (
        <EmptyState title="No customers yet" description="Create your first customer to start taking orders." />
      ) : (
        <Card>
          <CardContent className="pt-card">
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Phone</TH>
                  <TH>Email</TH>
                  <TH>Tier</TH>
                  <TH>Added</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.name}</TD>
                    <TD>{c.phone ?? "—"}</TD>
                    <TD>{c.email ?? "—"}</TD>
                    <TD>{c.tier ?? "—"}</TD>
                    <TD>{dateShort(c.createdAt)}</TD>
                    <TD className="text-right">
                      <CustomerRowActions
                        customer={{
                          id: c.id,
                          name: c.name,
                          phone: c.phone,
                          email: c.email,
                          address: c.address,
                          tier: c.tier,
                          notes: c.notes,
                          customFields: c.customFields,
                        }}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
