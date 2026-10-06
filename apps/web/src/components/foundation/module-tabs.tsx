import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModuleTab = { to: string; label: string; icon: LucideIcon };

/** Route-level tab strip linking sibling pages of one module (e.g. Inventory ↔ Products). */
export function ModuleTabs({ tabs, id }: { tabs: ModuleTab[]; id: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label="Module sections">
      {tabs.map((tab) => {
        const active = pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-3 pb-2.5 pt-1.5 text-[13px] transition-colors",
              active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {active ? (
              <motion.span
                layoutId={`${id}-module-tab`}
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
