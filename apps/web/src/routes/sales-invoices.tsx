import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useSalesInvoices,
  useCreateSalesInvoice,
  usePostSalesInvoice,
  useCancelSalesInvoice,
  type SalesInvoiceItem,
} from "@/hooks/queries/useSalesInvoices";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useSalesOrders } from "@/hooks/queries/useSalesOrders";
import { useProducts } from "@/hooks/queries/useProducts";
import { useProductVariants } from "@/hooks/queries/useProductVariants";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadFile } from "@/lib/api-client";
import { Plus, Trash2, Receipt, CreditCard, Send, Download } from "lucide-react";

const title = "Sales Invoices";
const description = "Billing invoices, payment status tracking, and customer receivables.";

export const Route = createFileRoute("/sales-invoices")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: SalesInvoicesPage,
});

function SalesInvoicesPage() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canInvoice = permissions.includes("sales.invoice");
  const canPayment = permissions.includes("sales.payment");

  const { data: invoicesData, isLoading } = useSalesInvoices();
  const { data: customers } = useCustomers();
  const { data: salesOrders } = useSalesOrders();
  const { data: productsRes } = useProducts();
  const products = productsRes?.data;
  const { data: variants } = useProductVariants();

  const createSalesInvoiceMutation = useCreateSalesInvoice();
  const postSalesInvoiceMutation = usePostSalesInvoice();
  const cancelSalesInvoiceMutation = useCancelSalesInvoice();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (id: string, invNumber: string) => {
    setDownloadingId(id);
    try {
      await downloadFile(`/sales-invoices/${id}/pdf`, `${invNumber}.pdf`);
    } catch (err: any) {
      alert(err.message || "Failed to download invoice PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [items, setItems] = useState<
    Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
      taxRate?: number;
    }>
  >([{ productId: "", variantId: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 18 }]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: "", variantId: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 18 },
    ]);
  };

  const removeItemRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const updated = { ...item, [field]: value };
          if (field === "productId") {
            updated.variantId = "";
            const prod = products?.find((p) => p.id === value);
            if (prod && prod.costPrice) {
              updated.unitPrice = Number(prod.costPrice) * 1.5;
            }
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const handleSOSelect = (soId: string) => {
    setSalesOrderId(soId || "");
    const so = salesOrders?.find((s) => s.id === soId);
    if (so) {
      setCustomerId(so.customerId);
      setItems(
        so.items.map((i) => {
          const itemVal: {
            productId: string;
            variantId?: string;
            quantity: number;
            unitPrice: number;
            discountAmount?: number;
            taxRate?: number;
          } = {
            productId: i.productId,
            quantity: Number(i.orderedQty),
            unitPrice: Number(i.unitPrice),
            discountAmount: Number(i.discountAmount || 0),
            taxRate: Number(i.taxRate || 0),
          };
          if (i.variantId) {
            itemVal.variantId = i.variantId;
          }
          return itemVal;
        }),
      );
    }
  };

  const resetForm = () => {
    setCustomerId("");
    setSalesOrderId("");
    setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0] || "");
    setItems([
      { productId: "", variantId: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 18 },
    ]);
    setErrorMsg(null);
  };

  const handleCreate = async () => {
    if (!customerId || !dueDate || items.some((i) => !i.productId || i.quantity <= 0)) {
      setErrorMsg("Please select a customer, due date, and valid line items.");
      return;
    }
    setErrorMsg(null);
    try {
      await createSalesInvoiceMutation.mutateAsync({
        customerId,
        salesOrderId: salesOrderId || undefined,
        dueDate: new Date(dueDate).toISOString(),
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountAmount: Number(i.discountAmount || 0),
          taxRate: Number(i.taxRate || 0),
        })),
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create sales invoice");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "invoiceNumber", header: "Invoice #" },
    { key: "customerName", header: "Customer" },
    { key: "dueDate", header: "Due Date" },
    { key: "total", header: "Total Amount" },
    { key: "paid", header: "Paid" },
    { key: "outstanding", header: "Outstanding" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const inv = invoicesData?.find((item) => item.id === r["id"]);
        if (!inv) return null;

        return (
          <div className="flex items-center gap-1">
            {inv.status === "DRAFT" && canInvoice && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => postSalesInvoiceMutation.mutate(inv.id)}
                >
                  <Send className="mr-1 h-3 w-3" /> Post Invoice
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => cancelSalesInvoiceMutation.mutate(inv.id)}
                >
                  Cancel
                </Button>
              </>
            )}

            {(inv.status === "POSTED" || inv.status === "PARTIALLY_PAID") && canPayment && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  navigate({
                    to: "/customer-payments",
                    search: { invoiceId: inv.id, customerId: inv.customerId } as any,
                  })
                }
              >
                <CreditCard className="mr-1 h-3 w-3" /> Record Payment
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={downloadingId === inv.id}
              onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
            >
              <Download className="mr-1 h-3 w-3" />
              {downloadingId === inv.id ? "PDF..." : "PDF"}
            </Button>
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = invoicesData
    ? invoicesData.map((inv) => {
        const total = Number(inv.totalAmount);
        const paid = Number(inv.paidAmount || 0);
        const outstanding = total - paid;

        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customer?.name || "N/A",
          dueDate: new Date(inv.dueDate).toLocaleDateString(),
          total: `₹${total.toLocaleString("en-IN")}`,
          paid: `₹${paid.toLocaleString("en-IN")}`,
          outstanding: `₹${outstanding.toLocaleString("en-IN")}`,
          status: inv.status,
        };
      })
    : [];

  const stats = [
    { label: "Total Invoices", value: isLoading ? "…" : String(invoicesData?.length || 0) },
    {
      label: "Unpaid / Partial",
      value: isLoading
        ? "…"
        : String(
            invoicesData?.filter((i) => ["POSTED", "PARTIALLY_PAID"].includes(i.status)).length ||
              0,
          ),
    },
    {
      label: "Fully Paid",
      value: isLoading ? "…" : String(invoicesData?.filter((i) => i.status === "PAID").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Sales Receivables"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          canInvoice ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Create Sales Invoice
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Sales Invoice Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sales Invoice</DialogTitle>
            <DialogDescription>
              Generate a customer invoice manually or directly from a Sales Order.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 py-2 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="invCust">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="invCust">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invSO">From Sales Order</Label>
              <Select value={salesOrderId} onValueChange={handleSOSelect}>
                <SelectTrigger id="invSO">
                  <SelectValue placeholder="Select Order (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {salesOrders?.map((so) => (
                    <SelectItem key={so.id} value={so.id}>
                      {so.orderNumber} — {so.customer?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invDueDate">Due Date *</Label>
              <Input
                id="invDueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Invoice Line Items</h4>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            {items.map((row, idx) => {
              const selectedProductVariants = variants?.filter(
                (v) => v.productId === row.productId,
              );
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center border rounded p-2 bg-muted/20"
                >
                  <div className="col-span-4">
                    <Select
                      value={row.productId}
                      onValueChange={(val) => updateItemRow(idx, "productId", val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Product *" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Select
                      value={row.variantId || ""}
                      onValueChange={(val) => updateItemRow(idx, "variantId", val)}
                      disabled={!row.productId || !selectedProductVariants?.length}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Variant (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProductVariants?.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} ({v.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => updateItemRow(idx, "quantity", Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      placeholder="Price (₹)"
                      value={row.unitPrice}
                      onChange={(e) => updateItemRow(idx, "unitPrice", Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createSalesInvoiceMutation.isPending || !customerId || !dueDate}
            >
              {createSalesInvoiceMutation.isPending ? "Creating…" : "Save Draft Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
