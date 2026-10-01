import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useSendPurchaseOrder,
  useCancelPurchaseOrder,
  type PurchaseOrderItem,
} from "@/hooks/queries/usePurchaseOrders";
import { useSuppliers } from "@/hooks/queries/useSuppliers";
import { usePurchaseRequests } from "@/hooks/queries/usePurchaseRequests";
import { useProducts, type ProductItem } from "@/hooks/queries/useProducts";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
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
import { downloadFile } from "@/lib/api-client";
import { Plus, Eye, Send, CheckCircle2, Trash2, Ban, Download } from "lucide-react";

const title = "Purchase Orders";
const description = "Binding purchase orders to vendors, terms, line pricing, and status tracking.";

export const Route = createFileRoute("/purchase-orders")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: PurchaseOrdersPage,
});

export interface POFormLineItem {
  productId: string;
  variantId?: string | undefined;
  orderedQty: number;
  unitPrice: number;
  taxRate: number;
}

function PurchaseOrdersPage() {
  const { data: orders } = usePurchaseOrders();
  const { data: suppliers } = useSuppliers();
  const { data: purchaseRequests } = usePurchaseRequests();
  const { data: productsData } = useProducts();
  const { data: warehouses } = useWarehouses();

  const productsList = productsData?.data || [];

  const createPOMutation = useCreatePurchaseOrder();
  const submitPOMutation = useSubmitPurchaseOrder();
  const approvePOMutation = useApprovePurchaseOrder();
  const sendPOMutation = useSendPurchaseOrder();
  const cancelPOMutation = useCancelPurchaseOrder();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (id: string, orderNumber: string) => {
    setDownloadingId(id);
    try {
      await downloadFile(`/purchase-orders/${id}/pdf`, `${orderNumber}.pdf`);
    } catch (err: any) {
      alert(err.message || "Failed to download Purchase Order PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [prId, setPRId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("NET30");
  const [currency, setCurrency] = useState("INR");
  const [items, setItems] = useState<POFormLineItem[]>([]);

  // Item Line State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(18);

  const handleAddItem = () => {
    if (!selectedProduct || qty <= 0 || unitPrice < 0) return;
    const newItem: POFormLineItem = {
      productId: selectedProduct,
      ...(selectedVariant ? { variantId: selectedVariant } : {}),
      orderedQty: Number(qty),
      unitPrice: Number(unitPrice),
      taxRate: Number(taxRate),
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedProduct("");
    setSelectedVariant("");
    setQty(1);
    setUnitPrice(0);
  };

  const handleCreate = async () => {
    if (!supplierId || !warehouseId || items.length === 0) return;
    await createPOMutation.mutateAsync({
      supplierId,
      purchaseRequestId: prId || undefined,
      warehouseId,
      currency,
      paymentTerms,
      items,
    });
    setIsAddOpen(false);
    setItems([]);
  };

  const columns: Column<ListRow>[] = [
    { key: "orderNumber", header: "PO #" },
    { key: "supplier", header: "Supplier" },
    { key: "warehouse", header: "Warehouse" },
    { key: "orderDate", header: "Order Date" },
    { key: "itemCount", header: "Items" },
    { key: "totalAmount", header: "Total Amount" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const item = orders?.find((po) => po.id === r["id"]);
        if (!item) return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedPO(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {item.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={() => submitPOMutation.mutate({ id: item.id })}
                title="Submit PO"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            {item.status === "SUBMITTED" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-success"
                onClick={() => approvePOMutation.mutate({ id: item.id })}
                title="Approve PO"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            {item.status === "APPROVED" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={() => sendPOMutation.mutate({ id: item.id })}
                title="Send PO to Vendor"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            {["DRAFT", "SUBMITTED", "APPROVED", "SENT"].includes(item.status) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => cancelPOMutation.mutate({ id: item.id })}
                title="Cancel PO"
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              disabled={downloadingId === item.id}
              onClick={() => handleDownloadPdf(item.id, item.orderNumber)}
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = orders
    ? orders.map((po) => ({
        id: po.id,
        orderNumber: po.orderNumber,
        supplier: po.supplier ? po.supplier.name : "N/A",
        warehouse: po.warehouse ? po.warehouse.name : "N/A",
        orderDate: new Date(po.orderDate).toLocaleDateString(),
        itemCount: String(po.items.length),
        totalAmount: `₹${Number(po.totalAmount).toLocaleString("en-IN")}`,
        status: po.status,
      }))
    : [];

  const stats = [
    { label: "Total POs", value: String(orders?.length || 0) },
    {
      label: "Open / Sent POs",
      value: String(
        orders?.filter((o) => ["SENT", "PARTIALLY_RECEIVED"].includes(o.status)).length || 0,
      ),
    },
    {
      label: "Fully Received",
      value: String(orders?.filter((o) => o.status === "RECEIVED").length || 0),
    },
  ];

  const activeProduct = productsList.find((p: ProductItem) => p.id === selectedProduct);

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Purchasing"
        actionLabel="New purchase order"
        onAction={() => setIsAddOpen(true)}
        stats={stats}
        columns={columns}
        rows={rows}
      />

      {/* Create PO Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Draft a binding order to a vendor with negotiated item prices and taxes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Select Supplier</option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Target Warehouse *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Select Warehouse</option>
                {warehouses?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Linked PR (Optional)</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={prId}
                onChange={(e) => setPRId(e.target.value)}
              >
                <option value="">None / Direct PO</option>
                {purchaseRequests
                  ?.filter((p) => p.status === "APPROVED")
                  .map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.requestNumber}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-sm">Line Items & Pricing</h4>

            <div className="grid gap-2 sm:grid-cols-6 items-end">
              <div className="sm:col-span-2">
                <Label className="text-xs">Product *</Label>
                <select
                  className="w-full h-9 px-2 rounded border text-xs"
                  value={selectedProduct}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setSelectedProduct(pId);
                    setSelectedVariant("");
                    const p = productsList.find((prod: ProductItem) => prod.id === pId);
                    if (p) {
                      setUnitPrice(Number(p.costPrice || 0));
                    }
                  }}
                >
                  <option value="">Select Product</option>
                  {productsList.map((p: ProductItem) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Qty *</Label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Unit Price (₹) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Tax Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Button
                  size="sm"
                  className="w-full h-9"
                  onClick={handleAddItem}
                  disabled={!selectedProduct || qty <= 0}
                >
                  Add Line
                </Button>
              </div>
            </div>

            {/* Added Order Lines */}
            <div className="max-h-40 overflow-y-auto space-y-1">
              {items.map((it, idx) => {
                const p = productsList.find((prod: ProductItem) => prod.id === it.productId);
                const sub = it.orderedQty * it.unitPrice;
                const tax = (sub * it.taxRate) / 100;
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center border rounded p-2 text-xs"
                  >
                    <div>
                      <span className="font-medium">{p?.name}</span> • {it.orderedQty} x ₹
                      {it.unitPrice} (+{it.taxRate}% GST)
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">₹{(sub + tax).toLocaleString("en-IN")}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createPOMutation.isPending || !supplierId || !warehouseId || items.length === 0
              }
            >
              Save PO (Draft)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PO Details Dialog */}
      <Dialog
        open={Boolean(selectedPO)}
        onOpenChange={(open) => {
          if (!open) setSelectedPO(null);
        }}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-xl">
                Purchase Order Details: {selectedPO?.orderNumber}
              </DialogTitle>
              {selectedPO?.status && <StatusBadge value={selectedPO.status} />}
            </div>
            <DialogDescription>
              View order items, vendor terms, and financial summary.
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b pb-4 sm:grid-cols-4">
                <div>
                  <div className="text-xs text-muted-foreground">Supplier</div>
                  <div className="font-semibold text-foreground">
                    {selectedPO.supplier?.name || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Target Warehouse</div>
                  <div className="font-semibold text-foreground">
                    {selectedPO.warehouse?.name || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Order Date</div>
                  <div className="font-semibold text-foreground">
                    {new Date(selectedPO.orderDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Payment Terms</div>
                  <div className="font-semibold text-foreground">
                    {selectedPO.paymentTerms || "N/A"}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Line Items</h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground border-b font-medium">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 text-right">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Tax Rate</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedPO.items && selectedPO.items.length > 0 ? (
                        selectedPO.items.map((it, idx) => {
                          const productName =
                            it.product?.name ||
                            productsList.find((p: ProductItem) => p.id === it.productId)?.name ||
                            "Product";
                          const qtyVal = Number(it.orderedQty || 0);
                          const priceVal = Number(it.unitPrice || 0);
                          const taxRateVal = Number(it.taxRate || 0);
                          const lineTotalVal = Number(
                            it.totalAmount || qtyVal * priceVal * (1 + taxRateVal / 100),
                          );

                          return (
                            <tr key={it.id || idx}>
                              <td className="p-2.5 font-medium">{productName}</td>
                              <td className="p-2.5 text-right">{qtyVal}</td>
                              <td className="p-2.5 text-right">
                                ₹{priceVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2.5 text-right">{taxRateVal}%</td>
                              <td className="p-2.5 text-right font-medium">
                                ₹{lineTotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground">
                            No line items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="flex flex-col items-end space-y-1 text-xs pt-2">
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>
                    ₹
                    {Number(selectedPO.subtotalAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">Tax Amount:</span>
                  <span>
                    ₹
                    {Number(selectedPO.taxAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between w-48 font-semibold text-sm border-t pt-1">
                  <span>Total Amount:</span>
                  <span>
                    ₹
                    {Number(selectedPO.totalAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPO(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
