import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { useCountUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ParsedValue = {
  prefix: string;
  number: number;
  suffix: string;
  decimals: number;
  locale: string;
  grouped: boolean;
};

/** Splits "₹1,20,000.50 (Cost)" into prefix / number / suffix so it can be animated. */
function parseDisplayValue(value: string): ParsedValue | null {
  const match = /^([^\d-]*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/.exec(value.trim());
  if (!match) return null;
  const [, prefix = "", raw = "", suffix = ""] = match;
  const number = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;
  const decimals = raw.includes(".") ? raw.split(".")[1]!.length : 0;
  const indian = /\d,\d{2},\d{3}/.test(raw);
  return {
    prefix,
    number,
    suffix,
    decimals,
    locale: indian ? "en-IN" : "en-US",
    grouped: raw.includes(","),
  };
}

function AnimatedValue({ value }: { value: string }) {
  const parsed = parseDisplayValue(value);
  const current = useCountUp(parsed?.number ?? 0);
  if (!parsed) return <>{value}</>;
  const formatted = current.toLocaleString(parsed.locale, {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
    useGrouping: parsed.grouped,
  });
  return (
    <>
      {parsed.prefix}
      {formatted}
      {parsed.suffix}
    </>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 88;
  const h = 28;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / range) * (h - 4) - 2).toFixed(1)}`);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  delta,
  trend,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "brand";
  delta?: { value: string; direction: "up" | "down" | "flat" };
  trend?: number[];
  className?: string;
}) {
  const DeltaIcon =
    delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : Minus;

  return (
    <div className={cn("panel group relative flex flex-col p-5 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              tone === "brand" ? "bg-primary-soft text-primary" : "bg-secondary text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="tabular mt-2 break-words font-display text-2xl font-semibold leading-tight tracking-tight text-foreground">
        <AnimatedValue value={value} />
      </p>
      {trend && trend.length > 1 ? (
        <div className="mt-2">
          <Sparkline points={trend} />
        </div>
      ) : null}
      {delta || hint ? (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-medium",
                delta.direction === "up" && "bg-success-soft text-success",
                delta.direction === "down" && "bg-destructive-soft text-destructive",
                delta.direction === "flat" && "bg-secondary text-muted-foreground",
              )}
            >
              <DeltaIcon className="h-3 w-3" />
              {delta.value}
            </span>
          ) : null}
          {hint ? <span className="truncate text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-[13px] text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
