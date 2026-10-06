import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePurchaseRequests } from "@/hooks/queries/usePurchaseRequests";
import { usePurchaseOrders } from "@/hooks/queries/usePurchaseOrders";
import { useGoodsReceipts } from "@/hooks/queries/useGoodsReceipts";
import { useSupplierInvoices } from "@/hooks/queries/useSupplierInvoices";
import { useSuppliers } from "@/hooks/queries/useSuppliers";
import {
  ShoppingCart,
  Contact,
  ScrollText,
  ShoppingBag,
  PackageCheck,
  Receipt,
  CreditCard,
  Plus,
  ArrowRight,
} from "lucide-react";

const title = "Purchasing Dashboard";
const description =
  "Operational procurement overview, active purchase orders, receiving, and supplier payables.";

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: PurchasingDashboardPage,
});

function PurchasingDashboardPage() {
  const { data: prData, isLoading: prLoading } = usePurchaseRequests();
  const { data: poData, isLoading: poLoading } = usePurchaseOrders();
  const { data: grnData, isLoading: grnLoading } = useGoodsReceipts();
  const { data: invData, isLoading: invLoading } = useSupplierInvoices();
  const { data: supData, isLoading: supLoading } = useSuppliers();

  const pendingPRs = prData?.filter((p) => p.status === "SUBMITTED" || p.status === "DRAFT") || [];
  const openPOs =
    poData?.filter((p) =>
      ["SUBMITTED", "APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(p.status),
    ) || [];
  const postedGRNs = grnData?.filter((g) => g.status === "POSTED") || [];
  const unpaidInvoices =
    invData?.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED") || [];

  const totalPayable = unpaidInvoices.reduce(
    (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
    0,
  );

  const stats = [
    {
      label: "Pending Requests",
      value: prLoading ? "…" : String(pendingPRs.length),
      hint: `${prData?.filter((p) => p.status === "APPROVED").length || 0} approved PRs`,
    },
    {
      label: "Active Purchase Orders",
      value: poLoading ? "…" : String(openPOs.length),
      hint: `${poData?.filter((p) => p.status === "SENT").length || 0} sent to suppliers`,
    },
    {
      label: "Goods Receipts (Posted)",
      value: grnLoading ? "…" : String(postedGRNs.length),
      hint: "Stock movements processed",
    },
    {
      label: "Total Amount Payable",
      value: invLoading ? "…" : `₹${totalPayable.toLocaleString("en-IN")}`,
      hint: `${unpaidInvoices.length} outstanding invoices`,
    },
  ];

  return (
    <AppShell>
      <PageHeader guide="purchasing"
        title={title}
        description={description}
        eyebrow="Procurement & Inbound Operations"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            hint={s.hint}
            tone={i === 0 ? "brand" : "default"}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Quick Actions */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Procurement Quick Actions</CardTitle>
            <CardDescription>
              Direct navigation and workflow shortcuts for purchasing teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/suppliers">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-2 p-4 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <Contact className="h-5 w-5 text-primary" />
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Suppliers</div>
                  <div className="text-xs text-muted-foreground">
                    {supData?.length || 0} vendors registered
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/purchase-requests">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-2 p-4 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <ScrollText className="h-5 w-5 text-primary" />
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Purchase Requests</div>
                  <div className="text-xs text-muted-foreground">
                    {prData?.length || 0} total requests
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/purchase-orders">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-2 p-4 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Purchase Orders</div>
                  <div className="text-xs text-muted-foreground">
                    {poData?.length || 0} total orders
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/goods-receipts">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-2 p-4 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <PackageCheck className="h-5 w-5 text-primary" />
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Goods Receipts</div>
                  <div className="text-xs text-muted-foreground">
                    {grnData?.length || 0} GRN records
                  </div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Active Purchase Orders */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Purchase Orders</CardTitle>
              <CardDescription>Latest orders across all statuses</CardDescription>
            </div>
            <Link to="/purchase-orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {poData && poData.length > 0 ? (
              <div className="space-y-4">
                {poData.slice(0, 5).map((po) => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between border-b pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium text-foreground">{po.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {po.supplier?.name || "Supplier N/A"} • {po.items.length} items
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        ₹{Number(po.totalAmount).toLocaleString("en-IN")}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {po.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No purchase orders found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payables Summary</CardTitle>
            <CardDescription>Invoices & Supplier Payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Total Invoiced</span>
              <span className="font-semibold">
                ₹
                {invData?.reduce((s, i) => s + Number(i.totalAmount), 0).toLocaleString("en-IN") ||
                  0}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold text-success">
                ₹
                {invData?.reduce((s, i) => s + Number(i.paidAmount), 0).toLocaleString("en-IN") ||
                  0}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Outstanding Balance</span>
              <span className="font-semibold text-warning">
                ₹{totalPayable.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="pt-2 flex gap-2">
              <Link to="/supplier-invoices" className="flex-1">
                <Button variant="outline" className="w-full text-xs">
                  <Receipt className="mr-1 h-3.5 w-3.5" /> Invoices
                </Button>
              </Link>
              <Link to="/supplier-payments" className="flex-1">
                <Button variant="outline" className="w-full text-xs">
                  <CreditCard className="mr-1 h-3.5 w-3.5" /> Payments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
