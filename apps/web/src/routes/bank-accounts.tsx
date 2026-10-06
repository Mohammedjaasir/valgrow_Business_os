import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBankAccounts, useCreateBankAccount, useBankReconciliations, useCreateBankReconciliation } from "@/hooks/queries/useBankAccounts";
import { useChartOfAccounts } from "@/hooks/queries/useChartOfAccounts";
import { Plus, Building2, CheckCircle2, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/bank-accounts")({
  head: () => ({
    meta: [{ title: "Bank Accounts & Treasury · ValGrow Business OS" }],
  }),
  component: BankAccountsPage,
});

function BankAccountsPage() {
  const { data: bankAccounts, isLoading } = useBankAccounts();
  const { data: accounts } = useChartOfAccounts();
  const { data: reconciliations } = useBankReconciliations();

  const createBankMutation = useCreateBankAccount();
  const createReconcileMutation = useCreateBankReconciliation();

  const [showCreateBank, setShowCreateBank] = useState(false);
  const [showCreateReconcile, setShowCreateReconcile] = useState(false);

  const [bankForm, setBankForm] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    ifscCode: "",
    swiftCode: "",
    accountType: "CURRENT",
    accountId: "",
  });

  const [reconcileForm, setReconcileForm] = useState({
    bankAccountId: "",
    statementDate: new Date().toISOString().split("T")[0],
    endingBalance: 0,
    notes: "",
  });

  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault();
    createBankMutation.mutate(bankForm, {
      onSuccess: () => {
        setShowCreateBank(false);
        setBankForm({
          accountName: "",
          accountNumber: "",
          bankName: "",
          branchName: "",
          ifscCode: "",
          swiftCode: "",
          accountType: "CURRENT",
          accountId: "",
        });
      },
    });
  };

  const handleCreateReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    createReconcileMutation.mutate({
      bankAccountId: reconcileForm.bankAccountId,
      statementDate: reconcileForm.statementDate || new Date().toISOString().slice(0, 10),
      endingBalance: reconcileForm.endingBalance,
      notes: reconcileForm.notes,
    }, {
      onSuccess: () => {
        setShowCreateReconcile(false);
        setReconcileForm({
          bankAccountId: "",
          statementDate: new Date().toISOString().split("T")[0],
          endingBalance: 0,
          notes: "",
        });
      },
    });
  };

  return (
    <AppShell>
      <PageHeader
        title="Bank Accounts & Treasury"
        description="Manage corporate bank accounts, cash registers, and automated statement reconciliation."
        eyebrow="Treasury & Cash Management"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreateReconcile(!showCreateReconcile)}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reconcile Statement
            </Button>
            <Button onClick={() => setShowCreateBank(!showCreateBank)}>
              <Plus className="mr-2 h-4 w-4" /> Add Bank Account
            </Button>
          </div>
        }
      />

      {showCreateBank && (
        <Card className="mb-6 border-primary/20 bg-accent/10">
          <CardHeader>
            <CardTitle>Create Bank Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBank} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Name</label>
                <Input
                  required
                  placeholder="e.g. HDFC Operating Account"
                  value={bankForm.accountName}
                  onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Number</label>
                <Input
                  required
                  placeholder="50200012345678"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Bank Name</label>
                <Input
                  required
                  placeholder="HDFC Bank"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">IFSC Code</label>
                <Input
                  placeholder="HDFC0000123"
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Linked GL Account</label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 py-2 text-sm"
                  value={bankForm.accountId}
                  onChange={(e) => setBankForm({ ...bankForm, accountId: e.target.value })}
                  required
                >
                  <option value="">Select GL Account...</option>
                  {accounts?.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountCode} - {acc.accountName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Type</label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 py-2 text-sm"
                  value={bankForm.accountType}
                  onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                >
                  <option value="CURRENT">CURRENT</option>
                  <option value="SAVINGS">SAVINGS</option>
                  <option value="OVERDRAFT">OVERDRAFT</option>
                  <option value="CREDIT_CARD">CREDIT_CARD</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateBank(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBankMutation.isPending}>
                  Save Bank Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showCreateReconcile && (
        <Card className="mb-6 border-primary/20 bg-accent/10">
          <CardHeader>
            <CardTitle>Reconcile Bank Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateReconcile} className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Bank Account</label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 py-2 text-sm"
                  value={reconcileForm.bankAccountId}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, bankAccountId: e.target.value })}
                  required
                >
                  <option value="">Select Bank Account...</option>
                  {bankAccounts?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber} ({b.accountName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Statement Date</label>
                <Input
                  type="date"
                  required
                  value={reconcileForm.statementDate}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, statementDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Statement Ending Balance ₹</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={reconcileForm.endingBalance || ""}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, endingBalance: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateReconcile(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createReconcileMutation.isPending}>
                  Run Reconciliation Match
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="accounts">
        <TabsList className="mb-4">
          <TabsTrigger value="accounts" className="gap-2">
            <Building2 className="h-4 w-4" /> Bank Accounts
          </TabsTrigger>
          <TabsTrigger value="reconciliations" className="gap-2">
            <RotateCcw className="h-4 w-4" /> Statement Reconciliations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full py-8 text-center text-muted-foreground">Loading Bank Accounts...</div>
            ) : bankAccounts?.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground">No Bank Accounts configured.</div>
            ) : (
              bankAccounts?.map((b) => (
                <Card key={b.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base">{b.accountName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{b.bankName} • {b.accountNumber}</p>
                    </div>
                    <Badge variant="outline">{b.accountType}</Badge>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div>IFSC: <span className="font-mono text-foreground font-medium">{b.ifscCode || "N/A"}</span></div>
                      <div>GL Account: <span className="font-mono text-foreground font-medium">{b.account?.accountCode} ({b.account?.accountName})</span></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="reconciliations">
          <div className="rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Statement Date</th>
                  <th className="px-4 py-3">Bank Account</th>
                  <th className="px-4 py-3 text-right">Statement Balance</th>
                  <th className="px-4 py-3 text-right">GL Cleared Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reconciliations?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No reconciliations performed.
                    </td>
                  </tr>
                ) : (
                  reconciliations?.map((r) => (
                    <tr key={r.id} className="hover:bg-accent/5">
                      <td className="px-4 py-3">{new Date(r.statementDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium">{r.bankAccount?.accountName}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">₹{Number(r.endingBalance).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">₹{Number(r.clearedBalance).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        {r.isReconciled ? (
                          <Badge variant="outline" className="gap-1 border-success/30 text-success">
                            <CheckCircle2 className="h-3 w-3" /> RECONCILED
                          </Badge>
                        ) : (
                          <Badge variant="destructive">UNMATCHED DIFFERENCE</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
