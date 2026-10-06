import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLeads } from "@/hooks/queries/useLeads";
import { useOpportunities } from "@/hooks/queries/useOpportunities";
import { useCrmTasks } from "@/hooks/queries/useCrmTasks";
import { useCrmActivities } from "@/hooks/queries/useCrmActivities";
import {
  UserRound,
  Sparkles,
  BookmarkCheck,
  History,
  ArrowRight,
  TrendingUp,
  Award,
  AlertTriangle,
  Plus,
  GitBranch,
} from "lucide-react";

const title = "CRM Dashboard";
const description =
  "Relationship management, pipeline analytics, lead conversion tracking, and task follow-ups.";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: CrmDashboardPage,
});

function CrmDashboardPage() {
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: opps, isLoading: oppsLoading } = useOpportunities();
  const { data: tasks, isLoading: tasksLoading } = useCrmTasks();
  const { data: activities, isLoading: activitiesLoading } = useCrmActivities();

  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter((l) => l.status === "NEW").length || 0;
  const convertedLeads = leads?.filter((l) => l.status === "CONVERTED").length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const openOpps = opps?.filter((o) => o.status === "OPEN") || [];
  const wonOpps = opps?.filter((o) => o.status === "WON") || [];
  const lostOpps = opps?.filter((o) => o.status === "LOST") || [];

  const pipelineValue = openOpps.reduce((acc, o) => acc + Number(o.estimatedValue || 0), 0);
  const weightedValue = openOpps.reduce(
    (acc, o) => acc + Number(o.estimatedValue || 0) * (Number(o.probability || 0) / 100),
    0,
  );

  const todayStr = new Date().toISOString().split("T")[0] || "";
  const pendingTasks =
    tasks?.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS") || [];
  const dueTodayTasks = pendingTasks.filter((t) => (t.dueDate || "").startsWith(todayStr));
  const overdueTasks = pendingTasks.filter((t) => (t.dueDate || "") < todayStr);

  const recentActivities = activities?.slice(0, 5) || [];
  const recentLeads = leads?.slice(0, 5) || [];

  const stats: { label: string; value: string; hint: string; tone: "default" | "brand" }[] = [
    {
      label: "Total Leads",
      value: leadsLoading ? "…" : String(totalLeads),
      hint: `${newLeads} new leads • ${conversionRate}% conversion rate`,
      tone: "brand",
    },
    {
      label: "Pipeline Value",
      value: oppsLoading ? "…" : `₹${pipelineValue.toLocaleString("en-IN")}`,
      hint: `Weighted: ₹${Math.round(weightedValue).toLocaleString("en-IN")}`,
      tone: "default",
    },
    {
      label: "Won Opportunities",
      value: oppsLoading ? "…" : String(wonOpps.length),
      hint: `${lostOpps.length} lost opportunities`,
      tone: "default",
    },
    {
      label: "Tasks Due / Overdue",
      value: tasksLoading ? "…" : `${dueTodayTasks.length} Today / ${overdueTasks.length} Overdue`,
      hint: `${pendingTasks.length} total pending tasks`,
      tone: overdueTasks.length > 0 ? "brand" : "default",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Customer Relationship Management"
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} tone={s.tone} />
        ))}
      </div>

      {/* Quick Action Navigation */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Leads Overview */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Leads & Prospects</CardTitle>
              <UserRound className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>
              Manage incoming inquiries and convert qualified prospects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {recentLeads.length === 0 ? (
                <p className="text-xs text-muted-foreground">No leads created yet.</p>
              ) : (
                recentLeads.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between text-xs py-1 border-b border-border/50"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        {l.firstName} {l.lastName || ""}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({l.companyName || "Individual"})
                      </span>
                    </div>
                    <Badge variant={l.status === "CONVERTED" ? "outline" : "secondary"}>
                      {l.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/leads">
                  View Leads <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/leads">
                  <Plus className="mr-1 h-3 w-3" /> New Lead
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities & Pipeline */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Deal Opportunities</CardTitle>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>
              Track sales stage progression and deal win probabilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-xs font-medium bg-muted/30 p-2.5 rounded-md">
              <div className="flex items-center gap-1.5 text-success font-semibold">
                <Award className="h-4 w-4" /> Won: {wonOpps.length}
              </div>
              <div className="flex items-center gap-1.5 text-info font-semibold">
                <TrendingUp className="h-4 w-4" /> Open: {openOpps.length}
              </div>
              <div className="flex items-center gap-1.5 text-destructive font-semibold">
                <AlertTriangle className="h-4 w-4" /> Lost: {lostOpps.length}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/opportunities">
                  View Pipeline <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/pipelines">
                  <GitBranch className="mr-1 h-3 w-3" /> Pipelines
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tasks & Activities */}
        <Card className="flex flex-col justify-between md:col-span-2 xl:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Interaction Log</CardTitle>
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Latest customer activities, meetings, and calls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-xs">
              {recentActivities.length === 0 ? (
                <p className="text-muted-foreground">No recent CRM activities logged.</p>
              ) : (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between py-1 border-b border-border/50"
                  >
                    <span className="font-medium truncate max-w-[180px]">{act.subject}</span>
                    <Badge variant="outline">{act.type}</Badge>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/activities">
                  All Activities <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/tasks">
                  <BookmarkCheck className="mr-1 h-3 w-3" /> Tasks
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
