import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChartOfAccounts } from "@/hooks/queries/useChartOfAccounts";
import { useJournalEntries } from "@/hooks/queries/useJournalEntries";
import { useProfitAndLoss, useTrialBalance } from "@/hooks/queries/useFinancialReports";
import { useTaxSummary } from "@/hooks/queries/useTaxReports";
import {
  FolderTree,
  ScrollText,
  Building2,
  BarChart3,
  Receipt,
  CreditCard,
  ArrowRight,
} from "lucide-react";

const title = "Accounting & Finance Dashboard";
const description = "Double-entry General Ledger, Chart of Accounts, Sub-ledgers, and Financial Reporting.";

export const Route = createFileRoute("/accounting")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: AccountingDashboardPage,
});

function AccountingDashboardPage() {
  const { data: coaData, isLoading: coaLoading } = useChartOfAccounts();
  const { data: jeData, isLoading: jeLoading } = useJournalEntries();
  const { data: pnlData, isLoading: pnlLoading } = useProfitAndLoss();
  const { data: tbData } = useTrialBalance();
  const { data: taxData } = useTaxSummary();

  const stats = [
    {
      label: "Active Accounts (COA)",
      value: coaLoading ? "…" : String(coaData?.filter((a) => a.isActive).length || 0),
      hint: "Total Accounts in Ledger",
    },
    {
      label: "Posted Journal Entries",
      value: jeLoading ? "…" : String(jeData?.filter((j) => j.status === "POSTED").length || 0),
      hint: "Double-entry transactions",
    },
    {
      label: "Net Profit (Current)",
      value: pnlLoading ? "…" : `₹${(pnlData?.netProfit || 0).toLocaleString("en-IN")}`,
      hint: `Revenue: ₹${(pnlData?.revenue.total || 0).toLocaleString("en-IN")}`,
    },
    {
      label: "Net Tax Payable",
      value: taxData ? `₹${(taxData.netTaxPayable || 0).toLocaleString("en-IN")}` : "…",
      hint: `Output: ₹${(taxData?.totalOutputTaxCollected || 0).toLocaleString("en-IN")}`,
    },
  ];

  return (
    <AppShell>
      <PageHeader guide="accounting" title={title} description={description} eyebrow="General Ledger & Financial Accounting" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            hint={s.hint}
            tone={i === 2 ? "brand" : "default"}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <FolderTree className="h-5 w-5 text-primary" />
              <Badge variant="outline">General Ledger</Badge>
            </div>
            <CardTitle className="mt-2">Chart of Accounts</CardTitle>
            <CardDescription>
              Structured hierarchy of Assets, Liabilities, Equity, Revenue, and Expenses.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {coaData?.length || 0} Accounts Configured
            </span>
            <Button asChild size="sm" variant="ghost">
              <Link to="/accounts">
                View COA <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <ScrollText className="h-5 w-5 text-primary" />
              <Badge variant="outline">Double Entry</Badge>
            </div>
            <CardTitle className="mt-2">Journal Entries</CardTitle>
            <CardDescription>
              Audit-proven GL postings from Sales, POS, Purchasing, and Manual Adjustments.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {jeData?.length || 0} Posted Journals
            </span>
            <Button asChild size="sm" variant="ghost">
              <Link to="/journal-entries">
                View Journals <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <BarChart3 className="h-5 w-5 text-primary" />
              <Badge variant="outline">Reporting Engine</Badge>
            </div>
            <CardTitle className="mt-2">Financial Reports</CardTitle>
            <CardDescription>
              Trial Balance, Profit & Loss (Income Statement), and Balance Sheet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {tbData?.totals.balanced ? "Balanced GL" : "Unbalanced"}
            </span>
            <Button asChild size="sm" variant="ghost">
              <Link to="/financial-reports">
                View Reports <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Receipt className="h-5 w-5 text-primary" />
              <Badge variant="outline">AR Sub-Ledger</Badge>
            </div>
            <CardTitle className="mt-2">Accounts Receivable</CardTitle>
            <CardDescription>
              Track customer balances, aging schedules (1-90+ days), and account statements.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Customer Debtors</span>
            <Button asChild size="sm" variant="ghost">
              <Link to="/accounts-receivable">
                View AR <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CreditCard className="h-5 w-5 text-primary" />
              <Badge variant="outline">AP Sub-Ledger</Badge>
            </div>
            <CardTitle className="mt-2">Accounts Payable</CardTitle>
            <CardDescription>
              Monitor supplier payables, vendor aging analysis, and payment ledgers.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Vendor Creditors</span>
            <Button asChild size="sm" variant="ghost">
              <Link to="/accounts-payable">
                View AP <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Building2 className="h-5 w-5 text-primary" />
              <Badge variant="outline">Treasury</Badge>
            </div>
            <CardTitle className="mt-2">Bank & Cash Accounts</CardTitle>
            <CardDescription>
              Bank accounts, cash registers, and automated statement reconciliation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Bank Balances</span>
            <Button asChild size="sm" variant="ghost">
              <Link to="/bank-accounts">
                View Treasury <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
