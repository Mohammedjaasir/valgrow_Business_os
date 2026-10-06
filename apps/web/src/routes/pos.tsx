import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { useBranches, type BranchItem } from "@/hooks/queries/useBranches";
import { useWarehouses, type WarehouseItem } from "@/hooks/queries/useWarehouses";
import { useCustomers, type CustomerItem } from "@/hooks/queries/useCustomers";
import {
  usePOSSessions,
  useOpenPOSSession,
  useClosePOSSession,
  useSuspendPOSSession,
  useResumePOSSession,
  type POSSessionItem,
} from "@/hooks/queries/usePOSSessions";
import {
  usePOSProductSearch,
  findPOSProductByBarcode,
  type POSProductItem,
} from "@/hooks/queries/usePOSProducts";
import {
  usePOSCart,
  useCreatePOSCart,
  useAddPOSCartItem,
  useUpdatePOSCartItem,
  useRemovePOSCartItem,
  useHoldPOSCart,
  useResumePOSCart,
  useClearPOSCart,
} from "@/hooks/queries/usePOSCarts";
import {
  usePOSCheckout,
  usePOSSales,
  type CustomerPaymentMethod,
  type POSSaleResult,
} from "@/hooks/queries/usePOSCheckout";
import { downloadFile } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Printer,
  Building2,
  Warehouse,
  User,
  ShoppingBag,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/pos")({
  component: POSRegisterPage,
});

function POSRegisterPage() {
  const { data: currentUser } = useCurrentUser();
  const isOwner = currentUser?.role?.name === "Owner";
  const permissions = currentUser?.permissions || [];
  const canOpenSession = isOwner || permissions.includes("pos.session");
  const canCloseSession = isOwner || permissions.includes("pos.close");
  const canCheckout = isOwner || permissions.includes("pos.checkout");
  const canRefund = isOwner || permissions.includes("pos.refund");

  // Masters
  const { data: branchesRes } = useBranches();
  const { data: warehousesRes } = useWarehouses();
  const { data: customersRes } = useCustomers();

  const branches: BranchItem[] = branchesRes || [];
  const warehouses: WarehouseItem[] = warehousesRes || [];
  const customers: CustomerItem[] = customersRes || [];

  // Active POS Session Query
  const { data: openSessions, isLoading: isSessionLoading } = usePOSSessions("OPEN");
  const activeSession: POSSessionItem | undefined = openSessions?.[0];

  // Open Session Form State
  const [openSessionBranchId, setOpenSessionBranchId] = useState("");
  const [openSessionWarehouseId, setOpenSessionWarehouseId] = useState("");
  const [openSessionTerminalId, setOpenSessionTerminalId] = useState("REG-01");
  const [openSessionOpeningCash, setOpenSessionOpeningCash] = useState("1000");

  // Auto-initialize branch and warehouse selection when master data loads
  useEffect(() => {
    if (!openSessionBranchId && branches.length > 0 && branches[0]?.id) {
      setOpenSessionBranchId(branches[0].id);
    }
  }, [branches, openSessionBranchId]);

  useEffect(() => {
    if (!openSessionWarehouseId && warehouses.length > 0 && warehouses[0]?.id) {
      setOpenSessionWarehouseId(warehouses[0].id);
    }
  }, [warehouses, openSessionWarehouseId]);

  const openSessionMutation = useOpenPOSSession();
  const closeSessionMutation = useClosePOSSession();
  const suspendSessionMutation = useSuspendPOSSession();
  const resumeSessionMutation = useResumePOSSession();

  // Close Session Modal State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingCash, setClosingCash] = useState("0");
  const [closeNotes, setCloseNotes] = useState("");

  // Cart State
  const [activeCartId, setActiveCartId] = useState<string | null>(null);
  const { data: activeCart } = usePOSCart(activeCartId || undefined);

  const createCartMutation = useCreatePOSCart();
  const addItemMutation = useAddPOSCartItem();
  const updateItemMutation = useUpdatePOSCartItem();
  const removeItemMutation = useRemovePOSCartItem();
  const holdCartMutation = useHoldPOSCart();
  const clearCartMutation = useClearPOSCart();

  // Auto-create cart when session becomes active
  useEffect(() => {
    if (activeSession && !activeCartId) {
      if (activeSession.carts && activeSession.carts.length > 0) {
        const activeC = activeSession.carts.find((c: { status: string }) => c.status === "ACTIVE");
        if (activeC) {
          setActiveCartId(activeC.id);
          return;
        }
      }
      createCartMutation.mutate(
        {
          branchId: activeSession.branchId,
          warehouseId: activeSession.warehouseId,
          sessionId: activeSession.id,
        },
        {
          onSuccess: (newCart) => setActiveCartId(newCart.id),
        },
      );
    }
  }, [activeSession, activeCartId]);

  // Product Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const { data: searchResult, isLoading: isProductsLoading } = usePOSProductSearch({
    search: searchQuery || undefined,
    warehouseId: activeSession?.warehouseId || undefined,
    limit: 12,
  });
  const products = searchResult?.data || [];

  // Core Barcode Scanning Processor (Shared by manual form and USB scanner listener)
  const processBarcodeScan = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setBarcodeError(null);
    setIsSearchingBarcode(true);

    try {
      const match = await findPOSProductByBarcode(cleanCode);
      if (match) {
        let targetCartId = activeCartId;
        if (!targetCartId && activeSession) {
          const newCart = await createCartMutation.mutateAsync({
            branchId: activeSession.branchId,
            warehouseId: activeSession.warehouseId,
            sessionId: activeSession.id,
          });
          targetCartId = newCart.id;
          setActiveCartId(newCart.id);
        }

        if (targetCartId) {
          await addItemMutation.mutateAsync({
            cartId: targetCartId,
            dto: {
              productId: match.product.id,
              variantId: match.variant?.id || undefined,
              quantity: 1,
              unitPrice: Number(match.price || 0),
            },
          });
        }
        setBarcodeInput("");
      } else {
        setBarcodeError(`No product found matching barcode "${cleanCode}"`);
      }
    } catch {
      setBarcodeError("Error scanning barcode. Please try again.");
    } finally {
      setIsSearchingBarcode(false);
      barcodeRef.current?.focus();
    }
  };

  // Barcode Submission Handler (Manual Input Form)
  const handleBarcodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;
    await processBarcodeScan(barcodeInput);
  };

  // Add Product Card Handler
  const handleAddProductToCart = async (product: POSProductItem, variantId?: string) => {
    if (!activeSession) return;
    let targetCartId = activeCartId;

    if (!targetCartId) {
      const newCart = await createCartMutation.mutateAsync({
        branchId: activeSession.branchId,
        warehouseId: activeSession.warehouseId,
        sessionId: activeSession.id,
      });
      targetCartId = newCart.id;
      setActiveCartId(newCart.id);
    }

    const price = Number(product.retailPrice || product.costPrice || 0);
    await addItemMutation.mutateAsync({
      cartId: targetCartId,
      dto: {
        productId: product.id,
        variantId: variantId || undefined,
        quantity: 1,
        unitPrice: price,
      },
    });
  };

  const handleDownloadReceipt = async (saleId?: string, receiptNum?: string) => {
    if (!saleId) return;
    try {
      await downloadFile(`/pos/sales/${saleId}/receipt`, `${receiptNum || "POS-Receipt"}.pdf`);
    } catch (err: any) {
      alert(err.message || "Failed to download POS receipt PDF");
    }
  };

  // Held Carts Modal State
  const [showHeldModal, setShowHeldModal] = useState(false);

  // Selected Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walkin");

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [payments, setPayments] = useState<
    {
      paymentMethod: CustomerPaymentMethod;
      amount: number;
      receivedAmount?: number | undefined;
      referenceNumber?: string | undefined;
    }[]
  >([{ paymentMethod: "CASH", amount: 0, receivedAmount: 0 }]);
  const [cartDiscount, setCartDiscount] = useState("0");

  const checkoutMutation = usePOSCheckout();
  const [completedSale, setCompletedSale] = useState<POSSaleResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Open Checkout Dialog
  const handleOpenCheckout = () => {
    if (!activeCart || activeCart.items.length === 0) return;
    const grandTotal = Number(activeCart.totalAmount);
    setPayments([{ paymentMethod: "CASH", amount: grandTotal, receivedAmount: grandTotal }]);
    setCartDiscount("0");
    setShowCheckoutModal(true);
  };

  // Add Split Payment Method
  const handleAddPaymentRow = () => {
    setPayments((prev) => [...prev, { paymentMethod: "UPI", amount: 0 }]);
  };

  const handleRemovePaymentRow = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Checkout
  const handleConfirmCheckout = () => {
    if (!activeSession || !activeCartId) return;

    checkoutMutation.mutate(
      {
        sessionId: activeSession.id,
        cartId: activeCartId,
        customerId: selectedCustomerId !== "walkin" ? selectedCustomerId : undefined,
        payments: payments.map((p) => ({
          paymentMethod: p.paymentMethod,
          amount: Number(p.amount),
          receivedAmount:
            p.paymentMethod === "CASH" ? Number(p.receivedAmount || p.amount) : undefined,
          referenceNumber: p.referenceNumber || undefined,
        })),
        cartDiscountAmount: Number(cartDiscount || 0),
      },
      {
        onSuccess: (saleResult) => {
          setCompletedSale(saleResult);
          setShowCheckoutModal(false);
          setShowSuccessModal(true);
          setActiveCartId(null);
          setSelectedCustomerId("walkin");
        },
      },
    );
  };

  // Refunds Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  usePOSSales(activeSession?.id);

  // Global USB HID Barcode Scanner Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = 0;
    const INTER_CHAR_TIMEOUT = 50; // ms threshold for USB HID rapid key stream

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore if no active POS register session
      if (!activeSession) return;

      // 2. Ignore if any modal/dialog is open
      if (showCloseModal || showHeldModal || showCheckoutModal || showSuccessModal || showRefundModal) {
        buffer = "";
        return;
      }

      // 3. Ignore if active element is a text input, textarea, select, or contenteditable
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isEditable =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable;

      if (isEditable) {
        buffer = "";
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // Reset buffer if delay between keystrokes exceeds rapid scan threshold
      if (lastKeyTime > 0 && timeDiff > INTER_CHAR_TIMEOUT) {
        buffer = "";
      }

      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.length >= 2) {
          e.preventDefault();
          const scannedCode = buffer;
          buffer = "";
          processBarcodeScan(scannedCode);
        } else {
          buffer = "";
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeSession,
    activeCartId,
    showCloseModal,
    showHeldModal,
    showCheckoutModal,
    showSuccessModal,
    showRefundModal,
  ]);

  // If Session Loading
  if (isSessionLoading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  // 12. NO ACTIVE SESSION -> OPEN REGISTER SCREEN
  if (!activeSession) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl py-12">
          <div className="rounded-xl border bg-card p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calculator className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold">Open POS Register Session</h1>
              <p className="text-sm text-muted-foreground">
                Select your branch, warehouse, and opening cash float to begin selling.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                openSessionMutation.mutate({
                  branchId: openSessionBranchId,
                  warehouseId: openSessionWarehouseId,
                  terminalId: openSessionTerminalId,
                  openingCash: Number(openSessionOpeningCash),
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label>Branch</Label>
                <Select value={openSessionBranchId} onValueChange={setOpenSessionBranchId} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b: BranchItem) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Warehouse / Dispatched From</Label>
                <Select
                  value={openSessionWarehouseId}
                  onValueChange={setOpenSessionWarehouseId}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w: WarehouseItem) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Terminal / Register ID</Label>
                  <Input
                    value={openSessionTerminalId}
                    onChange={(e) => setOpenSessionTerminalId(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Opening Cash Float (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={openSessionOpeningCash}
                    onChange={(e) => setOpenSessionOpeningCash(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {openSessionMutation.isError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {(openSessionMutation.error as any)?.message || "Failed to open POS session"}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  !openSessionBranchId ||
                  !openSessionWarehouseId ||
                  !canOpenSession ||
                  openSessionMutation.isPending
                }
              >
                {openSessionMutation.isPending
                  ? "Opening Register..."
                  : "Open Register & Start Selling"}
              </Button>
            </form>
          </div>
        </div>
      </AppShell>
    );
  }

  // ACTIVE SESSION UI
  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 p-4">
        {/* HEADER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-semibold">
              <Calculator className="h-5 w-5 text-primary" />
              <span>POS Register — {activeSession.terminalId}</span>
              <Badge
                variant="outline"
                className="border-emerald-500 bg-emerald-50 text-emerald-700"
              >
                {activeSession.status}
              </Badge>
            </div>
            <div className="hidden text-xs text-muted-foreground md:flex md:items-center md:gap-3">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {activeSession.branch?.name}
              </span>
              <span className="flex items-center gap-1">
                <Warehouse className="h-3.5 w-3.5" />
                {activeSession.warehouse?.name}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {activeSession.openedBy?.firstName} {activeSession.openedBy?.lastName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSession.status === "OPEN" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => suspendSessionMutation.mutate(activeSession.id)}
                disabled={suspendSessionMutation.isPending}
              >
                <PauseCircle className="mr-1.5 h-4 w-4" />
                Suspend
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => resumeSessionMutation.mutate(activeSession.id)}
                disabled={resumeSessionMutation.isPending}
              >
                <Play className="mr-1.5 h-4 w-4 text-emerald-600" />
                Resume
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowHeldModal(true)}>
              <PauseCircle className="mr-1.5 h-4 w-4" />
              Held Sales
            </Button>

            {canRefund && (
              <Button variant="outline" size="sm" onClick={() => setShowRefundModal(true)}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Refunds
              </Button>
            )}

            {canCloseSession && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setClosingCash(String(activeSession.openingCash || 0));
                  setShowCloseModal(true);
                }}
              >
                Close Register
              </Button>
            )}
          </div>
        </div>

        {/* BARCODE SCANNER INPUT */}
        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                ref={barcodeRef}
                type="text"
                placeholder="Scan Barcode or enter SKU / serial number and press Enter..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="pl-10 font-mono text-base"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isSearchingBarcode || !barcodeInput.trim()}>
              {isSearchingBarcode ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Scan Item"}
            </Button>
          </form>
          {barcodeError && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {barcodeError}
            </div>
          )}
        </div>

        {/* MAIN TWO-COLUMN REGISTER GRID */}
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12">
          {/* LEFT CATALOG / SEARCH (7 COLS) */}
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm lg:col-span-7 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product catalog by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {isProductsLoading ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                  <span>No products found matching "{searchQuery}"</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {products.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleAddProductToCart(prod)}
                      className="flex flex-col justify-between rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-accent/50"
                    >
                      <div>
                        <div className="font-semibold line-clamp-1">{prod.name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {prod.sku}</div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs">
                        <span className="font-bold text-primary">
                          ₹{Number(prod.retailPrice || prod.costPrice || 0).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                          Stk: {prod.availableStock ?? 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT ACTIVE CART & CHECKOUT PANEL (5 COLS) */}
          <div className="flex flex-col rounded-lg border bg-card p-4 shadow-sm lg:col-span-5 overflow-hidden">
            {/* CART HEADER & CUSTOMER SELECTOR */}
            <div className="mb-3 flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <span className="font-semibold">Current Order</span>
                {activeCart?.items && (
                  <Badge variant="secondary">{activeCart.items.length} items</Badge>
                )}
              </div>

              <div className="w-44">
                <Select
                  value={selectedCustomerId}
                  onValueChange={(val) => setSelectedCustomerId(val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walkin">Walk-in Customer</SelectItem>
                    {customers.map((c: CustomerItem) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.customerCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CART ITEMS LIST */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {!activeCart?.items || activeCart.items.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                  <span>Cart is empty. Scan barcode or click items to add.</span>
                </div>
              ) : (
                activeCart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border bg-background p-2.5 text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-medium">{item.product?.name}</div>
                      {item.variant && (
                        <div className="text-muted-foreground">{item.variant.name}</div>
                      )}
                      <div className="text-muted-foreground">
                        ₹{Number(item.unitPrice || 0).toFixed(2)} / unit
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-none"
                          onClick={() =>
                            item.quantity > 1
                              ? updateItemMutation.mutate({
                                  cartId: activeCart.id,
                                  itemId: item.id,
                                  dto: { quantity: item.quantity - 1 },
                                })
                              : removeItemMutation.mutate({
                                  cartId: activeCart.id,
                                  itemId: item.id,
                                })
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-mono font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-none"
                          onClick={() =>
                            updateItemMutation.mutate({
                              cartId: activeCart.id,
                              itemId: item.id,
                              dto: { quantity: item.quantity + 1 },
                            })
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="w-16 text-right font-bold text-foreground">
                        ₹{Number(item.totalAmount || 0).toFixed(2)}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          removeItemMutation.mutate({ cartId: activeCart.id, itemId: item.id })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CART TOTALS & CHECKOUT BUTTON */}
            <div className="mt-3 border-t pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">
                  ₹{Number(activeCart?.subtotalAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-mono text-destructive">
                  -₹{Number(activeCart?.discountAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">₹{Number(activeCart?.taxAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Grand Total</span>
                <span className="text-primary font-mono">
                  ₹{Number(activeCart?.totalAmount || 0).toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activeCartId && holdCartMutation.mutate({ cartId: activeCartId })}
                  disabled={!activeCart?.items.length || holdCartMutation.isPending}
                >
                  Hold
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activeCartId && clearCartMutation.mutate(activeCartId)}
                  disabled={!activeCart?.items.length}
                >
                  Clear
                </Button>

                <Button
                  size="sm"
                  className="col-span-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={handleOpenCheckout}
                  disabled={!activeCart?.items.length || !canCheckout}
                >
                  CHECKOUT
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CHECKOUT MODAL */}
        <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Sale & Collect Payment</DialogTitle>
              <DialogDescription>
                Collect payment across one or split payment methods.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg bg-muted p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    ₹{Number(activeCart?.subtotalAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>₹{Number(activeCart?.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold text-sm">
                  <span>Total Amount Due</span>
                  <span className="text-primary font-mono">
                    ₹{Number(activeCart?.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* SPLIT PAYMENT METHOD LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between font-semibold text-xs">
                  <span>Payment Method Breakdown</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={handleAddPaymentRow}
                  >
                    + Split Payment
                  </Button>
                </div>

                {payments.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Select
                      value={p.paymentMethod}
                      onValueChange={(val) => {
                        setPayments((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, paymentMethod: val as CustomerPaymentMethod }
                              : item,
                          ),
                        );
                      }}
                    >
                      <SelectTrigger className="w-36 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">CASH</SelectItem>
                        <SelectItem value="CREDIT_CARD">CARD</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="BANK_TRANSFER">BANK TRANSFER</SelectItem>
                        <SelectItem value="OTHER">OTHER</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={p.amount || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPayments((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  amount: val,
                                  receivedAmount:
                                    item.paymentMethod === "CASH" ? val : item.receivedAmount,
                                }
                              : item,
                          ),
                        );
                      }}
                      className="h-9 font-mono"
                    />

                    {p.paymentMethod === "CASH" && (
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Received"
                        value={p.receivedAmount || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPayments((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, receivedAmount: val } : item,
                            ),
                          );
                        }}
                        className="h-9 font-mono w-28"
                      />
                    )}

                    {payments.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => handleRemovePaymentRow(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* CASH CHANGE DISPLAY */}
              {payments.some(
                (p) =>
                  p.paymentMethod === "CASH" && p.receivedAmount && p.receivedAmount > p.amount,
              ) && (
                <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-3 text-emerald-800">
                  <div className="flex justify-between font-bold text-sm">
                    <span>Cash Change Due to Customer:</span>
                    <span className="font-mono">
                      ₹
                      {Number(
                        payments
                          .filter((p) => p.paymentMethod === "CASH")
                          .reduce(
                            (sum, p) => sum + ((p.receivedAmount || p.amount) - p.amount),
                            0,
                          ),
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {checkoutMutation.isError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  {(checkoutMutation.error as any)?.message || "Checkout failed"}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCheckoutModal(false)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={handleConfirmCheckout}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? "Processing..." : "Confirm & Complete Checkout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* POST-CHECKOUT RECEIPT MODAL */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Sale Completed Successfully!</DialogTitle>
              <DialogDescription className="text-center font-mono text-base font-bold text-primary">
                Receipt #{completedSale?.sale.receiptNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs border-y my-2">
              <div className="flex justify-between">
                <span>Total Paid Amount</span>
                <span className="font-bold font-mono">
                  ₹
                  {Number(completedSale?.sale.totalAmount || 0).toFixed(2)}
                </span>
              </div>

              {Number(completedSale?.sale.changeAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Change Returned</span>
                  <span className="font-mono">
                    ₹
                    {Number(completedSale?.sale.changeAmount || 0).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="mt-2 space-y-1">
                <span className="font-semibold text-muted-foreground">Payment Methods:</span>
                {completedSale?.sale.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-muted-foreground">
                    <span>{p.paymentMethod}</span>
                    <span className="font-mono">₹{Number(p.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex-row gap-2 sm:justify-between">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleDownloadReceipt(completedSale?.sale.id, completedSale?.sale.receiptNumber)}
              >
                <Printer className="mr-2 h-4 w-4" />
                Download / Print Receipt
              </Button>

              <Button
                className="flex-1"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCompletedSale(null);
                }}
              >
                New Sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CLOSE REGISTER MODAL */}
        <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Register & Cash Reconciliation</DialogTitle>
              <DialogDescription>
                Enter final counted cash to close terminal session.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div>
                <Label>Counted Cash (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label>Closing Notes</Label>
                <Input
                  placeholder="End of shift remarks..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCloseModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (activeSession) {
                    closeSessionMutation.mutate(
                      {
                        id: activeSession.id,
                        dto: {
                          closingCash: Number(closingCash),
                          notes: closeNotes,
                        },
                      },
                      {
                        onSuccess: () => setShowCloseModal(false),
                      },
                    );
                  }
                }}
                disabled={closeSessionMutation.isPending}
              >
                {closeSessionMutation.isPending ? "Closing..." : "Close Register"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
