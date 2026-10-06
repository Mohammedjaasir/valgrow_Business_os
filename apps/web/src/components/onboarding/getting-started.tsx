import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, ChevronDown, PartyPopper, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CHECKLIST_STEPS, type ChecklistId } from "@/lib/onboarding-content";
import { useOnboarding } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { useBranches } from "@/hooks/queries/useBranches";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useProducts } from "@/hooks/queries/useProducts";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { usePOSSessions } from "@/hooks/queries/usePOSSessions";
import { useSalesReport } from "@/hooks/queries/useReports";

type StepStatus = "loading" | "done" | "todo";

/** A step counts as done only when its query succeeded and the condition holds. */
function useChecklistStatus(): Record<ChecklistId, StepStatus> {
  const branches = useBranches();
  const warehouses = useWarehouses();
  const products = useProducts({ limit: 1 });
  const customers = useCustomers();
  const sessions = usePOSSessions();
  const sales = useSalesReport({});

  const status = (q: { isLoading: boolean; isSuccess: boolean }, ok: boolean): StepStatus =>
    q.isLoading ? "loading" : q.isSuccess && ok ? "done" : "todo";

  return {
    branch: status(branches, (branches.data?.length ?? 0) > 0),
    warehouse: status(warehouses, (warehouses.data?.length ?? 0) > 0),
    products: status(products, (products.data?.meta.total ?? 0) > 0),
    customer: status(customers, (customers.data?.length ?? 0) > 0),
    register: status(sessions, (sessions.data?.length ?? 0) > 0),
    sale: status(sales, (sales.data?.summary.orderCount ?? 0) > 0),
  };
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-border)" strokeWidth="5" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * done) / total }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center text-xs font-semibold">
        {Math.round((done / total) * 100)}%
      </span>
    </div>
  );
}

function StepCheck({ status }: { status: StepStatus }) {
  if (status === "loading") return <Skeleton className="h-6 w-6 rounded-full" />;
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
        status === "done" ? "border-success bg-success text-primary-foreground" : "border-border bg-surface",
      )}
    >
      <AnimatePresence>
        {status === "done" ? (
          <motion.span
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

export function GettingStarted() {
  const { ready, state, dismissChecklist, restoreChecklist } = useOnboarding();
  const status = useChecklistStatus();
  const [expanded, setExpanded] = useState(true);
  const [justDismissed, setJustDismissed] = useState(false);

  const total = CHECKLIST_STEPS.length;
  const done = CHECKLIST_STEPS.filter((s) => status[s.id] === "done").length;
  const anyLoading = CHECKLIST_STEPS.some((s) => status[s.id] === "loading");
  const allDone = !anyLoading && done === total;
  const nextId = CHECKLIST_STEPS.find((s) => status[s.id] === "todo")?.id;

  // Collapse automatically once everything is complete.
  useEffect(() => {
    if (allDone) setExpanded(false);
  }, [allDone]);

  if (!ready) return null;

  if (state.checklistDismissed) {
    return justDismissed ? (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 rounded-lg border bg-surface px-4 py-2.5 text-[13px] text-muted-foreground"
      >
        <span>Getting-started guide hidden. You can bring it back from Help.</span>
        <Button
          variant="ghost"
          size="xs"
          className="text-foreground"
          onClick={() => {
            restoreChecklist();
            setJustDismissed(false);
          }}
        >
          Undo
        </Button>
      </motion.div>
    ) : null;
  }

  return (
    <motion.section
      data-checklist
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel overflow-hidden"
      aria-label="Getting started"
    >
      <div className="flex items-center gap-4 p-5">
        {allDone ? (
          <motion.span
            initial={{ scale: 0.6, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-success-soft text-success"
          >
            <PartyPopper className="h-6 w-6" />
          </motion.span>
        ) : (
          <ProgressRing done={done} total={total} />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {allDone ? "You're all set" : "Get started with ValGrow"}
            {!allDone ? <Rocket className="h-4 w-4 text-primary" /> : null}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {allDone
              ? "Your business is set up end to end — stock, sales and reports now update themselves."
              : `${done} of ${total} done · Six quick steps to see your whole business working together.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={expanded ? "Collapse checklist" : "Expand checklist"}
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="flex">
              <ChevronDown />
            </motion.span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Hide getting-started guide"
            onClick={() => {
              dismissChecklist();
              setJustDismissed(true);
            }}
          >
            <X />
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.ol
            key="steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="divide-y overflow-hidden border-t"
          >
            {CHECKLIST_STEPS.map((step, i) => {
              const s = status[step.id];
              const isNext = step.id === nextId;
              return (
                <li
                  key={step.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 transition-colors",
                    isNext && "bg-primary-soft/40",
                  )}
                >
                  <StepCheck status={s} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[13px] font-medium",
                        s === "done" ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground",
                      )}
                    >
                      <span className="tabular mr-1.5 text-muted-foreground">{i + 1}.</span>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.why}</p>
                  </div>
                  {s === "todo" ? (
                    <Button asChild size="sm" variant={isNext ? "default" : "outline"} className="shrink-0">
                      <Link to={step.to}>
                        <span className="hidden sm:inline">{step.cta}</span>
                        <ArrowRight />
                      </Link>
                    </Button>
                  ) : s === "done" ? (
                    <Link
                      to={step.to}
                      className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      View
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </motion.ol>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
