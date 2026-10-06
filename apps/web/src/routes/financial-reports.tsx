import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTrialBalance, useProfitAndLoss, useBalanceSheet, useGeneralLedgerDetail } from "@/hooks/queries/useFinancialReports";
import { useChartOfAccounts } from "@/hooks/queries/useChartOfAccounts";
import { Scale, PieChart, FileSpreadsheet, ListTree, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/financial-reports")({
  head: () => ({
    meta: [{ title: "Financial Reports · ValGrow Business OS" }],
  }),
  component: FinancialReportsPage,
});

function FinancialReportsPage() {
  const { data: tbData, isLoading: tbLoading } = useTrialBalance();
  const { data: pnlData, isLoading: pnlLoading } = useProfitAndLoss();
  const { data: bsData } = useBalanceSheet();
  const { data: accounts } = useChartOfAccounts();

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const { data: glData } = useGeneralLedgerDetail(selectedAccountId);

  return (
    <AppShell>
      <PageHeader
        title="Financial Statements & Reports"
        description="Real-time Trial Balance, Income Statement (P&L), Balance Sheet, and General Ledger Audit."
        eyebrow="Financial Intelligence"
      />

      <Tabs defaultValue="trial-balance">
        <TabsList className="mb-4">
          <TabsTrigger value="trial-balance" className="gap-2">
            <Scale className="h-4 w-4" /> Trial Balance
          </TabsTrigger>
          <TabsTrigger value="pnl" className="gap-2">
            <PieChart className="h-4 w-4" /> Profit & Loss
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="gl" className="gap-2">
            <ListTree className="h-4 w-4" /> General Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Trial Balance</CardTitle>
                <p className="text-xs text-muted-foreground">As of {new Date().toLocaleDateString()}</p>
              </div>
              <div>
                {tbData?.totals.balanced ? (
                  <Badge variant="outline" className="gap-1 border-success/30 text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Debit = Credit (Balanced)
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Mismatch
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Account Code</th>
                      <th className="px-4 py-3">Account Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Debit ₹</th>
                      <th className="px-4 py-3 text-right">Credit ₹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tbLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          Loading Trial Balance...
                        </td>
                      </tr>
                    ) : tbData?.rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No accounting activity recorded.
                        </td>
                      </tr>
                    ) : (
                      tbData?.rows.map((row) => (
                        <tr key={row.account.id} className="hover:bg-accent/5">
                          <td className="px-4 py-3 font-mono font-bold text-primary">{row.account.accountCode}</td>
                          <td className="px-4 py-3 font-medium">{row.account.accountName}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{row.account.accountType}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {row.debit > 0 ? `₹${row.debit.toLocaleString("en-IN")}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {row.credit > 0 ? `₹${row.credit.toLocaleString("en-IN")}` : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="border-t bg-muted/30 font-bold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 uppercase text-xs">Total Trial Balance</td>
                      <td className="px-4 py-3 text-right font-mono">₹{tbData?.totals.totalDebit.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-mono">₹{tbData?.totals.totalCredit.toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement (Income Statement)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {pnlLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading Profit & Loss...</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase text-primary border-b pb-1">Operating Revenue</h3>
                    {pnlData?.revenue.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span>{i.accountCode} - {i.accountName}</span>
                        <span className="font-mono">₹{i.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm border-t pt-1">
                      <span>Total Revenue</span>
                      <span className="font-mono">₹{pnlData?.revenue.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase text-warning border-b pb-1">Cost of Goods Sold (COGS)</h3>
                    {pnlData?.cogs.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span>{i.accountCode} - {i.accountName}</span>
                        <span className="font-mono">₹{i.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm border-t pt-1">
                      <span>Total COGS</span>
                      <span className="font-mono text-warning">₹{pnlData?.cogs.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-extrabold text-base bg-accent/20 p-3 rounded-md">
                    <span>GROSS PROFIT</span>
                    <span className="font-mono">₹{pnlData?.grossProfit.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase text-destructive border-b pb-1">Operating Expenses</h3>
                    {pnlData?.operatingExpenses.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span>{i.accountCode} - {i.accountName}</span>
                        <span className="font-mono">₹{i.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm border-t pt-1">
                      <span>Total Operating Expenses</span>
                      <span className="font-mono text-destructive">₹{pnlData?.operatingExpenses.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-extrabold text-lg bg-success-soft text-success p-4 rounded-md border border-success/30">
                    <span>NET OPERATING PROFIT</span>
                    <span className="font-mono">₹{pnlData?.netProfit.toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Balance Sheet</CardTitle>
                <p className="text-xs text-muted-foreground">Assets = Liabilities + Equity</p>
              </div>
              <Badge variant={bsData?.isBalanced ? "outline" : "destructive"}>
                {bsData?.isBalanced ? "BALANCED" : "UNBALANCED"}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase border-b pb-1 text-primary">Assets</h3>
                {bsData?.assets.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{i.accountCode} - {i.accountName}</span>
                    <span className="font-mono">₹{i.balance.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base border-t pt-2 bg-accent/10 p-2 rounded">
                  <span>TOTAL ASSETS</span>
                  <span className="font-mono">₹{bsData?.assets.total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase border-b pb-1 text-primary">Liabilities & Equity</h3>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Liabilities</div>
                {bsData?.liabilities.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{i.accountCode} - {i.accountName}</span>
                    <span className="font-mono">₹{i.balance.toLocaleString("en-IN")}</span>
                  </div>
                ))}

                <div className="text-xs font-semibold uppercase text-muted-foreground pt-2">Equity & Retained Earnings</div>
                {bsData?.equity.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{i.accountCode} - {i.accountName}</span>
                    <span className="font-mono">₹{i.balance.toLocaleString("en-IN")}</span>
                  </div>
                ))}

                <div className="flex justify-between font-bold text-base border-t pt-2 bg-accent/10 p-2 rounded">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="font-mono">₹{bsData?.totalLiabilitiesAndEquity.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>General Ledger Detail</CardTitle>
              <select
                className="h-10 rounded-md border bg-background px-3 py-2 text-sm w-72"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">Select Account for Ledger...</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountCode} - {a.accountName}
                  </option>
                ))}
              </select>
            </CardHeader>
            <CardContent>
              {!selectedAccountId ? (
                <div className="py-8 text-center text-muted-foreground">Please select an account above to view General Ledger lines.</div>
              ) : (
                <div className="rounded-lg border bg-card">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Journal No</th>
                        <th className="px-4 py-3">Module</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Debit ₹</th>
                        <th className="px-4 py-3 text-right">Credit ₹</th>
                        <th className="px-4 py-3 text-right">Running Balance ₹</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {glData?.lines.map((l) => (
                        <tr key={l.lineId} className="hover:bg-accent/5">
                          <td className="px-4 py-3">{new Date(l.postingDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-mono font-bold text-primary">{l.journalNumber}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{l.sourceModule || "GL"}</Badge></td>
                          <td className="px-4 py-3">{l.description || "-"}</td>
                          <td className="px-4 py-3 text-right font-mono">{l.debit > 0 ? `₹${l.debit.toLocaleString("en-IN")}` : "-"}</td>
                          <td className="px-4 py-3 text-right font-mono">{l.credit > 0 ? `₹${l.credit.toLocaleString("en-IN")}` : "-"}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold">₹{l.runningBalance.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
