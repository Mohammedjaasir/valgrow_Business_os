import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useLeads,
  useCreateLead,
  useUpdateLead,
  useConvertLead,
  useDeleteLead,
  type LeadItem,
} from "@/hooks/queries/useLeads";
import { useLeadSources } from "@/hooks/queries/useLeadSources";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useUsers } from "@/hooks/queries/useUsers";
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
import { Plus, UserCheck, Edit2, Trash2 } from "lucide-react";

const title = "Leads & Prospects";
const description =
  "Track inbound lead inquiries, assign sales reps, and convert qualified leads to customers.";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("crm.create");
  const canUpdate = permissions.includes("crm.update");
  const canDelete = permissions.includes("crm.delete");
  const canConvert = permissions.includes("crm.convert");

  const { data: leadsData, isLoading } = useLeads();
  const { data: leadSources } = useLeadSources();
  const { data: customers } = useCustomers();
  const { data: users } = useUsers();

  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const convertLeadMutation = useConvertLead();
  const deleteLeadMutation = useDeleteLead();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [convertingLead, setConvertingLead] = useState<LeadItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lead Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Convert Form state
  const [existingCustomerId, setExistingCustomerId] = useState("");
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityName, setOpportunityName] = useState("");
  const [conversionResult, setConversionResult] = useState<{
    customerId: string;
    opportunityId: string | null;
  } | null>(null);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setSourceId("");
    setAssignedToId("");
    setEstimatedValue(0);
    setNotes("");
    setErrorMsg(null);
  };

  const handleOpenEdit = (lead: LeadItem) => {
    setEditingLead(lead);
    setFirstName(lead.firstName);
    setLastName(lead.lastName || "");
    setCompanyName(lead.companyName || "");
    setEmail(lead.email || "");
    setPhone(lead.phone || "");
    setSourceId(lead.sourceId || "");
    setAssignedToId(lead.assignedToId || "");
    setEstimatedValue(Number(lead.estimatedValue || 0));
    setNotes(lead.notes || "");
    setErrorMsg(null);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingLead) {
        await updateLeadMutation.mutateAsync({
          id: editingLead.id,
          data: {
            firstName,
            lastName: lastName || null,
            companyName: companyName || null,
            email: email || null,
            phone: phone || null,
            sourceId: sourceId || null,
            assignedToId: assignedToId || null,
            estimatedValue: Number(estimatedValue),
            notes: notes || null,
          },
        });
        setEditingLead(null);
      } else {
        await createLeadMutation.mutateAsync({
          firstName,
          lastName: lastName || null,
          companyName: companyName || null,
          email: email || null,
          phone: phone || null,
          sourceId: sourceId || null,
          assignedToId: assignedToId || null,
          estimatedValue: Number(estimatedValue),
          notes: notes || null,
        });
        setIsAddOpen(false);
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;
    setErrorMsg(null);
    try {
      const res = await convertLeadMutation.mutateAsync({
        id: convertingLead.id,
        data: {
          ...(existingCustomerId ? { existingCustomerId } : {}),
          createOpportunity,
          ...(createOpportunity && opportunityName ? { opportunityName } : {}),
        },
      });
      setConversionResult({
        customerId: res.customerId,
        opportunityId: res.opportunityId,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Conversion failed");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "leadNumber", header: "Lead Number" },
    { key: "name", header: "Name" },
    { key: "companyName", header: "Company" },
    { key: "email", header: "Email" },
    { key: "sourceName", header: "Source" },
    { key: "assignedToName", header: "Assigned To" },
    { key: "estimatedValue", header: "Est. Value" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const lead = leadsData?.find((l) => l.id === r["id"]);
        if (!lead) return null;
        return (
          <div className="flex items-center gap-1">
            {canConvert && lead.status !== "CONVERTED" && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-success border-success/30 hover:bg-success-soft"
                onClick={() => {
                  setConvertingLead(lead);
                  setExistingCustomerId("");
                  setOpportunityName(`Deal for ${lead.companyName || lead.firstName}`);
                  setConversionResult(null);
                  setErrorMsg(null);
                }}
              >
                <UserCheck className="mr-1 h-3 w-3" /> Convert
              </Button>
            )}
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleOpenEdit(lead)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={async () => {
                  if (confirm(`Delete lead ${lead.leadNumber}?`)) {
                    await deleteLeadMutation.mutateAsync(lead.id);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = (leadsData || []).map((l) => ({
    id: l.id,
    leadNumber: l.leadNumber,
    name: `${l.firstName} ${l.lastName || ""}`,
    companyName: l.companyName || "N/A",
    email: l.email || l.phone || "N/A",
    sourceName: l.source?.name || "N/A",
    assignedToName: l.assignedTo
      ? `${l.assignedTo.firstName} ${l.assignedTo.lastName || ""}`
      : "Unassigned",
    estimatedValue: `₹${Number(l.estimatedValue || 0).toLocaleString("en-IN")}`,
    status: l.status,
  }));

  const stats = [
    { label: "Total Leads", value: isLoading ? "…" : String(leadsData?.length || 0) },
    {
      label: "New Inquiries",
      value: isLoading ? "…" : String(leadsData?.filter((l) => l.status === "NEW").length || 0),
    },
    {
      label: "Converted Leads",
      value: isLoading
        ? "…"
        : String(leadsData?.filter((l) => l.status === "CONVERTED").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="CRM Operations"
        stats={stats}
        columns={columns}
        rows={rows}
        actionLabel={canCreate ? "New Lead" : ""}
        children={
          canCreate ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Lead
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create / Edit Modal */}
      <Dialog
        open={isAddOpen || Boolean(editingLead)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingLead(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "New Lead Inquiry"}</DialogTitle>
            <DialogDescription>Enter contact details and prospective value.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLead} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                <Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lead Source</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                >
                  <option value="">Select Source...</option>
                  {leadSources?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Assigned User</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName || ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Estimated Deal Value (₹)</Label>
              <Input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingLead(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingLead ? "Update Lead" : "Create Lead"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert Lead Confirmation Dialog */}
      <Dialog
        open={Boolean(convertingLead)}
        onOpenChange={(open) => {
          if (!open) setConvertingLead(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Lead to Customer</DialogTitle>
            <DialogDescription>
              Converting this lead will mark it as CONVERTED, preserve interaction history, and
              generate or link a Customer account.
            </DialogDescription>
          </DialogHeader>

          {conversionResult ? (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-success-soft text-success text-xs rounded-md">
                ✅ Lead converted successfully!
              </div>
              <div className="text-xs space-y-1">
                <p>
                  <strong>Customer ID:</strong> {conversionResult.customerId}
                </p>
                {conversionResult.opportunityId && (
                  <p>
                    <strong>Opportunity ID:</strong> {conversionResult.opportunityId}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setConvertingLead(null)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleConvertLead} className="space-y-4">
              {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
              <div>
                <Label>Link to Existing Customer (Optional)</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={existingCustomerId}
                  onChange={(e) => setExistingCustomerId(e.target.value)}
                >
                  <option value="">Create New Customer from Lead details</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createOpp"
                    checked={createOpportunity}
                    onChange={(e) => setCreateOpportunity(e.target.checked)}
                  />
                  <Label htmlFor="createOpp" className="cursor-pointer">
                    Create Sales Opportunity
                  </Label>
                </div>
                {createOpportunity && (
                  <div>
                    <Label>Opportunity Name</Label>
                    <Input
                      value={opportunityName}
                      onChange={(e) => setOpportunityName(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setConvertingLead(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="bg-success text-primary-foreground hover:bg-success/90"
                >
                  Confirm Conversion
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
