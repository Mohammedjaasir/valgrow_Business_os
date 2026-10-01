import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { downloadFile } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BarChart3,
  Download,
  Filter,
  Search,
  Users,
  Boxes,
  ShoppingCart,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  Layers,
} from "lucide-react";
import {
  useSalesReport,
  useCustomerReport,
  useInventoryMovementReport,
  exportReportToCsv,
} from "@/hooks/queries/useReports";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useBranches } from "@/hooks/queries/useBranches";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useLocations } from "@/hooks/queries/useLocations";

const title = "Business Intelligence & Reports";
const description =
  "Comprehensive financial, customer sales performance, and immutable stock movement audit reports.";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"sales" | "customers" | "inventory">("sales");

  // Masters
  const { data: customers = [] } = useCustomers();
  const { data: branches = [] } = useBranches();
  const { data: warehouses = [] } = useWarehouses();

  // ───────────────────────────────────────────────────────────────────────────
  // 1. SALES REPORT STATE & HOOKS
  // ───────────────────────────────────────────────────────────────────────────
  const [salesDateFrom, setSalesDateFrom] = useState("");
  const [salesDateTo, setSalesDateTo] = useState("");
  const [salesCustomerId, setSalesCustomerId] = useState("ALL");
  const [salesBranchId, setSalesBranchId] = useState("ALL");
  const [salesPaymentMethod, setSalesPaymentMethod] = useState("ALL");
  const [salesSearch, setSalesSearch] = useState("");

  const salesFilters = {
    dateFrom: salesDateFrom || undefined,
    dateTo: salesDateTo || undefined,
    customerId: salesCustomerId !== "ALL" ? salesCustomerId : undefined,
    branchId: salesBranchId !== "ALL" ? salesBranchId : undefined,
    paymentMethod: salesPaymentMethod !== "ALL" ? salesPaymentMethod : undefined,
    search: salesSearch || undefined,
  };

  const { data: salesReport, isLoading: isSalesLoading } = useSalesReport(salesFilters);

  const handleExportSales = async (format: "csv" | "xlsx" = "csv") => {
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      if (salesDateFrom) params.append("dateFrom", salesDateFrom);
      if (salesDateTo) params.append("dateTo", salesDateTo);
      if (salesCustomerId !== "ALL") params.append("customerId", salesCustomerId);
      if (salesBranchId !== "ALL") params.append("branchId", salesBranchId);
      if (salesPaymentMethod !== "ALL") params.append("paymentMethod", salesPaymentMethod);
      if (salesSearch) params.append("search", salesSearch);

      const todayStr = new Date().toISOString().split("T")[0];
      await downloadFile(
        `/reports/sales/export?${params.toString()}`,
        `sales-report-${todayStr}.${format}`,
      );
    } catch (err: any) {
      alert(err.message || "Failed to export sales report");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CUSTOMER REPORT STATE & HOOKS
  // ───────────────────────────────────────────────────────────────────────────
  const [custDateFrom, setCustDateFrom] = useState("");
  const [custDateTo, setCustDateTo] = useState("");
  const [custCustomerId, setCustCustomerId] = useState("ALL");
  const [custSearch, setCustSearch] = useState("");

  const custFilters = {
    dateFrom: custDateFrom || undefined,
    dateTo: custDateTo || undefined,
    customerId: custCustomerId !== "ALL" ? custCustomerId : undefined,
    search: custSearch || undefined,
  };

  const { data: customerReport, isLoading: isCustLoading } = useCustomerReport(custFilters);

  const handleExportCustomers = () => {
    if (!customerReport?.customers) return;
    const headers = [
      "Customer Code",
      "Customer Name",
      "Email",
      "Phone",
      "City",
      "Total Orders",
      "Total Purchases (₹)",
      "Total Paid (₹)",
      "Outstanding Balance (₹)",
      "Last Purchase Date",
      "Status",
    ];
    const rows = customerReport.customers.map((c) => [
      c.customerCode,
      c.name,
      c.email,
      c.phone,
      c.city,
      c.totalOrders,
      c.totalPurchases,
      c.totalPaid,
      c.outstandingAmount,
      c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString("en-IN") : "Never",
      c.status,
    ]);
    exportReportToCsv("Customer_Report", headers, rows);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 3. INVENTORY MOVEMENT REPORT STATE & HOOKS
  // ───────────────────────────────────────────────────────────────────────────
  const [invDateFrom, setInvDateFrom] = useState("");
  const [invDateTo, setInvDateTo] = useState("");
  const [invWarehouseId, setInvWarehouseId] = useState("ALL");
  const [invLocationId, setInvLocationId] = useState("ALL");
  const [invMovementType, setInvMovementType] = useState("ALL");
  const [invSearch, setInvSearch] = useState("");
  const [invPage, setInvPage] = useState(1);

  const { data: locations = [] } = useLocations(invWarehouseId !== "ALL" ? invWarehouseId : undefined);

  const invFilters = {
    dateFrom: invDateFrom || undefined,
    dateTo: invDateTo || undefined,
    warehouseId: invWarehouseId !== "ALL" ? invWarehouseId : undefined,
    locationId: invLocationId !== "ALL" ? invLocationId : undefined,
    movementType: invMovementType !== "ALL" ? invMovementType : undefined,
    search: invSearch || undefined,
    page: invPage,
    limit: 50,
  };

  const { data: invReport, isLoading: isInvLoading } = useInventoryMovementReport(invFilters);

  const handleExportInventory = async (format: "csv" | "xlsx" = "csv") => {
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      if (invDateFrom) params.append("dateFrom", invDateFrom);
      if (invDateTo) params.append("dateTo", invDateTo);
      if (invWarehouseId !== "ALL") params.append("warehouseId", invWarehouseId);
      if (invLocationId !== "ALL") params.append("locationId", invLocationId);
      if (invMovementType !== "ALL") params.append("movementType", invMovementType);
      if (invSearch) params.append("search", invSearch);

      const todayStr = new Date().toISOString().split("T")[0];
      await downloadFile(
        `/reports/inventory-movements/export?${params.toString()}`,
        `inventory-movements-${todayStr}.${format}`,
      );
    } catch (err: any) {
      alert(err.message || "Failed to export inventory movement report");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Intelligence & Auditing"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "sales") handleExportSales("csv");
                else if (activeTab === "customers") handleExportCustomers();
                else handleExportInventory("csv");
              }}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
            {activeTab !== "customers" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (activeTab === "sales") handleExportSales("xlsx");
                  else handleExportInventory("xlsx");
                }}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Export Excel
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Sales Report
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Report
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            Stock Movements
          </TabsTrigger>
        </TabsList>

        {/* ===================================================================
            TAB 1: SALES REPORT
           =================================================================== */}
        <TabsContent value="sales" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">From</Label>
                <Input
                  type="date"
                  value={salesDateFrom}
                  onChange={(e) => setSalesDateFrom(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">To</Label>
                <Input
                  type="date"
                  value={salesDateTo}
                  onChange={(e) => setSalesDateTo(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="w-44">
                <Select value={salesCustomerId} onValueChange={setSalesCustomerId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Customers</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Select value={salesBranchId} onValueChange={setSalesBranchId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Select value={salesPaymentMethod} onValueChange={setSalesPaymentMethod}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Payment Methods</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search receipt / invoice..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSalesDateFrom("");
                  setSalesDateTo("");
                  setSalesCustomerId("ALL");
                  setSalesBranchId("ALL");
                  setSalesPaymentMethod("ALL");
                  setSalesSearch("");
                }}
                className="h-8 text-xs"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Total Revenue"
              value={isSalesLoading ? "…" : `₹${(salesReport?.summary.totalSales || 0).toLocaleString("en-IN")}`}
              hint="Persisted completed sales"
              tone="brand"
            />
            <StatCard
              label="Total Orders"
              value={isSalesLoading ? "…" : String(salesReport?.summary.orderCount || 0)}
              hint="Completed transactions"
            />
            <StatCard
              label="Total Tax"
              value={isSalesLoading ? "…" : `₹${(salesReport?.summary.totalTax || 0).toLocaleString("en-IN")}`}
              hint="GST / VAT collected"
            />
            <StatCard
              label="Total Discounts"
              value={isSalesLoading ? "…" : `₹${(salesReport?.summary.totalDiscount || 0).toLocaleString("en-IN")}`}
              hint="Promotions & cart discounts"
            />
            <StatCard
              label="Total Paid"
              value={isSalesLoading ? "…" : `₹${(salesReport?.summary.totalPaid || 0).toLocaleString("en-IN")}`}
              hint="Collected cash & digital payments"
            />
          </div>

          {/* Sales Transactions Table */}
          <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Persisted Sales Transactions</h3>
              <Badge variant="outline">{salesReport?.records.length || 0} Records</Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt / INV #</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Branch / Channel</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSalesLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        Loading sales report records...
                      </TableCell>
                    </TableRow>
                  ) : !salesReport?.records || salesReport.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No sales transaction records match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesReport.records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono font-medium text-xs text-primary">
                          {r.number}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(r.date).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="font-medium text-xs">{r.customerName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.branchName}</TableCell>
                        <TableCell className="text-right font-mono text-xs">₹{r.subtotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">₹{r.tax.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-destructive">
                          -₹{r.discount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">
                          ₹{r.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                          ₹{r.paid.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline">{r.paymentMethods || "CASH"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="border-emerald-500 bg-emerald-50 text-emerald-700">
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ===================================================================
            TAB 2: CUSTOMER REPORT
           =================================================================== */}
        <TabsContent value="customers" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">From</Label>
                <Input
                  type="date"
                  value={custDateFrom}
                  onChange={(e) => setCustDateFrom(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">To</Label>
                <Input
                  type="date"
                  value={custDateTo}
                  onChange={(e) => setCustDateTo(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="w-48">
                <Select value={custCustomerId} onValueChange={setCustCustomerId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Customers</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer name or code..."
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustDateFrom("");
                  setCustDateTo("");
                  setCustCustomerId("ALL");
                  setCustSearch("");
                }}
                className="h-8 text-xs"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Customer Stat Cards */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Registered Accounts"
              value={isCustLoading ? "…" : String(customerReport?.summary.totalCustomers || 0)}
              hint="Active customer database"
              tone="brand"
            />
            <StatCard
              label="Total Orders Placed"
              value={isCustLoading ? "…" : String(customerReport?.summary.totalOrders || 0)}
              hint="Across POS and Invoices"
            />
            <StatCard
              label="Total Purchases"
              value={isCustLoading ? "…" : `₹${(customerReport?.summary.totalPurchases || 0).toLocaleString("en-IN")}`}
              hint="Gross customer volume"
            />
            <StatCard
              label="Total Paid"
              value={isCustLoading ? "…" : `₹${(customerReport?.summary.totalPaid || 0).toLocaleString("en-IN")}`}
              hint="Collections received"
            />
            <StatCard
              label="Outstanding Due"
              value={isCustLoading ? "…" : `₹${(customerReport?.summary.totalOutstanding || 0).toLocaleString("en-IN")}`}
              hint="Pending customer receivables"
            />
          </div>

          {/* Customer Activity Table */}
          <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Customer Activity & Financial Summary</h3>
              <Badge variant="outline">{customerReport?.customers.length || 0} Accounts</Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-center">Orders Count</TableHead>
                    <TableHead className="text-right">Total Purchases</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Outstanding Balance</TableHead>
                    <TableHead>Last Purchase Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isCustLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Loading customer report data...
                      </TableCell>
                    </TableRow>
                  ) : !customerReport?.customers || customerReport.customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No customer accounts match your search or date filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerReport.customers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs font-medium text-primary">
                          {c.customerCode}
                        </TableCell>
                        <TableCell className="font-medium text-xs">{c.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.phone} {c.email !== "-" ? `• ${c.email}` : ""}
                        </TableCell>
                        <TableCell className="text-xs">{c.city}</TableCell>
                        <TableCell className="text-center font-semibold text-xs">{c.totalOrders}</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-xs">
                          ₹{c.totalPurchases.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                          ₹{c.totalPaid.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          ₹{c.outstandingAmount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString("en-IN") : "Never"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="border-emerald-500 bg-emerald-50 text-emerald-700">
                            {c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ===================================================================
            TAB 3: INVENTORY STOCK MOVEMENT REPORT
           =================================================================== */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">From</Label>
                <Input
                  type="date"
                  value={invDateFrom}
                  onChange={(e) => setInvDateFrom(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">To</Label>
                <Input
                  type="date"
                  value={invDateTo}
                  onChange={(e) => setInvDateTo(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>

              <div className="w-40">
                <Select
                  value={invWarehouseId}
                  onValueChange={(val) => {
                    setInvWarehouseId(val);
                    setInvLocationId("ALL");
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Warehouses</SelectItem>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Select value={invLocationId} onValueChange={setInvLocationId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Bins / Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-44">
                <Select value={invMovementType} onValueChange={setInvMovementType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Movement Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Movement Types</SelectItem>
                    <SelectItem value="SALE_SHIPMENT">SALE_SHIPMENT</SelectItem>
                    <SelectItem value="PURCHASE_RECEIPT">PURCHASE_RECEIPT</SelectItem>
                    <SelectItem value="ADJUSTMENT_IN">ADJUSTMENT_IN</SelectItem>
                    <SelectItem value="ADJUSTMENT_OUT">ADJUSTMENT_OUT</SelectItem>
                    <SelectItem value="TRANSFER_IN">TRANSFER_IN</SelectItem>
                    <SelectItem value="TRANSFER_OUT">TRANSFER_OUT</SelectItem>
                    <SelectItem value="CUSTOMER_RETURN">CUSTOMER_RETURN</SelectItem>
                    <SelectItem value="SUPPLIER_RETURN">SUPPLIER_RETURN</SelectItem>
                    <SelectItem value="DAMAGE_WRITEOFF">DAMAGE_WRITEOFF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-60">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product, SKU or ref..."
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInvDateFrom("");
                  setInvDateTo("");
                  setInvWarehouseId("ALL");
                  setInvLocationId("ALL");
                  setInvMovementType("ALL");
                  setInvSearch("");
                }}
                className="h-8 text-xs"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Inventory Movement Stat Cards */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Movement Records"
              value={isInvLoading ? "…" : String(invReport?.summary.totalMovements || 0)}
              hint="Immutable StockMovement ledger"
              tone="brand"
            />
            <StatCard
              label="Total Inbound Stock"
              value={isInvLoading ? "…" : `+${(invReport?.summary.totalInboundQty || 0).toLocaleString()} Units`}
              hint="Purchases, adjustments & receipts"
            />
            <StatCard
              label="Total Outbound Stock"
              value={isInvLoading ? "…" : `-${(invReport?.summary.totalOutboundQty || 0).toLocaleString()} Units`}
              hint="POS Sales, shipments & write-offs"
            />
            <StatCard
              label="Net Stock Movement"
              value={isInvLoading ? "…" : `${(invReport?.summary.netQtyChange || 0) >= 0 ? "+" : ""}${(invReport?.summary.netQtyChange || 0).toLocaleString()} Units`}
              hint="Net physical inventory shift"
            />
          </div>

          {/* Stock Movements Ledger Table */}
          <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Persisted StockMovement Audit Ledger</h3>
              <Badge variant="outline">{invReport?.records.length || 0} Ledger Entries</Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Timestamp</TableHead>
                    <TableHead>Product & SKU</TableHead>
                    <TableHead>Facility & Bin</TableHead>
                    <TableHead>Movement Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>User / Actor</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isInvLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Loading stock movement ledger...
                      </TableCell>
                    </TableRow>
                  ) : !invReport?.records || invReport.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No stock movement records match your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invReport.records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">
                          {new Date(r.createdAt).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{r.productName}</div>
                          <div className="text-[10px] text-muted-foreground">SKU: {r.productSku}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{r.warehouseName}</div>
                          <div className="text-[10px] text-muted-foreground">{r.locationName}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant="outline"
                            className={
                              r.isOutbound
                                ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold text-[11px]"
                                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]"
                            }
                          >
                            {r.movementType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">
                          <span className={r.isOutbound ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {r.quantity > 0 ? `+${r.quantity}` : r.quantity} Units
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          ₹{r.unitCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-xs">
                          ₹{r.totalCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-primary">
                          {r.referenceType}: {r.referenceId}
                        </TableCell>
                        <TableCell className="text-xs">{r.performedBy}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {r.notes}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
