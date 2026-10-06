import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useCrmTasks,
  useCreateCrmTask,
  useUpdateCrmTask,
  useDeleteCrmTask,
  type CrmTaskItem,
} from "@/hooks/queries/useCrmTasks";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useLeads } from "@/hooks/queries/useLeads";
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
import { Plus, CheckCircle, Edit2, Trash2 } from "lucide-react";

const title = "CRM Actionable Tasks";
const description = "Action items, follow-ups, contract reminders, and assigned customer tasks.";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("crm.create");
  const canUpdate = permissions.includes("crm.update");
  const canDelete = permissions.includes("crm.delete");

  const { data: tasksData, isLoading } = useCrmTasks();
  const { data: customers } = useCustomers();
  const { data: leads } = useLeads();
  const { data: users } = useUsers();

  const createTaskMutation = useCreateCrmTask();
  const updateTaskMutation = useUpdateCrmTask();
  const deleteTaskMutation = useDeleteCrmTask();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CrmTaskItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [titleStr, setTitleStr] = useState("");
  const [descriptionStr, setDescriptionStr] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<CrmTaskItem["priority"]>("MEDIUM");
  const [status, setStatus] = useState<CrmTaskItem["status"]>("PENDING");
  const [customerId, setCustomerId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  const todayStr = new Date().toISOString().split("T")[0] || "";

  const resetForm = () => {
    setTitleStr("");
    setDescriptionStr("");
    setDueDate(todayStr);
    setPriority("MEDIUM");
    setStatus("PENDING");
    setCustomerId("");
    setLeadId("");
    setAssignedToId("");
    setErrorMsg(null);
  };

  const handleOpenEdit = (task: CrmTaskItem) => {
    setEditingTask(task);
    setTitleStr(task.title);
    setDescriptionStr(task.description || "");
    setDueDate(task.dueDate ? (task.dueDate.split("T")[0] ?? "") : "");
    setPriority(task.priority);
    setStatus(task.status);
    setCustomerId(task.customerId || "");
    setLeadId(task.leadId || "");
    setAssignedToId(task.assignedToId || "");
    setErrorMsg(null);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingTask) {
        await updateTaskMutation.mutateAsync({
          id: editingTask.id,
          data: {
            title: titleStr,
            description: descriptionStr || null,
            dueDate: dueDate || todayStr,
            priority,
            status,
            assignedToId: assignedToId || null,
          },
        });
        setEditingTask(null);
      } else {
        await createTaskMutation.mutateAsync({
          title: titleStr,
          description: descriptionStr || null,
          dueDate: dueDate || todayStr,
          priority,
          status,
          customerId: customerId || null,
          leadId: leadId || null,
          assignedToId: assignedToId || null,
        });
        setIsAddOpen(false);
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const handleCompleteTask = async (task: CrmTaskItem) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: { status: "COMPLETED" },
      });
    } catch (err: any) {
      alert(err.message || "Failed to complete task");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "title", header: "Task Title" },
    { key: "dueDate", header: "Due Date" },
    { key: "assignedToName", header: "Assigned Rep" },
    { key: "priority", header: "Priority" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const task = tasksData?.find((t) => t.id === r["id"]);
        if (!task) return null;
        return (
          <div className="flex items-center gap-1">
            {canUpdate && task.status !== "COMPLETED" && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-success border-success/30 hover:bg-success-soft"
                onClick={() => handleCompleteTask(task)}
              >
                <CheckCircle className="mr-1 h-3 w-3" /> Complete
              </Button>
            )}
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleOpenEdit(task)}
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
                  if (confirm(`Delete task ${task.title}?`)) {
                    await deleteTaskMutation.mutateAsync(task.id);
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

  const rows: ListRow[] = (tasksData || []).map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: new Date(t.dueDate).toLocaleDateString(),
    assignedToName: t.assignedTo
      ? `${t.assignedTo.firstName} ${t.assignedTo.lastName || ""}`
      : "Unassigned",
    priority: t.priority,
    status: t.status,
  }));

  const stats = [
    { label: "Total Tasks", value: isLoading ? "…" : String(tasksData?.length || 0) },
    {
      label: "Pending Tasks",
      value: isLoading
        ? "…"
        : String(
            tasksData?.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length ||
              0,
          ),
    },
    {
      label: "Completed Tasks",
      value: isLoading
        ? "…"
        : String(tasksData?.filter((t) => t.status === "COMPLETED").length || 0),
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
        actionLabel={canCreate ? "New Task" : ""}
        children={
          canCreate ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create / Edit Modal */}
      <Dialog
        open={isAddOpen || Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingTask(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Action Task" : "New CRM Task"}</DialogTitle>
            <DialogDescription>Schedule follow-ups and assign responsibilities.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTask} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div>
              <Label>Task Title *</Label>
              <Input required value={titleStr} onChange={(e) => setTitleStr(e.target.value)} />
            </div>
            <div>
              <Label>Description / Details</Label>
              <Input value={descriptionStr} onChange={(e) => setDescriptionStr(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assigned Rep</Label>
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
              <div>
                <Label>Task Status</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  {["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingTask(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingTask ? "Update Task" : "Save Task"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
