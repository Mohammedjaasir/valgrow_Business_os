import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CodeCell,
  ListPage,
  NameCell,
  NumberCell,
  StatusBadge,
  type ListRow,
} from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  type CustomerItem,
} from "@/hooks/queries/useCustomers";
import { useCustomer360 } from "@/hooks/queries/useCustomer360";
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
import { Plus, Trash2, Eye, Edit2 } from "lucide-react";

const title = "Customers";
const description = "Customer Directory, credit limits, contact information, and billing terms.";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("sales.create");
  const canUpdate = permissions.includes("sales.update");
  const canDelete = permissions.includes("sales.delete");

  const {
    data: customersData,
    isLoading,
    isError: isCustomersError,
    refetch: refetchCustomers,
  } = useCustomers();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [customerCode, setCustomerCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [postalCode, setPostalCode] = useState("");
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState("NET30");

  const resetForm = () => {
    setCustomerCode("");
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("India");
    setPostalCode("");
    setTaxIdNumber("");
    setCurrency("INR");
    setCreditLimit(0);
    setPaymentTerms("NET30");
    setErrorMsg(null);
  };

  const handleOpenEdit = (customer: CustomerItem) => {
    setEditingCustomer(customer);
    setCustomerCode(customer.customerCode);
    setName(customer.name);
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setAddress(customer.address || "");
    setCity(customer.city || "");
    setState(customer.state || "");
    setCountry(customer.country || "India");
    setPostalCode(customer.postalCode || "");
    setTaxIdNumber(customer.taxIdNumber || customer.taxNumber || "");
    setCurrency(customer.currency || "INR");
    setCreditLimit(customer.creditLimit || 0);
    setPaymentTerms(customer.paymentTerms || "NET30");
    setErrorMsg(null);
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!customerCode || !name) return;
    setErrorMsg(null);
    try {
      if (editingCustomer) {
        await updateCustomerMutation.mutateAsync({
          id: editingCustomer.id,
          data: {
            name,
            email: email || null,
            phone: phone || null,
            address: address || null,
            city: city || null,
            state: state || null,
            country: country || null,
            postalCode: postalCode || null,
            taxIdNumber: taxIdNumber || null,
            currency,
            creditLimit: Number(creditLimit),
            paymentTerms,
          },
        });
      } else {
        await createCustomerMutation.mutateAsync({
          customerCode,
          name,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          country: country || undefined,
          postalCode: postalCode || undefined,
          taxIdNumber: taxIdNumber || undefined,
          currency,
          creditLimit: Number(creditLimit),
          paymentTerms,
        });
      }
      setIsAddOpen(false);
      setEditingCustomer(null);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save customer");
    }
  };

  const columns: Column<ListRow>[] = [
    {
      key: "name",
      header: "Customer",
      render: (r) => <NameCell value={String(r["name"] ?? "")} sub={String(r["email"] ?? "")} />,
    },
    {
      key: "customerCode",
      header: "Code",
      render: (r) => <CodeCell value={String(r["customerCode"] ?? "")} />,
    },
    { key: "phone", header: "Phone" },
    { key: "currency", header: "Currency" },
    {
      key: "creditLimit",
      header: "Credit limit",
      className: "text-right",
      render: (r) => <NumberCell value={String(r["creditLimit"] ?? "")} />,
    },
    { key: "paymentTerms", header: "Terms" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const item = customersData?.find((c) => c.id === r["id"]);
        if (!item) return null;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedCustomer(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleOpenEdit(item)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteCustomerMutation.mutate(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = customersData
    ? customersData.map((c) => ({
        id: c.id,
        customerCode: c.customerCode,
        name: c.name,
        email: c.email || "N/A",
        phone: c.phone || "N/A",
        currency: c.currency,
        creditLimit: `₹${Number(c.creditLimit).toLocaleString("en-IN")}`,
        paymentTerms: c.paymentTerms || "NET30",
        status: c.status === "ACTIVE" ? "Active" : c.status,
      }))
    : [];

  const stats = [
    { label: "Total Customers", value: isLoading ? "…" : String(customersData?.length || 0) },
    {
      label: "Active Accounts",
      value: isLoading
        ? "…"
        : String(customersData?.filter((c) => c.status === "ACTIVE").length || 0),
    },
    {
      label: "Default Terms",
      value: "NET30",
    },
  ];

  return (
    <>
      <ListPage guide="customers"
        title={title}
        description={description}
        eyebrow="Sales & Accounts"
        actionLabel="New customer"
        onAction={() => {
          setEditingCustomer(null);
          resetForm();
          setIsAddOpen(true);
        }}
        stats={stats}
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        isError={isCustomersError}
        onRetry={() => refetchCustomers()}
      />

      {/* Create / Edit Customer Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Update customer details and billing terms."
                : "Register a new customer account for quotations and sales orders."}
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cCode">Customer Code *</Label>
              <Input
                id="cCode"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                placeholder="e.g. CUST-001"
                disabled={Boolean(editingCustomer)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cName">Customer Name *</Label>
              <Input
                id="cName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
              <Input
                id="creditLimit"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="NET30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxIdNumber">Tax ID / GSTIN</Label>
              <Input
                id="taxIdNumber"
                value={taxIdNumber}
                onChange={(e) => setTaxIdNumber(e.target.value)}
                placeholder="29ABCDE1234F1Z5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bengaluru"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createCustomerMutation.isPending ||
                updateCustomerMutation.isPending ||
                !customerCode ||
                !name
              }
            >
              {createCustomerMutation.isPending || updateCustomerMutation.isPending
                ? "Saving…"
                : "Save Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer 360 View Dialog */}
      {selectedCustomer && (
        <Customer360Dialog customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </>
  );
}

function Customer360Dialog({ customer, onClose }: { customer: CustomerItem; onClose: () => void }) {
  const { data: c360, isLoading } = useCustomer360(customer.id);
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "METRICS" | "CONTACTS" | "SALES" | "CRM">(
    "TIMELINE",
  );

  return (
    <Dialog open={Boolean(customer)} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-lg font-bold">
                {customer.name} ({customer.customerCode})
              </DialogTitle>
              <DialogDescription className="text-xs">
                Customer 360° Relationship View & Interaction History
              </DialogDescription>
            </div>
            <div className="flex gap-1.5">
              {c360?.tags.map((t) => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 rounded-full text-[10px] text-white font-medium"
                  style={{ backgroundColor: t.color || "#3B82F6" }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border text-xs font-medium space-x-4 pt-2">
          {[
            { id: "TIMELINE", label: "Unified Timeline" },
            { id: "METRICS", label: "Financial Metrics" },
            { id: "CONTACTS", label: `Contacts (${c360?.contacts.length || 0})` },
            {
              id: "SALES",
              label: `Sales & POS (${(c360?.salesHistory.salesOrders.length || 0) + (c360?.posHistory.length || 0)})`,
            },
            { id: "CRM", label: `CRM Deals & Tasks (${c360?.opportunities.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-3 text-xs space-y-3 pr-1">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading Customer 360° Data...
            </div>
          ) : (
            <>
              {/* TIMELINE TAB */}
              {activeTab === "TIMELINE" && (
                <div className="space-y-2">
                  {c360?.timeline.length === 0 ? (
                    <p className="text-muted-foreground">No chronological history recorded yet.</p>
                  ) : (
                    c360?.timeline.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-md border border-border bg-card flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{item.title}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* METRICS TAB */}
              {activeTab === "METRICS" && c360 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md border border-border bg-muted/20">
                    <p className="text-muted-foreground">Total Revenue / Purchases</p>
                    <p className="text-base font-bold text-foreground">
                      ₹{c360.metrics.totalPurchases.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-md border border-border bg-muted/20">
                    <p className="text-muted-foreground">Outstanding Balance</p>
                    <p className="text-base font-bold text-destructive">
                      ₹{c360.metrics.outstandingBalance.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-md border border-border bg-muted/20">
                    <p className="text-muted-foreground">Won Opportunities Value</p>
                    <p className="text-base font-bold text-success">
                      ₹{c360.metrics.wonOpportunitiesValue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 rounded-md border border-border bg-muted/20">
                    <p className="text-muted-foreground">Total Orders & Invoices</p>
                    <p className="text-base font-bold text-foreground">
                      {c360.metrics.totalOrders} Orders • {c360.metrics.totalInvoices} Invoices
                    </p>
                  </div>
                </div>
              )}

              {/* CONTACTS TAB */}
              {activeTab === "CONTACTS" && (
                <div className="space-y-2">
                  {c360?.contacts.length === 0 ? (
                    <p className="text-muted-foreground">No secondary contacts registered.</p>
                  ) : (
                    c360?.contacts.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-md border border-border flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            {c.name}{" "}
                            {c.isPrimary && <span className="text-warning">(Primary)</span>}
                          </p>
                          <p className="text-muted-foreground">{c.role || "Role unassigned"}</p>
                        </div>
                        <div className="text-right text-muted-foreground">
                          <p>{c.email || "-"}</p>
                          <p>{c.phone || "-"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SALES & POS TAB */}
              {activeTab === "SALES" && (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      Sales Orders ({c360?.salesHistory.salesOrders.length})
                    </p>
                    {c360?.salesHistory.salesOrders.map((so: any) => (
                      <div key={so.id} className="p-2 border-b border-border flex justify-between">
                        <span>{so.orderNumber}</span>
                        <span>
                          ₹{Number(so.totalAmount).toLocaleString("en-IN")} ({so.status})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      POS Sales ({c360?.posHistory.length})
                    </p>
                    {c360?.posHistory.map((pos: any) => (
                      <div key={pos.id} className="p-2 border-b border-border flex justify-between">
                        <span>Receipt #{pos.receiptNumber}</span>
                        <span>₹{Number(pos.totalAmount).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CRM DEALS & TASKS TAB */}
              {activeTab === "CRM" && (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      Opportunities ({c360?.opportunities.length})
                    </p>
                    {c360?.opportunities.map((opp) => (
                      <div key={opp.id} className="p-2 border-b border-border flex justify-between">
                        <span>
                          {opp.opportunityNumber} - {opp.name}
                        </span>
                        <span className="font-medium">
                          ₹{Number(opp.estimatedValue).toLocaleString("en-IN")} ({opp.status})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      Activities ({c360?.activities.length})
                    </p>
                    {c360?.activities.map((act) => (
                      <div key={act.id} className="p-2 border-b border-border flex justify-between">
                        <span>
                          {act.type}: {act.subject}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(act.activityDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close 360° View
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
