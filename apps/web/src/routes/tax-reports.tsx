import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTaxSummary } from "@/hooks/queries/useTaxReports";
import { Calculator } from "lucide-react";

export const Route = createFileRoute("/tax-reports")({
  head: () => ({
    meta: [{ title: "Tax Summary · ValGrow Business OS" }],
  }),
  component: TaxReportsPage,
});

function TaxReportsPage() {
  const { data: taxData, isLoading } = useTaxSummary();

  return (
    <AppShell>
      <PageHeader
        title="Tax Liability & Input Credit Summary"
        description="Output Tax (GST/VAT collected on Sales) vs Input Tax Credit (ITC claimed on Purchases)."
        eyebrow="Tax Compliance"
      />

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading Tax Summary...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Output Tax Collected (Sales & POS)</CardTitle>
                <Calculator className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="text-3xl font-extrabold font-mono">
                ₹{(taxData?.totalOutputTaxCollected || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-muted-foreground">Total tax collected on sales invoices and retail transactions.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Input Tax Credit Claimed (Purchases)</CardTitle>
                <Calculator className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="text-3xl font-extrabold font-mono text-success">
                ₹{(taxData?.totalInputTaxClaimed || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-muted-foreground">Eligible Input Tax Credit (ITC) paid on vendor invoices.</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-primary/20 bg-accent/10">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Net Tax Settlement Position</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {taxData?.netTaxPayable && taxData.netTaxPayable > 0 ? "Net Payable to Tax Authority" : "Net Carry-forward Credit"}
                </div>
                <div className="text-4xl font-extrabold font-mono text-primary mt-1">
                  ₹
                  {taxData?.netTaxPayable && taxData.netTaxPayable > 0
                    ? taxData.netTaxPayable.toLocaleString("en-IN")
                    : (taxData?.netTaxRefundable || 0).toLocaleString("en-IN")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
