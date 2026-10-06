import { Bell, CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  info: Bell,
  success: CheckCircle2,
  warning: TriangleAlert,
};

export function NotificationItem({
  title,
  body,
  time,
  unread,
  kind = "info",
}: {
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  kind?: keyof typeof icons;
}) {
  const Icon = icons[kind];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-md p-2.5 text-left transition-colors hover:bg-accent",
        unread && "bg-primary-soft/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          kind === "success" && "bg-success-soft text-success",
          kind === "warning" && "bg-warning-soft text-warning",
          kind === "info" && "bg-primary-soft text-primary",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium">{title}</p>
          {unread ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
        </div>
        <p className="text-xs text-muted-foreground">{body}</p>
        <p className="tabular mt-1 text-[11px] text-muted-foreground/80">{time}</p>
      </div>
    </div>
  );
}
