import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCustomerBalances, useCustomerAging, useCustomerStatement } from "@/hooks/queries/useArSubledger";
import { Calendar, UserCheck, FileText } from "lucide-react";

export const Route = createFileRoute("/accounts-receivable")({
  head: () => ({
    meta: [{ title: "Accounts Receivable · ValGrow Business OS" }],
  }),
  component: AccountsReceivablePage,
});

function AccountsReceivablePage() {
  const { data: balances, isLoading: balLoading } = useCustomerBalances();
  const { data: aging } = useCustomerAging();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { data: statement } = useCustomerStatement(selectedCustomerId || "", undefined, undefined);

  return (
    <AppShell>
      <PageHeader
        title="Accounts Receivable (AR)"
        description="Customer debtor balances, aging buckets (1-90+ days), and ledger statements."
        eyebrow="Receivables Management"
      />

      <Tabs defaultValue="balances">
        <TabsList className="mb-4">
          <TabsTrigger value="balances" className="gap-2">
            <UserCheck className="h-4 w-4" /> Customer Balances
          </TabsTrigger>
          <TabsTrigger value="aging" className="gap-2">
            <Calendar className="h-4 w-4" /> AR Aging Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <div className="rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Customer Code</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-right">Total Outstanding Balance</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {balLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Loading Customer Balances...
                    </td>
                  </tr>
                ) : balances?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No customer balances recorded.
                    </td>
                  </tr>
                ) : (
                  balances?.map((b) => (
                    <tr key={b.customer.id} className="hover:bg-accent/5">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{b.customer.customerCode}</td>
                      <td className="px-4 py-3 font-medium">{b.customer.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.customer.email || b.customer.phone || "-"}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        ₹{Number(b.totalOutstanding).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-xs text-primary hover:underline flex items-center font-medium"
                          onClick={() => setSelectedCustomerId(b.customer.id)}
                        >
                          <FileText className="mr-1 h-3 w-3" /> View Statement
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedCustomerId && statement && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Customer Statement — {statement.customer.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border text-sm">
                  <table className="w-full text-left">
                    <thead className="border-b bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Reference</th>
                        <th className="px-4 py-2 text-right">Debit (Invoice)</th>
                        <th className="px-4 py-2 text-right">Credit (Payment)</th>
                        <th className="px-4 py-2 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {statement.transactions.map((tx, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2">
                            <Badge variant={tx.type === "INVOICE" ? "outline" : "default"}>{tx.type}</Badge>
                          </td>
                          <td className="px-4 py-2 font-mono">{tx.reference}</td>
                          <td className="px-4 py-2 text-right font-mono">{tx.debit > 0 ? `₹${tx.debit.toLocaleString("en-IN")}` : "-"}</td>
                          <td className="px-4 py-2 text-right font-mono">{tx.credit > 0 ? `₹${tx.credit.toLocaleString("en-IN")}` : "-"}</td>
                          <td className="px-4 py-2 text-right font-mono font-bold">₹{tx.runningBalance.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="aging">
          {aging && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-5">
                <Card>
                  <CardHeader className="py-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Current</span>
                    <span className="text-xl font-bold">₹{aging.summary.current.toLocaleString("en-IN")}</span>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">1 - 30 Days</span>
                    <span className="text-xl font-bold">₹{aging.summary.days1To30.toLocaleString("en-IN")}</span>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">31 - 60 Days</span>
                    <span className="text-xl font-bold text-warning">₹{aging.summary.days31To60.toLocaleString("en-IN")}</span>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">61 - 90 Days</span>
                    <span className="text-xl font-bold text-destructive/80">₹{aging.summary.days61To90.toLocaleString("en-IN")}</span>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">&gt; 90 Days</span>
                    <span className="text-xl font-bold text-destructive">₹{aging.summary.daysOver90.toLocaleString("en-IN")}</span>
                  </CardHeader>
                </Card>
              </div>

              <div className="rounded-lg border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3 text-right">Current</th>
                      <th className="px-4 py-3 text-right">1-30 Days</th>
                      <th className="px-4 py-3 text-right">31-60 Days</th>
                      <th className="px-4 py-3 text-right">61-90 Days</th>
                      <th className="px-4 py-3 text-right">&gt; 90 Days</th>
                      <th className="px-4 py-3 text-right">Total Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {aging.customers.map((c) => (
                      <tr key={c.customer.id} className="hover:bg-accent/5">
                        <td className="px-4 py-3 font-medium">{c.customer.name} ({c.customer.customerCode})</td>
                        <td className="px-4 py-3 text-right font-mono">₹{c.current.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{c.days1To30.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-mono text-warning">₹{c.days31To60.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-mono text-destructive/80">₹{c.days61To90.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-mono text-destructive">₹{c.daysOver90.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">₹{c.total.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
