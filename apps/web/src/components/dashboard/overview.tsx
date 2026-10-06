import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  IndianRupee,
  Package,
  PackageCheck,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/foundation/stat-card";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/foundation/states";
import { StatusBadge } from "@/components/foundation/list-page";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { useDashboardOverview } from "@/hooks/queries/useDashboardOverview";
import { useSalesReport } from "@/hooks/queries/useReports";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const inr = (n: number, decimals = 0) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Shared 30-day sales window for the chart and recent-sales card. */
function useLast30DaysSales() {
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return { dateFrom: isoDay(from), dateTo: isoDay(to) };
  }, []);
  return useSalesReport(range);
}

function greeting(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function OverviewGreeting() {
  const { data: currentUser } = useCurrentUser();
  const firstName = currentUser?.user?.firstName;
  // Time-of-day text differs between server and browser, so compute it after mount.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const today = now
    ? new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(now)
    : " ";

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs font-medium text-primary">{today}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {now ? greeting(now) : "Welcome back"}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening across your business today.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline">
          <Link to="/purchase-orders">
            <ShoppingCart />
            New PO
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/products">
            <Package />
            Add product
          </Link>
        </Button>
        <Button asChild>
          <Link to="/pos">
            <Plus />
            New sale
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function KpiGrid() {
  const { data, isLoading, isError, refetch } = useDashboardOverview();
  const { data: sales } = useLast30DaysSales();

  const trend = useMemo(() => {
    const byDate = sales?.breakdowns.salesByDate ?? [];
    return byDate.map((d) => d.totalSales);
  }, [sales]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn't load your dashboard"
        description="The overview metrics are unavailable right now."
        onRetry={() => refetch()}
      />
    );
  }

  const kpis = [
    {
      label: "Today's sales",
      value: inr(data.todaysTotalPosSales, 2),
      icon: IndianRupee,
      hint: "POS revenue today",
      tone: "brand" as const,
      trend,
    },
    {
      label: "Orders today",
      value: String(data.todaysOrderCount),
      icon: ShoppingBag,
      hint: "Completed POS orders",
    },
    {
      label: "Active customers",
      value: data.activeCustomerCount.toLocaleString("en-IN"),
      icon: Users,
      hint: "With an active account",
    },
    {
      label: "Active products",
      value: data.totalActiveProducts.toLocaleString("en-IN"),
      icon: Boxes,
      hint: "Sellable catalog items",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer(0.06)}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kpis.map((k) => (
        <motion.div key={k.label} variants={staggerItem}>
          <StatCard
            label={k.label}
            value={k.value}
            icon={k.icon}
            hint={k.hint}
            tone={k.tone ?? "default"}
            {...(k.trend && k.trend.length > 1 ? { trend: k.trend } : {})}
            className="h-full"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { orderCount: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="tabular mt-1 text-muted-foreground">
        <span className="font-semibold text-foreground">{inr(point.value)}</span> ·{" "}
        {point.payload.orderCount} orders
      </p>
    </div>
  );
}

export function RevenueChartCard({ className }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useLast30DaysSales();

  const points = useMemo(
    () =>
      (data?.breakdowns.salesByDate ?? []).map((d) => ({
        label: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        totalSales: d.totalSales,
        orderCount: d.orderCount,
      })),
    [data],
  );

  return (
    <section className={cn("panel flex flex-col p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Revenue</h2>
          <p className="text-[13px] text-muted-foreground">Last 30 days</p>
        </div>
        {data ? (
          <div className="flex gap-6 text-right">
            <div>
              <p className="tabular font-display text-xl font-semibold tracking-tight">
                {inr(data.summary.totalSales)}
              </p>
              <p className="text-xs text-muted-foreground">Total sales</p>
            </div>
            <div>
              <p className="tabular font-display text-xl font-semibold tracking-tight">
                {data.summary.orderCount.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 h-[260px] min-h-0 flex-1">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : isError ? (
          <ErrorState className="h-full py-6" onRetry={() => refetch()} />
        ) : points.length === 0 ? (
          <EmptyState
            className="h-full border-0 py-6"
            title="No sales in the last 30 days"
            description="Revenue will chart here as soon as orders come in."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickFormatter={(v: number) =>
                  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                }
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
              <Area
                type="monotone"
                dataKey="totalSales"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#revenueFill)"
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export function AttentionCard({ className }: { className?: string }) {
  const { data, isLoading } = useDashboardOverview();

  const items = [
    {
      label: "Low stock items",
      count: data?.lowStockProductCount ?? 0,
      icon: AlertTriangle,
      to: "/inventory",
      tone: "warning" as const,
    },
    {
      label: "Open purchase orders",
      count: data?.openPurchaseOrderCount ?? 0,
      icon: ClipboardList,
      to: "/purchase-orders",
      tone: "info" as const,
    },
    {
      label: "Pending goods receipts",
      count: data?.pendingGoodsReceiptsCount ?? 0,
      icon: PackageCheck,
      to: "/goods-receipts",
      tone: "info" as const,
    },
  ];
  const allClear = !isLoading && items.every((i) => i.count === 0);

  return (
    <section className={cn("panel flex flex-col p-5", className)}>
      <h2 className="text-sm font-semibold text-foreground">Needs attention</h2>
      <p className="text-[13px] text-muted-foreground">Operational items to follow up</p>

      <div className="mt-4 flex-1 space-y-1">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : allClear ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold">You're all caught up</p>
            <p className="text-[13px] text-muted-foreground">Nothing needs your attention right now.</p>
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  item.count > 0 && item.tone === "warning"
                    ? "bg-warning-soft text-warning"
                    : item.count > 0
                      ? "bg-info-soft text-info"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-[13px] text-foreground">{item.label}</span>
              <span className="tabular text-sm font-semibold">{item.count}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

export function RecentSalesCard() {
  const { data, isLoading, isError, refetch } = useLast30DaysSales();

  const recent = useMemo(
    () =>
      [...(data?.records ?? [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [data],
  );

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent sales</h2>
          <p className="text-[13px] text-muted-foreground">Latest transactions across branches</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-foreground">
          <Link to="/reports">
            View all
            <ArrowRight />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState className="m-5" onRetry={() => refetch()} />
      ) : recent.length === 0 ? (
        <EmptyState
          className="rounded-none border-0"
          icon={<ShoppingBag className="h-5 w-5" />}
          title="No sales yet"
          description="Completed sales from POS and invoices will appear here."
          action={
            <Button asChild size="sm">
              <Link to="/pos">Open POS</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="px-5 py-2.5 text-left font-medium">Number</th>
                <th className="px-3 py-2.5 text-left font-medium">Customer</th>
                <th className="hidden px-3 py-2.5 text-left font-medium md:table-cell">Branch</th>
                <th className="px-3 py-2.5 text-left font-medium">Date</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer(0.03)} initial="hidden" animate="show">
              {recent.map((r) => (
                <motion.tr
                  key={r.id}
                  variants={staggerItem}
                  className="border-b transition-colors last:border-0 hover:bg-surface-2/70"
                >
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.number}</td>
                  <td className="max-w-[200px] truncate px-3 py-3 font-medium text-foreground">
                    {r.customerName || "Walk-in customer"}
                  </td>
                  <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{r.branchName}</td>
                  <td className="tabular px-3 py-3 text-muted-foreground">
                    {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge value={r.status} />
                  </td>
                  <td className="tabular px-5 py-3 text-right font-medium text-foreground">
                    {inr(r.total, 2)}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}
    </section>
  );
}
