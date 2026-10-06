import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, NameCell, NumberCell, type ListRow } from "@/components/foundation/list-page";
import { ModuleTabs } from "@/components/foundation/module-tabs";
import type { Column } from "@/components/foundation/data-table";
import { useInventoryStock, type StockItem } from "@/hooks/queries/useInventoryStock";
import { useProducts, type ProductItem } from "@/hooks/queries/useProducts";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useLocations } from "@/hooks/queries/useLocations";
import { useCreateAdjustment } from "@/hooks/queries/useInventoryAdjustments";
import { useCreateWarehouse } from "@/hooks/queries/useWarehouses";
import { useCreateLocation } from "@/hooks/queries/useLocations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Boxes, SlidersHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";

const title = "Live Stock Levels";
const description =
  "Real-time stock availability, reservations, and location placement across all warehouses.";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: InventoryStockPage,
});

function InventoryStockPage() {
  const [page] = useState(1);
  const [search] = useState("");
  const { data: stockData } = useInventoryStock({ page, search });
  const { data: productsData } = useProducts({ limit: 100 });
  const { data: warehouses = [] } = useWarehouses();

  const createAdjustmentMutation = useCreateAdjustment();
  const createWarehouseMutation = useCreateWarehouse();

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [quantityStr, setQuantityStr] = useState<string>("");
  const [reason, setReason] = useState<string>("COUNT_CORRECTION");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch locations for selected warehouse
  const { data: locations = [] } = useLocations(selectedWarehouseId);
  const createLocationMutation = useCreateLocation(selectedWarehouseId);

  const handleOpenAdjust = async (targetProductId?: string) => {
    setFormError(null);
    setQuantityStr("");
    setNotes("");
    setAdjustmentType("INCREASE");
    setReason("COUNT_CORRECTION");

    // Select Product
    const defaultProduct = targetProductId || productsData?.data?.[0]?.id || "";
    setSelectedProductId(defaultProduct);

    // Auto-ensure default warehouse if none exist
    let activeWarehouseId = selectedWarehouseId;
    if (warehouses.length > 0) {
      activeWarehouseId = warehouses[0]!.id;
      setSelectedWarehouseId(activeWarehouseId);
    } else {
      try {
        const newWh = await createWarehouseMutation.mutateAsync({
          name: "Main Warehouse",
          code: "WH-MAIN",
          isDefault: true,
        });
        activeWarehouseId = newWh.id;
        setSelectedWarehouseId(activeWarehouseId);

        const newLoc = await createLocationMutation.mutateAsync({
          name: "Default Bin",
          code: "LOC-MAIN",
          isDefault: true,
        });
        setSelectedLocationId(newLoc.id);
      } catch (err) {
        console.warn("Auto warehouse creation fallback handled");
      }
    }

    setIsDialogOpen(true);
  };

  // If locations load and none is selected yet, select the first default location
  if (locations.length > 0 && !selectedLocationId) {
    setSelectedLocationId(locations[0]!.id);
  }

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProductId) {
      setFormError("Please select a product.");
      return;
    }

    if (!selectedWarehouseId) {
      setFormError("Please select a warehouse.");
      return;
    }

    if (!selectedLocationId) {
      setFormError("Please select a location.");
      return;
    }

    const qtyNum = Number(quantityStr);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setFormError("Please enter a valid positive quantity.");
      return;
    }

    // Find current stock level for this product & location
    const existingStock = stockData?.data?.find(
      (s) => s.productId === selectedProductId && s.locationId === selectedLocationId,
    );

    const currentQty = existingStock ? Number(existingStock.onHand) : 0;
    const adjustedQty = adjustmentType === "INCREASE" ? qtyNum : -qtyNum;
    const newQty = Math.max(0, currentQty + adjustedQty);

    const selectedProduct = productsData?.data?.find((p) => p.id === selectedProductId);
    const unitCost = selectedProduct ? Number(selectedProduct.costPrice || 0) : 0;

    const payload = {
      adjustmentNumber: `ADJ-${Date.now().toString().slice(-6)}`,
      warehouseId: selectedWarehouseId,
      reason: reason as any,
      notes: notes.trim() || null,
      items: [
        {
          locationId: selectedLocationId,
          productId: selectedProductId,
          currentQty,
          adjustedQty,
          newQty,
          unitCost,
        },
      ],
    };

    try {
      await createAdjustmentMutation.mutateAsync(payload as any);
      toast.success(
        `Stock ${adjustmentType === "INCREASE" ? "increased" : "decreased"} by ${qtyNum} units!`,
      );
      setIsDialogOpen(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to post stock adjustment.");
      toast.error(err?.message || "Failed to post stock adjustment.");
    }
  };

  // Build Table Rows: Combine Catalog Products with Stock Levels
  const stockByProductMap = new Map<string, StockItem[]>();
  if (stockData?.data) {
    for (const item of stockData.data) {
      const existing = stockByProductMap.get(item.productId) || [];
      existing.push(item);
      stockByProductMap.set(item.productId, existing);
    }
  }

  const catalogProducts = productsData?.data || [];
  const rows: ListRow[] = [];

  if (catalogProducts.length > 0) {
    for (const prod of catalogProducts) {
      const stockLevels = stockByProductMap.get(prod.id) || [];

      if (stockLevels.length > 0) {
        for (const s of stockLevels) {
          rows.push({
            id: s.id,
            productId: prod.id,
            product: s.product?.name || prod.name,
            variant: s.variant?.name || "Base Product",
            facility: `${s.warehouse?.name || "N/A"} → ${s.location?.name || "N/A"}`,
            batch: s.batch?.batchNumber || "Non-Batched",
            onHand: `${s.onHand} Units`,
            reserved: `${s.reserved} Units`,
            available: `${s.available} Units`,
          });
        }
      } else {
        // Product has no stock levels yet
        rows.push({
          id: `no-stock-${prod.id}`,
          productId: prod.id,
          product: prod.name,
          variant: "Base Product",
          facility: warehouses[0]?.name ? `${warehouses[0].name} (Unstocked)` : "No Location Assigned",
          batch: "Non-Batched",
          onHand: "0 Units",
          reserved: "0 Units",
          available: "0 Units",
        });
      }
    }
  } else if (stockData?.data) {
    for (const s of stockData.data) {
      rows.push({
        id: s.id,
        productId: s.productId,
        product: s.product?.name || "Unassigned Product",
        variant: s.variant?.name || "Base Product",
        facility: `${s.warehouse?.name || "N/A"} → ${s.location?.name || "N/A"}`,
        batch: s.batch?.batchNumber || "Non-Batched",
        onHand: `${s.onHand} Units`,
        reserved: `${s.reserved} Units`,
        available: `${s.available} Units`,
      });
    }
  }

  // Calculate Header Stats
  const totalOnHand = stockData?.data?.reduce((acc, curr) => acc + Number(curr.onHand), 0) || 0;
  const totalReserved = stockData?.data?.reduce((acc, curr) => acc + Number(curr.reserved), 0) || 0;
  const totalAvailable = stockData?.data?.reduce((acc, curr) => acc + Number(curr.available), 0) || 0;

  const stats = [
    { label: "Total On Hand", value: `${totalOnHand} Units`, hint: "Physical stock across warehouses" },
    { label: "Total Reserved", value: `${totalReserved} Units`, hint: "Locked in active orders" },
    { label: "Total Available", value: `${totalAvailable} Units`, hint: "Available for allocation" },
  ];

  const columns: Column<ListRow>[] = [
    {
      key: "product",
      header: "Product",
      render: (r) => <NameCell value={String(r["product"] ?? "")} sub={String(r["variant"] ?? "")} />,
    },
    {
      key: "facility",
      header: "Warehouse & Location",
      render: (r) => <span className="text-muted-foreground">{String(r["facility"] ?? "")}</span>,
    },
    {
      key: "batch",
      header: "Batch No.",
      render: (r) => <span className="font-mono text-xs text-muted-foreground">{String(r["batch"] ?? "")}</span>,
    },
    {
      key: "onHand",
      header: "On hand",
      className: "text-right",
      render: (r) => <NumberCell value={String(r["onHand"] ?? "")} />,
    },
    {
      key: "reserved",
      header: "Reserved",
      className: "text-right",
      render: (r) => <NumberCell value={String(r["reserved"] ?? "")} />,
    },
    {
      key: "available",
      header: "Available",
      className: "text-right",
      render: (r) => {
        const value = String(r["available"] ?? "");
        const qty = Number(value.replace(/[^\d.-]/g, ""));
        return (
          <NumberCell
            value={value}
            {...(Number.isFinite(qty) && qty <= 0 ? { tone: "danger" as const } : {})}
          />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold"
            onClick={() => handleOpenAdjust(r["productId"])}
            title="Adjust Stock for Product"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Adjust
          </Button>
        </div>
      ),
    },
  ];

  const isSubmitting = createAdjustmentMutation.isPending;

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Inventory"
        actionLabel="Adjust stock"
        onAction={() => handleOpenAdjust()}
        stats={stats}
        columns={columns}
        rows={rows}
      >
        <ModuleTabs
          id="catalog"
          tabs={[
            { to: "/inventory", label: "Live stock levels", icon: Boxes },
            { to: "/products", label: "Product catalog", icon: Package },
          ]}
        />
      </ListPage>

      {/* Adjust Stock Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Inventory Stock</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitAdjustment} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 text-xs rounded border border-destructive/40 bg-destructive/10 text-destructive font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              {/* Select Product */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-product">
                  Product <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => setSelectedProductId(val)}
                >
                  <SelectTrigger id="adj-product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Warehouse */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-warehouse">
                  Warehouse <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedWarehouseId}
                  onValueChange={(val) => {
                    setSelectedWarehouseId(val);
                    setSelectedLocationId("");
                  }}
                >
                  <SelectTrigger id="adj-warehouse">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Location */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-location">
                  Location / Bin <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedLocationId}
                  onValueChange={(val) => setSelectedLocationId(val)}
                >
                  <SelectTrigger id="adj-location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Action Type: Increase or Decrease */}
                <div className="space-y-1.5">
                  <Label htmlFor="adj-type">Adjustment Action</Label>
                  <Select
                    value={adjustmentType}
                    onValueChange={(val: "INCREASE" | "DECREASE") => setAdjustmentType(val)}
                  >
                    <SelectTrigger id="adj-type">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCREASE">Increase (+)</SelectItem>
                      <SelectItem value="DECREASE">Decrease (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label htmlFor="adj-qty">
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="adj-qty"
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="e.g. 50"
                    value={quantityStr}
                    onChange={(e) => setQuantityStr(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-reason">Reason</Label>
                <Select value={reason} onValueChange={(val) => setReason(val)}>
                  <SelectTrigger id="adj-reason">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COUNT_CORRECTION">Count Correction</SelectItem>
                    <SelectItem value="OPENING_BALANCE">Opening Balance</SelectItem>
                    <SelectItem value="FOUND">Stock Found</SelectItem>
                    <SelectItem value="DAMAGED">Damaged Goods</SelectItem>
                    <SelectItem value="LOST">Lost / Missing</SelectItem>
                    <SelectItem value="EXPIRED">Expired Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-notes">Notes / Reference</Label>
                <Textarea
                  id="adj-notes"
                  placeholder="Optional stock adjustment reason or reference number…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
