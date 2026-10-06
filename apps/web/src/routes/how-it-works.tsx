import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Compass, Pause, Play, Sparkles, X, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Button } from "@/components/ui/button";
import { COMPARISON, FLOW_STAGES } from "@/lib/onboarding-content";
import { useOnboarding } from "@/lib/onboarding";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const title = "How ValGrow works";
const description =
  "Follow one item from your supplier to your profit report — and see what ValGrow does for you at every step.";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: HowItWorksPage,
});

const AUTOPLAY_MS = 3200;

function Connector({ active }: { active: boolean }) {
  return (
    <div aria-hidden className="relative hidden h-0.5 flex-1 self-center overflow-hidden rounded-full bg-border lg:block">
      <motion.span
        className="absolute inset-y-0 left-0 bg-primary"
        initial={false}
        animate={{ width: active ? "100%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function HowItWorksPage() {
  return (
    <AppShell>
      <HowItWorksContent />
    </AppShell>
  );
}

// Rendered inside AppShell so it can reach the onboarding provider.
function HowItWorksContent() {
  const reduceMotion = useReducedMotion();
  const { startTour } = useOnboarding();
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stage = FLOW_STAGES[selected]!;

  // Play the story once on arrival unless the user prefers reduced motion.
  useEffect(() => {
    if (!reduceMotion) setPlaying(true);
  }, [reduceMotion]);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      setSelected((i) => {
        if (i >= FLOW_STAGES.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [playing, selected]);

  const choose = (i: number) => {
    setPlaying(false);
    setSelected(i);
  };

  return (
    <>
      <PageHeader
        eyebrow="Getting started"
        title={title}
        description={description}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              if (!playing && selected === FLOW_STAGES.length - 1) setSelected(0);
              setPlaying((p) => !p);
            }}
          >
            {playing ? <Pause /> : <Play />}
            {playing ? "Pause" : "Play the story"}
          </Button>
        }
      />

      {/* FLOW */}
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">The flow of your business</h2>
          <span className="tabular text-xs text-muted-foreground">
            Step {selected + 1} of {FLOW_STAGES.length}
          </span>
        </div>

        <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:items-stretch lg:gap-0">
          {FLOW_STAGES.map((s, i) => {
            const active = i === selected;
            const passed = i < selected;
            return (
              <li key={s.id} className="contents">
                <button
                  type="button"
                  onClick={() => choose(i)}
                  aria-pressed={active}
                  className={cn(
                    "group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow] lg:w-[148px] lg:shrink-0",
                    active
                      ? "border-primary/50 bg-primary-soft/50 shadow-md"
                      : "bg-surface hover:border-primary/30 hover:shadow-xs",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="flow-active"
                      className="absolute inset-0 rounded-xl ring-2 ring-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : passed
                          ? "bg-success-soft text-success"
                          : "bg-secondary text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {passed ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                  </span>
                  <span className="relative">
                    <span className="block text-sm font-semibold">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">{s.short}</span>
                  </span>
                </button>
                {i < FLOW_STAGES.length - 1 ? <Connector active={i < selected} /> : null}
              </li>
            );
          })}
        </ol>

        {/* DETAIL */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage.id}
            data-stage-detail
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="mt-6 grid gap-4 rounded-xl border bg-surface-2/50 p-5 lg:grid-cols-[1.4fr_1fr]"
          >
            <div>
              <div className="flex items-center gap-2">
                <stage.icon className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold tracking-tight">{stage.name}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{stage.detail}</p>
              <div className="mt-4 flex gap-2.5 rounded-lg bg-primary-soft/70 p-3">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-[13px] leading-relaxed">
                  <span className="font-medium">ValGrow does this for you: </span>
                  {stage.automatic}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Where you do it
              </p>
              <ul className="mt-2 space-y-1.5">
                {stage.modules.map((m) => (
                  <li key={m.to}>
                    <Link
                      to={m.to}
                      className="group flex items-center justify-between rounded-lg border bg-surface px-3 py-2 text-[13px] font-medium transition-colors hover:border-primary/40"
                    >
                      {m.label}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>

        {playing ? (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-border" aria-hidden>
            <motion.div
              key={selected}
              className="h-full bg-primary/60"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
            />
          </div>
        ) : null}
      </section>

      {/* COMPARISON */}
      <section className="panel overflow-hidden">
        <div className="border-b px-5 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Why one connected system is better
          </h2>
          <p className="text-[13px] text-muted-foreground">
            What changes when every part of your business talks to the others.
          </p>
        </div>
        <div className="hidden grid-cols-[160px_1fr_1fr] gap-4 border-b bg-surface-2/60 px-6 py-2.5 text-xs font-medium text-muted-foreground md:grid">
          <span />
          <span>The old way</span>
          <span>With ValGrow</span>
        </div>
        <motion.ul variants={staggerContainer(0.05)} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {COMPARISON.map((row) => (
            <motion.li
              key={row.topic}
              variants={staggerItem}
              className="grid gap-2 border-b px-5 py-4 last:border-0 sm:px-6 md:grid-cols-[160px_1fr_1fr] md:gap-4"
            >
              <span className="text-[13px] font-semibold">{row.topic}</span>
              <span className="flex gap-2 text-[13px] text-muted-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
                {row.old}
              </span>
              <span className="flex gap-2 text-[13px] text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {row.valgrow}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      {/* CTA */}
      <section className="panel flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 className="text-sm font-semibold">Ready to try it?</h2>
          <p className="text-[13px] text-muted-foreground">
            Take the guided tour of the app, or head to your Overview and follow the setup checklist.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={startTour}>
            <Compass />
            Take the tour
          </Button>
          <Button asChild>
            <Link to="/">
              Go to Overview
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
