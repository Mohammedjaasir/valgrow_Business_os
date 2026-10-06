import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useCustomerSegments,
  useCustomerSegmentCustomers,
  useCreateCustomerSegment,
  useDeleteCustomerSegment,
  type CustomerSegmentItem,
} from "@/hooks/queries/useCustomerSegments";
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
import { Plus, Trash2, Eye } from "lucide-react";

const title = "Customer Segments";
const description =
  "Filter-based customer groupings for targeted sales, marketing campaigns, and analytics.";

export const Route = createFileRoute("/customer-segments")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: CustomerSegmentsPage,
});

function CustomerSegmentsPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("crm.create");
  const canDelete = permissions.includes("crm.delete");

  const { data: segmentsData, isLoading } = useCustomerSegments();
  const createSegmentMutation = useCreateCustomerSegment();
  const deleteSegmentMutation = useDeleteCustomerSegment();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingSegment, setViewingSegment] = useState<CustomerSegmentItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [descriptionStr, setDescriptionStr] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const { data: matchingCustomers, isLoading: customersLoading } = useCustomerSegmentCustomers(
    viewingSegment?.id || "",
  );

  const resetForm = () => {
    setName("");
    setDescriptionStr("");
    setStatusFilter("ACTIVE");
    setCityFilter("");
    setStateFilter("");
    setErrorMsg(null);
  };

  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const rules: Record<string, any> = {};
      if (statusFilter) rules["status"] = statusFilter;
      if (cityFilter) rules["city"] = cityFilter;
      if (stateFilter) rules["state"] = stateFilter;

      await createSegmentMutation.mutateAsync({
        name,
        ...(descriptionStr ? { description: descriptionStr } : {}),
        rules,
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "name", header: "Segment Name" },
    { key: "description", header: "Description" },
    { key: "rulesStr", header: "Criteria Rules" },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const segment = segmentsData?.find((s) => s.id === r["id"]);
        if (!segment) return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewingSegment(segment)}
            >
              <Eye className="mr-1 h-3 w-3" /> View Customers
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={async () => {
                  if (confirm(`Delete segment ${segment.name}?`)) {
                    await deleteSegmentMutation.mutateAsync(segment.id);
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

  const rows: ListRow[] = (segmentsData || []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description || "N/A",
    rulesStr: s.rules ? JSON.stringify(s.rules) : "All Customers",
  }));

  const stats = [
    { label: "Customer Segments", value: isLoading ? "…" : String(segmentsData?.length || 0) },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Customer Intelligence"
        stats={stats}
        columns={columns}
        rows={rows}
        actionLabel={canCreate ? "Create Segment" : ""}
        children={
          canCreate ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Create Segment
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Customer Segment</DialogTitle>
            <DialogDescription>
              Define rule criteria for segmenting customer base.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSegment} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div>
              <Label>Segment Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={descriptionStr} onChange={(e) => setDescriptionStr(e.target.value)} />
            </div>
            <div className="border-t border-border pt-3 space-y-3">
              <p className="text-xs font-semibold">Rule Filters:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Customer Status</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Any Status</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div>
                  <Label>City Filter</Label>
                  <Input
                    placeholder="e.g. Bengaluru"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>State Filter</Label>
                <Input
                  placeholder="e.g. Karnataka"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Segment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Matching Customers Modal */}
      <Dialog
        open={Boolean(viewingSegment)}
        onOpenChange={(open) => {
          if (!open) setViewingSegment(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Matching Customers: {viewingSegment?.name}</DialogTitle>
            <DialogDescription>
              Backend-filtered customers matching segment criteria.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2 py-2">
            {customersLoading ? (
              <p className="text-xs text-muted-foreground">Evaluating segment rules...</p>
            ) : !matchingCustomers || matchingCustomers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No customers match this segment criteria.
              </p>
            ) : (
              matchingCustomers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-md border border-border text-xs"
                >
                  <div>
                    <div className="font-semibold text-foreground">
                      {c.customerCode} - {c.name}
                    </div>
                    <div className="text-muted-foreground">
                      {c.email || c.phone || "No contact info"} •{" "}
                      {c.city || c.state || "Location unassigned"}
                    </div>
                  </div>
                  <span className="text-success font-medium">{c.status}</span>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewingSegment(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
