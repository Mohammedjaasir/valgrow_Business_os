import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useGoodsReceipts,
  useCreateGoodsReceipt,
  usePostGoodsReceipt,
  useCancelGoodsReceipt,
  type GoodsReceiptItem,
} from "@/hooks/queries/useGoodsReceipts";
import { usePurchaseOrders, usePurchaseOrder } from "@/hooks/queries/usePurchaseOrders";
import { useLocations } from "@/hooks/queries/useLocations";
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
import { Plus, CheckCircle2, Ban, AlertTriangle, Download } from "lucide-react";

const title = "Goods Receipts";
const description =
  "Goods Receiving Notes (GRN), inbound physical inspection, and atomic stock postings.";

export const Route = createFileRoute("/goods-receipts")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: GoodsReceiptsPage,
});

function GoodsReceiptsPage() {
  const { data: receipts } = useGoodsReceipts();
  const { data: openOrders } = usePurchaseOrders();

  const createGRNMutation = useCreateGoodsReceipt();
  const postGRNMutation = usePostGoodsReceipt();
  const cancelGRNMutation = useCancelGoodsReceipt();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [postConfirmGRN, setPostConfirmGRN] = useState<GoodsReceiptItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (id: string, receiptNumber: string) => {
    setDownloadingId(id);
    try {
      await downloadFile(`/goods-receipts/${id}/pdf`, `${receiptNumber}.pdf`);
    } catch (err: any) {
      alert(err.message || "Failed to download Goods Receipt PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  // GRN Creation State
  const [selectedPOId, setSelectedPOId] = useState("");
  const { data: selectedPO } = usePurchaseOrder(selectedPOId);
  const { data: locations } = useLocations(selectedPO?.warehouseId || "");

  const [receivingItems, setReceivingItems] = useState<
    Record<
      string,
      {
        locationId: string;
        receivingQty: number;
        batchNumber?: string | undefined;
        unitCost: number;
      }
    >
  >({});

  const handlePOSelect = (poId: string) => {
    setSelectedPOId(poId);
    setReceivingItems({});
  };

  const handleCreateGRN = async () => {
    if (!selectedPO) return;
    const itemsToReceive = selectedPO.items
      .map((i) => {
        const itemId = i.id || "";
        const ordered = Number(i.orderedQty);
        const rec = Number(i.receivedQty || 0);
        const remaining = Math.max(0, ordered - rec);

        const itemState = receivingItems[itemId];
        const receivingQty =
          itemState !== undefined ? Number(itemState.receivingQty) : remaining;
        const locationId = itemState?.locationId || locations?.[0]?.id || "";

        if (receivingQty <= 0 || !locationId) return null;

        return {
          purchaseOrderItemId: itemId,
          productId: i.productId,
          ...(i.variantId ? { variantId: i.variantId } : {}),
          locationId,
          ...(itemState?.batchNumber ? { batchNumber: itemState.batchNumber } : {}),
          receivedQty: receivingQty,
          unitCost: Number(i.unitPrice),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (itemsToReceive.length === 0) return;

    await createGRNMutation.mutateAsync({
      purchaseOrderId: selectedPO.id,
      supplierId: selectedPO.supplierId,
      warehouseId: selectedPO.warehouseId,
      items: itemsToReceive,
    });

    setIsAddOpen(false);
    setSelectedPOId("");
    setReceivingItems({});
  };

  const handlePostConfirm = async () => {
    if (!postConfirmGRN) return;
    await postGRNMutation.mutateAsync(postConfirmGRN.id);
    setPostConfirmGRN(null);
  };

  const columns: Column<ListRow>[] = [
    { key: "receiptNumber", header: "GRN #" },
    { key: "poNumber", header: "Purchase Order" },
    { key: "supplier", header: "Supplier" },
    { key: "warehouse", header: "Warehouse" },
    { key: "receivedAt", header: "Receipt Date" },
    { key: "itemCount", header: "Line Items" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const item = receipts?.find((grn) => grn.id === r["id"]);
        if (!item) return null;
        return (
          <div className="flex items-center gap-1">
            {item.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-success"
                onClick={() => setPostConfirmGRN(item)}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" /> Post GRN
              </Button>
            )}
            {item.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => cancelGRNMutation.mutate(item.id)}
                title="Cancel GRN"
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              disabled={downloadingId === item.id}
              onClick={() => handleDownloadPdf(item.id, item.receiptNumber)}
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = receipts
    ? receipts.map((grn) => ({
        id: grn.id,
        receiptNumber: grn.receiptNumber,
        poNumber: grn.purchaseOrder ? grn.purchaseOrder.orderNumber : "N/A",
        supplier: grn.supplier ? grn.supplier.name : "N/A",
        warehouse: grn.warehouse ? grn.warehouse.name : "N/A",
        receivedAt: new Date(grn.receivedAt).toLocaleDateString(),
        itemCount: String(grn.items.length),
        status: grn.status,
      }))
    : [];

  const stats = [
    { label: "Total GRNs", value: String(receipts?.length || 0) },
    {
      label: "Draft GRNs",
      value: String(receipts?.filter((g) => g.status === "DRAFT").length || 0),
    },
    {
      label: "Posted (In Inventory)",
      value: String(receipts?.filter((g) => g.status === "POSTED").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Purchasing & Inventory Receiving"
        actionLabel="New Goods Receipt"
        onAction={() => setIsAddOpen(true)}
        stats={stats}
        columns={columns}
        rows={rows}
      />

      {/* Create GRN Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Create Goods Receipt Note (GRN)</DialogTitle>
            <DialogDescription>
              Receive items against an approved purchase order into warehouse locations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Purchase Order *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={selectedPOId}
                onChange={(e) => handlePOSelect(e.target.value)}
              >
                <option value="">Select PO to Receive</option>
                {openOrders
                  ?.filter((po) => ["SENT", "PARTIALLY_RECEIVED", "APPROVED"].includes(po.status))
                  .map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.orderNumber} — {po.supplier?.name} ({po.status})
                    </option>
                  ))}
              </select>
            </div>

            {selectedPO && (
              <div className="space-y-3 border-t pt-3">
                <h4 className="font-semibold text-sm">Receivable Order Items</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedPO.items.map((item) => {
                    if (!item.id) return null;
                    const itemId = item.id;
                    const ordered = Number(item.orderedQty);
                    const rec = Number(item.receivedQty || 0);
                    const remaining = ordered - rec;
                    const itemState = receivingItems[itemId] || {
                      locationId: locations?.[0]?.id || "",
                      receivingQty: remaining,
                      batchNumber: "",
                      unitCost: Number(item.unitPrice),
                    };

                    return (
                      <div
                        key={itemId}
                        className="border rounded p-3 text-xs space-y-2 bg-secondary/20"
                      >
                        <div className="flex justify-between font-medium">
                          <span>
                            {item.product?.name} ({item.product?.sku})
                          </span>
                          <span>
                            Ordered: {ordered} | Prev. Rec: {rec} |{" "}
                            <strong className="text-primary">Remaining: {remaining}</strong>
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <div>
                            <Label className="text-[11px]">Receiving Qty (Max: {remaining})</Label>
                            <Input
                              type="number"
                              min={0}
                              max={remaining}
                              value={itemState.receivingQty}
                              onChange={(e) => {
                                const val = Math.min(
                                  remaining,
                                  Math.max(0, Number(e.target.value)),
                                );
                                setReceivingItems((prev) => ({
                                  ...prev,
                                  [itemId]: { ...itemState, receivingQty: val },
                                }));
                              }}
                              className="h-8 text-xs"
                            />
                          </div>

                          <div>
                            <Label className="text-[11px]">Target Bin Location *</Label>
                            <select
                              className="w-full h-8 px-2 rounded border text-xs bg-background"
                              value={itemState.locationId}
                              onChange={(e) =>
                                setReceivingItems((prev) => ({
                                  ...prev,
                                  [itemId]: { ...itemState, locationId: e.target.value },
                                }))
                              }
                            >
                              <option value="">Select Bin</option>
                              {locations?.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name} ({l.code})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label className="text-[11px]">Batch # (Optional)</Label>
                            <Input
                              placeholder="BATCH-001"
                              value={itemState.batchNumber || ""}
                              onChange={(e) =>
                                setReceivingItems((prev) => ({
                                  ...prev,
                                  [itemId]: { ...itemState, batchNumber: e.target.value },
                                }))
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGRN} disabled={createGRNMutation.isPending || !selectedPO}>
              Create GRN (Draft)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Confirmation Modal */}
      <Dialog open={Boolean(postConfirmGRN)} onOpenChange={() => setPostConfirmGRN(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" /> Confirm Atomic Inventory Post
            </DialogTitle>
            <DialogDescription>
              Posting this Goods Receipt will immediately update inventory stock levels, create cost
              layers, and log stock movements.
            </DialogDescription>
          </DialogHeader>

          {postConfirmGRN && (
            <div className="space-y-3 py-2 text-sm border-y my-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt Number:</span>
                <span className="font-semibold">{postConfirmGRN.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Warehouse:</span>
                <span className="font-semibold">{postConfirmGRN.warehouse?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items to Receive:</span>
                <span className="font-semibold">{postConfirmGRN.items.length} line item(s)</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPostConfirmGRN(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={handlePostConfirm}
              disabled={postGRNMutation.isPending}
            >
              {postGRNMutation.isPending ? "Posting Stock…" : "Confirm & Post Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
