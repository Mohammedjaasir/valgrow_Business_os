import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/foundation/states";
import { staggerContainer, staggerItem } from "@/lib/motion";
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
        <div className="flex h-96 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin" />
          Loading register…
        </div>
      </AppShell>
    );
  }

  // 12. NO ACTIVE SESSION -> OPEN REGISTER SCREEN
  if (!activeSession) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-lg py-6 sm:py-12">
          <div className="panel overflow-hidden">
            <div className="border-b bg-surface-2/60 px-6 py-6 sm:px-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Calculator className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">Open register session</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Select your branch, warehouse and opening cash float to start selling.
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
              className="space-y-5 px-6 py-6 sm:px-8"
            >
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select value={openSessionBranchId} onValueChange={setOpenSessionBranchId} required>
                  <SelectTrigger className="h-10">
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

              <div className="space-y-1.5">
                <Label>Warehouse / dispatched from</Label>
                <Select
                  value={openSessionWarehouseId}
                  onValueChange={setOpenSessionWarehouseId}
                  required
                >
                  <SelectTrigger className="h-10">
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Terminal / register ID</Label>
                  <Input
                    value={openSessionTerminalId}
                    onChange={(e) => setOpenSessionTerminalId(e.target.value)}
                    className="h-10 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Opening cash float (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={openSessionOpeningCash}
                    onChange={(e) => setOpenSessionOpeningCash(e.target.value)}
                    className="tabular h-10"
                    required
                  />
                </div>
              </div>

              {openSessionMutation.isError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive-soft p-3 text-[13px] text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {(openSessionMutation.error as any)?.message || "Failed to open POS session"}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={
                  !openSessionBranchId ||
                  !openSessionWarehouseId ||
                  !canOpenSession ||
                  openSessionMutation.isPending
                }
              >
                {openSessionMutation.isPending ? (
                  <>
                    <RefreshCw className="animate-spin" />
                    Opening register…
                  </>
                ) : (
                  "Open register & start selling"
                )}
              </Button>
            </form>
          </div>
        </div>
      </AppShell>
    );
  }

  const cartItems = activeCart?.items ?? [];
  // Quantities can arrive as decimal strings from the API.
  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const money = (n: unknown) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ACTIVE SESSION UI
  return (
    <AppShell fullBleed>
      <div className="flex flex-col lg:h-[calc(100vh-3.5rem)]">
        {/* SESSION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-surface px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Calculator className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">{activeSession.terminalId}</span>
              <Badge variant={activeSession.status === "OPEN" ? "success" : "warning"}>
                <span
                  className={
                    activeSession.status === "OPEN"
                      ? "h-1.5 w-1.5 animate-pulse rounded-full bg-success"
                      : "h-1.5 w-1.5 rounded-full bg-warning"
                  }
                />
                {activeSession.status}
              </Badge>
            </div>
            <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
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

          <div className="flex flex-wrap items-center gap-1.5">
            {activeSession.status === "OPEN" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => suspendSessionMutation.mutate(activeSession.id)}
                disabled={suspendSessionMutation.isPending}
              >
                <PauseCircle />
                Suspend
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resumeSessionMutation.mutate(activeSession.id)}
                disabled={resumeSessionMutation.isPending}
              >
                <Play className="text-success" />
                Resume
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={() => setShowHeldModal(true)}>
              <PauseCircle />
              Held sales
            </Button>

            {canRefund && (
              <Button variant="ghost" size="sm" onClick={() => setShowRefundModal(true)}>
                <RotateCcw />
                Refunds
              </Button>
            )}

            {canCloseSession && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive-soft hover:text-destructive"
                onClick={() => {
                  setClosingCash(String(activeSession.openingCash || 0));
                  setShowCloseModal(true);
                }}
              >
                Close register
              </Button>
            )}
          </div>
        </div>

        {/* MAIN TWO-PANE REGISTER */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* LEFT: SCAN + CATALOG */}
          <div className="flex min-h-0 flex-col gap-4 p-4 sm:p-6">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={barcodeRef}
                    type="text"
                    placeholder="Scan or enter SKU…"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="h-11 pl-10 font-mono text-sm"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 px-4"
                  disabled={isSearchingBarcode || !barcodeInput.trim()}
                >
                  {isSearchingBarcode ? <RefreshCw className="animate-spin" /> : "Add"}
                </Button>
              </form>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search catalog by name or SKU…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-9"
                />
              </div>
            </div>

            <AnimatePresence>
              {barcodeError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  role="alert"
                  className="-mt-1 flex items-center gap-1.5 text-[13px] text-destructive"
                >
                  <AlertCircle className="h-4 w-4" />
                  {barcodeError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isProductsLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="panel h-[116px] p-3">
                      <div className="shimmer h-3.5 w-3/4 rounded bg-muted" />
                      <div className="shimmer mt-2 h-3 w-1/2 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <EmptyState
                  icon={<ShoppingBag className="h-5 w-5" />}
                  title={searchQuery ? `No products match "${searchQuery}"` : "No products available"}
                  description="Try a different name or SKU, or scan a barcode."
                />
              ) : (
                <motion.div
                  variants={staggerContainer(0.025)}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4"
                >
                  {products.map((prod) => {
                    const stock = prod.availableStock ?? 0;
                    return (
                      <motion.button
                        key={prod.id}
                        type="button"
                        variants={staggerItem}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleAddProductToCart(prod)}
                        className="group panel relative flex min-h-[116px] flex-col justify-between p-3 text-left transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
                            {prod.name}
                          </div>
                          <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                            {prod.sku}
                          </div>
                        </div>
                        <div className="mt-3 flex items-end justify-between gap-2">
                          <span className="tabular text-sm font-semibold text-foreground">
                            {money(prod.retailPrice || prod.costPrice)}
                          </span>
                          <Badge
                            variant={stock <= 0 ? "destructive-soft" : stock <= 5 ? "warning" : "neutral"}
                            className="tabular px-1.5 text-[11px]"
                          >
                            {stock <= 0 ? "Out" : `${stock} in stock`}
                          </Badge>
                        </div>
                        <span className="pointer-events-none absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground opacity-0 shadow-xs transition-opacity group-hover:opacity-100">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>

          {/* RIGHT: CART & CHECKOUT */}
          <div
            id="pos-cart"
            className="flex min-h-[480px] flex-col border-t bg-surface lg:min-h-0 lg:border-l lg:border-t-0"
          >
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-sm font-semibold">Current order</span>
                {cartItems.length > 0 && (
                  <Badge variant="brand" className="tabular">
                    {cartCount} {cartCount === 1 ? "item" : "items"}
                  </Badge>
                )}
              </div>
              <div className="w-44 min-w-0">
                <Select value={selectedCustomerId} onValueChange={(val) => setSelectedCustomerId(val)}>
                  <SelectTrigger className="h-8 text-[13px]">
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

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {cartItems.length === 0 ? (
                <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-surface-2 text-muted-foreground">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold">Cart is empty</p>
                  <p className="text-[13px] text-muted-foreground">
                    Scan a barcode or tap a product to add it.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.2 }}
                      className="group flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-surface-2/70"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{item.product?.name}</div>
                        <div className="tabular truncate text-xs text-muted-foreground">
                          {item.variant ? `${item.variant.name} · ` : ""}
                          {money(item.unitPrice)} each
                        </div>
                      </div>

                      <div className="flex items-center rounded-md border bg-surface shadow-xs">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() =>
                            item.quantity > 1
                              ? updateItemMutation.mutate({
                                  cartId: activeCart!.id,
                                  itemId: item.id,
                                  dto: { quantity: item.quantity - 1 },
                                })
                              : removeItemMutation.mutate({
                                  cartId: activeCart!.id,
                                  itemId: item.id,
                                })
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="tabular w-7 text-center text-[13px] font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() =>
                            updateItemMutation.mutate({
                              cartId: activeCart!.id,
                              itemId: item.id,
                              dto: { quantity: item.quantity + 1 },
                            })
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="tabular w-20 text-right text-[13px] font-semibold">
                        {money(item.totalAmount)}
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${item.product?.name ?? "item"}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
                        onClick={() =>
                          removeItemMutation.mutate({ cartId: activeCart!.id, itemId: item.id })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="space-y-3 border-t bg-surface-2/40 px-4 py-4">
              <dl className="tabular space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{money(activeCart?.subtotalAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="text-destructive">-{money(activeCart?.discountAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd>{money(activeCart?.taxAmount)}</dd>
                </div>
              </dl>
              <div className="flex items-end justify-between border-t pt-3">
                <span className="text-sm font-medium">Total</span>
                <span className="tabular font-display text-2xl font-semibold tracking-tight">
                  {money(activeCart?.totalAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => activeCartId && holdCartMutation.mutate({ cartId: activeCartId })}
                  disabled={!activeCart?.items.length || holdCartMutation.isPending}
                >
                  <PauseCircle />
                  Hold
                </Button>
                <Button
                  variant="outline"
                  onClick={() => activeCartId && clearCartMutation.mutate(activeCartId)}
                  disabled={!activeCart?.items.length}
                >
                  <X />
                  Clear
                </Button>
              </div>
              <Button
                size="lg"
                className="h-12 w-full text-base"
                onClick={handleOpenCheckout}
                disabled={!activeCart?.items.length || !canCheckout}
              >
                Charge {money(activeCart?.totalAmount)}
              </Button>
            </div>
          </div>
        </div>

        {/* MOBILE: JUMP TO CART */}
        {cartItems.length > 0 && (
          <div className="sticky bottom-0 z-10 border-t bg-background/90 p-3 backdrop-blur lg:hidden">
            <Button asChild size="lg" className="w-full">
              <a href="#pos-cart">
                <ShoppingBag />
                View cart ({cartCount}) · {money(activeCart?.totalAmount)}
              </a>
            </Button>
          </div>
        )}

        {/* CHECKOUT MODAL */}
        <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Collect payment</DialogTitle>
              <DialogDescription>
                Take payment with one method or split it across several.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-1 text-sm">
              <div className="tabular rounded-lg border bg-surface-2/60 p-4">
                <div className="flex justify-between text-[13px] text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{money(activeCart?.subtotalAmount)}</span>
                </div>
                <div className="mt-1 flex justify-between text-[13px] text-muted-foreground">
                  <span>Tax</span>
                  <span>{money(activeCart?.taxAmount)}</span>
                </div>
                <div className="mt-3 flex items-end justify-between border-t pt-3">
                  <span className="text-sm font-medium">Amount due</span>
                  <span className="font-display text-2xl font-semibold tracking-tight">
                    {money(activeCart?.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Payment methods</span>
                  <Button variant="ghost" size="xs" onClick={handleAddPaymentRow}>
                    <Plus />
                    Split payment
                  </Button>
                </div>

                <AnimatePresence initial={false}>
                  {payments.map((p, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2"
                    >
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
                        <SelectTrigger className="h-9 w-36 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CREDIT_CARD">Card</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
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
                        className="tabular h-9"
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
                          className="tabular h-9 w-28"
                        />
                      )}

                      {payments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove payment"
                          className="h-9 w-9 shrink-0 hover:text-destructive"
                          onClick={() => handleRemovePaymentRow(idx)}
                        >
                          <X />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {payments.some(
                (p) =>
                  p.paymentMethod === "CASH" && p.receivedAmount && p.receivedAmount > p.amount,
              ) && (
                <div className="flex items-center justify-between rounded-lg bg-success-soft px-4 py-3 text-success">
                  <span className="text-[13px] font-medium">Change due to customer</span>
                  <span className="tabular text-base font-semibold">
                    {money(
                      payments
                        .filter((p) => p.paymentMethod === "CASH")
                        .reduce(
                          (sum, p) => sum + ((p.receivedAmount || p.amount) - p.amount),
                          0,
                        ),
                    )}
                  </span>
                </div>
              )}

              {checkoutMutation.isError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive-soft p-3 text-[13px] text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {(checkoutMutation.error as any)?.message || "Checkout failed"}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCheckoutModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmCheckout} disabled={checkoutMutation.isPending}>
                {checkoutMutation.isPending ? (
                  <>
                    <RefreshCw className="animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 />
                    Complete sale
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* POST-CHECKOUT RECEIPT MODAL */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader className="items-center text-center sm:text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.05 }}
                className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success"
              >
                <CheckCircle2 className="h-6 w-6" />
              </motion.div>
              <DialogTitle>Sale completed</DialogTitle>
              <DialogDescription className="font-mono text-[13px]">
                Receipt #{completedSale?.sale.receiptNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="tabular space-y-2 rounded-lg border bg-surface-2/60 p-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total paid</span>
                <span className="font-semibold">{money(completedSale?.sale.totalAmount)}</span>
              </div>

              {Number(completedSale?.sale.changeAmount || 0) > 0 && (
                <div className="flex justify-between font-medium text-success">
                  <span>Change returned</span>
                  <span>{money(completedSale?.sale.changeAmount)}</span>
                </div>
              )}

              <div className="space-y-1 border-t pt-2">
                {completedSale?.sale.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-muted-foreground">
                    <span>{p.paymentMethod.replace(/_/g, " ")}</span>
                    <span>{money(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex-row gap-2 sm:justify-between">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  handleDownloadReceipt(completedSale?.sale.id, completedSale?.sale.receiptNumber)
                }
              >
                <Printer />
                Receipt
              </Button>

              <Button
                className="flex-1"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCompletedSale(null);
                }}
              >
                New sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CLOSE REGISTER MODAL */}
        <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Close register</DialogTitle>
              <DialogDescription>
                Enter the counted cash to reconcile and close this terminal session.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1 text-sm">
              <div className="space-y-1.5">
                <Label>Counted cash (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="tabular h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Closing notes</Label>
                <Input
                  placeholder="End of shift remarks…"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
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
                {closeSessionMutation.isPending ? "Closing…" : "Close register"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
