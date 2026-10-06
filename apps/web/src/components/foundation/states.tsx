import type { ReactNode } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeRise } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function EmptyState({
  title = "No records yet",
  description = "Records you create will show up here.",
  action,
  icon,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeRise}
      initial="hidden"
      animate="show"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-surface-2 text-muted-foreground shadow-xs">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto max-w-sm text-[13px] text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </motion.div>
  );
}

export function ErrorState({
  title = "Couldn't load this data",
  description = "Check your connection and try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeRise}
      initial="hidden"
      animate="show"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive-soft/40 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive-soft text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto max-w-sm text-[13px] text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Try again
        </Button>
      ) : null}
    </motion.div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="panel overflow-hidden" aria-busy="true" aria-label="Loading">
      <div className="flex gap-6 border-b bg-surface-2/60 px-4 py-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-3 w-12" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-b px-4 py-3.5 last:border-0">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-3.5 w-1/4" />
          <Skeleton className="h-3.5 w-1/6" />
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="ml-auto h-3.5 w-14" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="panel space-y-3 p-5" aria-busy="true">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}
