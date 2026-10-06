import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import {
  AttentionCard,
  KpiGrid,
  OverviewGreeting,
  RecentSalesCard,
  RevenueChartCard,
} from "@/components/dashboard/overview";

const description =
  "ValGrow Business OS — a unified dashboard for organization, people, finance and operations.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Overview · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <AppShell>
      <OverviewGreeting />
      <KpiGrid />
      <div className="grid gap-6 xl:grid-cols-3">
        <RevenueChartCard className="xl:col-span-2" />
        <AttentionCard />
      </div>
      <RecentSalesCard />
    </AppShell>
  );
}
