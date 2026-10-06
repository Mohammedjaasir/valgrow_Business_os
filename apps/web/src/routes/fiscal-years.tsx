import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFiscalYears, useCreateFiscalYear, useUpdatePeriodStatus } from "@/hooks/queries/useFiscalYears";
import { Plus, Lock, Unlock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/fiscal-years")({
  head: () => ({
    meta: [{ title: "Fiscal Years & Period Controls · ValGrow Business OS" }],
  }),
  component: FiscalYearsPage,
});

function FiscalYearsPage() {
  const { data: fiscalYears, isLoading } = useFiscalYears();
  const createFyMutation = useCreateFiscalYear();
  const updateStatusMutation = useUpdatePeriodStatus();

  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: `FY ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    startDate: `${new Date().getFullYear()}-04-01`,
    endDate: `${new Date().getFullYear() + 1}-03-31`,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createFyMutation.mutate(formData, {
      onSuccess: () => setShowCreate(false),
    });
  };

  const handleStatusChange = (periodId: string, status: "OPEN" | "CLOSED" | "LOCKED") => {
    updateStatusMutation.mutate({ id: periodId, status });
  };

  return (
    <AppShell>
      <PageHeader
        title="Fiscal Years & Period Control"
        description="Manage accounting fiscal years, monthly period closing, and period locking."
        eyebrow="Financial Controls"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" /> Add Fiscal Year
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-6 border-primary/20 bg-accent/10">
          <CardHeader>
            <CardTitle>Create Fiscal Year</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Fiscal Year Name</label>
                <Input
                  required
                  placeholder="FY 2026-2027"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">End Date</label>
                <Input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFyMutation.isPending}>
                  Create FY & Generate 12 Periods
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading Fiscal Years...</div>
        ) : fiscalYears?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No Fiscal Years configured yet.</div>
        ) : (
          fiscalYears?.map((fy) => (
            <Card key={fy.id}>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="text-lg">{fy.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {new Date(fy.startDate).toLocaleDateString()} — {new Date(fy.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={fy.isClosed ? "secondary" : "default"}>
                  {fy.isClosed ? "CLOSED" : "ACTIVE"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {fy.periods?.map((p) => (
                    <div key={p.id} className="rounded-md border p-3 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{p.periodName}</span>
                        <Badge
                          variant={
                            p.status === "OPEN"
                              ? "default"
                              : p.status === "CLOSED"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {p.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1 pt-1">
                        {p.status === "OPEN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-7"
                            onClick={() => handleStatusChange(p.id, "CLOSED")}
                          >
                            <Lock className="mr-1 h-3 w-3" /> Close Period
                          </Button>
                        )}
                        {p.status === "CLOSED" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-1/2 text-xs h-7"
                              onClick={() => handleStatusChange(p.id, "OPEN")}
                            >
                              <Unlock className="mr-1 h-3 w-3" /> Reopen
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-1/2 text-xs h-7"
                              onClick={() => handleStatusChange(p.id, "LOCKED")}
                            >
                              <Lock className="mr-1 h-3 w-3" /> Lock
                            </Button>
                          </>
                        )}
                        {p.status === "LOCKED" && (
                          <span className="text-xs text-muted-foreground italic flex items-center justify-center w-full">
                            <CheckCircle2 className="mr-1 h-3 w-3 text-success" /> Irreversibly Locked
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
