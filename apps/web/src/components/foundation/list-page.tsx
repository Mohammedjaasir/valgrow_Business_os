import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Columns3, Download, ListFilter, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { DataTable, type Column } from "@/components/foundation/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { staggerContainer, staggerItem } from "@/lib/motion";

export type ListRow = Record<string, string>;

const SUCCESS = /^(active|enabled|success|paid|completed|complete|delivered|confirmed|approved|received|posted|open|won|closed won)$/;
const WARNING = /^(pending|draft|processing|in progress|partial|partially.*|submitted|awaiting.*|on hold|sent)$/;
const DANGER = /^(failed|revoked|cancelled|canceled|overdue|rejected|void|voided|lost|closed lost|inactive|expired|blocked)$/;

export function statusVariant(value: string): NonNullable<BadgeProps["variant"]> {
  const v = value.trim().toLowerCase().replace(/_/g, " ");
  if (SUCCESS.test(v)) return "success";
  if (WARNING.test(v)) return "warning";
  if (DANGER.test(v)) return "destructive-soft";
  return "neutral";
}

export function StatusBadge({ value }: { value: string }) {
  const variant = statusVariant(value);
  return (
    <Badge variant={variant}>
      <span
        className={
          variant === "success"
            ? "h-1.5 w-1.5 rounded-full bg-success"
            : variant === "warning"
              ? "h-1.5 w-1.5 rounded-full bg-warning"
              : variant === "destructive-soft"
                ? "h-1.5 w-1.5 rounded-full bg-destructive"
                : "h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
        }
      />
      {value}
    </Badge>
  );
}

/** Name cell with an initial avatar — for people, customers and products. */
export function NameCell({ value, sub }: { value: string; sub?: string }) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-muted-foreground">
        {initials || "—"}
      </span>
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{value}</div>
        {sub ? <div className="truncate text-xs text-muted-foreground">{sub}</div> : null}
      </div>
    </div>
  );
}

/** Monospace identifier cell (SKU, codes, document numbers). */
export function CodeCell({ value }: { value: string }) {
  return <span className="font-mono text-xs text-muted-foreground">{value || "—"}</span>;
}

/** Right-aligned tabular number; dims zero values. */
export function NumberCell({ value, tone }: { value: string; tone?: "danger" | "warning" }) {
  const numeric = Number(value.replace(/[^\d.-]/g, ""));
  const zero = value.trim() !== "" && Number.isFinite(numeric) && numeric === 0;
  return (
    <span
      className={
        tone === "danger"
          ? "tabular font-medium text-destructive"
          : tone === "warning"
            ? "tabular font-medium text-warning"
            : zero
              ? "tabular text-muted-foreground"
              : "tabular font-medium text-foreground"
      }
    >
      {value}
    </span>
  );
}

const STAT_COLS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

export function ListPage({
  title,
  description,
  eyebrow,
  actionLabel = "New record",
  onAction,
  stats = [],
  columns,
  rows,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
  stats?: { label: string; value: string; hint?: string }[];
  columns: Column<ListRow>[];
  rows: ListRow[];
  children?: ReactNode;
}) {
  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        {...(eyebrow ? { eyebrow } : {})}
        actions={
          <>
            <Button variant="outline">
              <Download />
              Export
            </Button>
            <Button onClick={onAction}>
              <Plus />
              {actionLabel}
            </Button>
          </>
        }
      />

      {stats.length > 0 ? (
        <motion.div
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className={STAT_COLS[stats.length] ? `grid gap-4 ${STAT_COLS[stats.length]}` : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"}
        >
          {stats.map((s, i) => (
            <motion.div key={s.label} variants={staggerItem}>
              <StatCard
                label={s.label}
                value={s.value}
                {...(s.hint ? { hint: s.hint } : {})}
                tone={i === 0 ? "brand" : "default"}
                className="h-full"
              />
            </motion.div>
          ))}
        </motion.div>
      ) : null}

      {children}

      <DataTable
        columns={columns}
        rows={rows}
        toolbar={
          <>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search records…" className="h-8 pl-8 text-[13px]" />
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm">
                <ListFilter />
                Filters
              </Button>
              <Button variant="ghost" size="sm">
                <Columns3 />
                Columns
              </Button>
            </div>
          </>
        }
      />
    </AppShell>
  );
}
