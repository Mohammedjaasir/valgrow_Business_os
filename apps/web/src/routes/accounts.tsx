import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useChartOfAccounts, useAccountMappings, useCreateAccount } from "@/hooks/queries/useChartOfAccounts";
import { Plus, Search, FolderTree, Link as LinkIcon, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [{ title: "Chart of Accounts · ValGrow Business OS" }],
  }),
  component: ChartOfAccountsPage,
});

function ChartOfAccountsPage() {
  const { data: accounts, isLoading } = useChartOfAccounts();
  const { data: mappings } = useAccountMappings();
  const createAccountMutation = useCreateAccount();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    accountCode: "",
    accountName: "",
    accountType: "ASSET",
    accountCategory: "CURRENT_ASSET",
    normalBalance: "DEBIT",
    description: "",
  });

  const filteredAccounts = accounts?.filter(
    (a) =>
      a.accountCode.toLowerCase().includes(search.toLowerCase()) ||
      a.accountName.toLowerCase().includes(search.toLowerCase()),
  ) || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate(formData, {
      onSuccess: () => {
        setShowCreate(false);
        setFormData({
          accountCode: "",
          accountName: "",
          accountType: "ASSET",
          accountCategory: "CURRENT_ASSET",
          normalBalance: "DEBIT",
          description: "",
        });
      },
    });
  };

  return (
    <AppShell>
      <PageHeader
        title="Chart of Accounts & System Mappings"
        description="Master General Ledger Account hierarchy and operational event mapping rules."
        eyebrow="General Ledger Configuration"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" /> Add Account
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-6 border-primary/20 bg-accent/10">
          <CardHeader>
            <CardTitle>Create New GL Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Code</label>
                <Input
                  required
                  placeholder="e.g. 1060"
                  value={formData.accountCode}
                  onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Name</label>
                <Input
                  required
                  placeholder="e.g. Petty Cash Vault"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Type</label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 py-2 text-sm"
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                >
                  <option value="ASSET">ASSET</option>
                  <option value="LIABILITY">LIABILITY</option>
                  <option value="EQUITY">EQUITY</option>
                  <option value="REVENUE">REVENUE</option>
                  <option value="EXPENSE">EXPENSE</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Category</label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 py-2 text-sm"
                  value={formData.accountCategory}
                  onChange={(e) => setFormData({ ...formData, accountCategory: e.target.value })}
                >
                  <option value="CURRENT_ASSET">CURRENT_ASSET</option>
                  <option value="FIXED_ASSET">FIXED_ASSET</option>
                  <option value="CURRENT_LIABILITY">CURRENT_LIABILITY</option>
                  <option value="EQUITY">EQUITY</option>
                  <option value="OPERATING_REVENUE">OPERATING_REVENUE</option>
                  <option value="COST_OF_GOODS_SOLD">COST_OF_GOODS_SOLD</option>
                  <option value="OPERATING_EXPENSE">OPERATING_EXPENSE</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Normal Balance</label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 py-2 text-sm"
                  value={formData.normalBalance}
                  onChange={(e) => setFormData({ ...formData, normalBalance: e.target.value })}
                >
                  <option value="DEBIT">DEBIT</option>
                  <option value="CREDIT">CREDIT</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Description</label>
                <Input
                  placeholder="Optional notes"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAccountMutation.isPending}>
                  {createAccountMutation.isPending ? "Creating..." : "Save Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="chart">
        <TabsList className="mb-4">
          <TabsTrigger value="chart" className="gap-2">
            <FolderTree className="h-4 w-4" /> Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="mappings" className="gap-2">
            <LinkIcon className="h-4 w-4" /> System Event Mappings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <div className="mb-4 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search account code or name..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredAccounts.length} accounts found</span>
          </div>

          <div className="rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Normal Balance</th>
                  <th className="px-4 py-3">System</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Loading Chart of Accounts...
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-accent/5">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{acc.accountCode}</td>
                      <td className="px-4 py-3 font-medium">{acc.accountName}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{acc.accountType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{acc.accountCategory}</td>
                      <td className="px-4 py-3">
                        <Badge variant={acc.normalBalance === "DEBIT" ? "default" : "secondary"}>
                          {acc.normalBalance}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {acc.isSystemAccount ? (
                          <Badge variant="outline" className="gap-1 border-success/30 text-success">
                            <CheckCircle2 className="h-3 w-3" /> System
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Custom</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="mappings">
          <div className="rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Mapping Key</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Mapped GL Account</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mappings?.map((map) => (
                  <tr key={map.id} className="hover:bg-accent/5">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{map.mappingKey}</td>
                    <td className="px-4 py-3 text-muted-foreground">{map.description || "-"}</td>
                    <td className="px-4 py-3">
                      {map.account ? (
                        <span className="font-mono text-sm font-medium">
                          {map.account.accountCode} - {map.account.accountName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Unmapped</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
