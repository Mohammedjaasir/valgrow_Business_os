import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOUR_STEPS } from "@/lib/onboarding-content";
import { useOnboarding } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

const CARD_WIDTH = 340;
const GAP = 16;
const MARGIN = 16;
const PAD = 6;
// Sidebar width animates over 200ms when the tour force-expands it.
const SETTLE_MS = 260;

// Current step survives AppShell remounts (e.g. browser Back during the tour).
let stepAcrossRoutes = 0;

type Box = { top: number; left: number; width: number; height: number };
type Placement = { mode: "anchored"; top: number; left: number } | { mode: "sheet" };

function measureTarget(target: string): Box | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const visible =
    r.width > 0 &&
    r.height > 0 &&
    r.bottom > 0 &&
    r.right > 0 &&
    r.top < window.innerHeight &&
    r.left < window.innerWidth;
  if (!visible) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), Math.max(min, max));
}

function place(box: Box | null, cardH: number): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw < 640) return { mode: "sheet" };
  if (!box) {
    return { mode: "anchored", top: Math.max(MARGIN, (vh - cardH) / 2), left: (vw - CARD_WIDTH) / 2 };
  }

  const fitsRight = box.left + box.width + GAP + CARD_WIDTH <= vw - MARGIN;
  // Short elements in the top bar (e.g. search) read better with the card below them.
  const inTopBar = box.top < 100 && box.height < 120;

  if (fitsRight && !inTopBar) {
    return {
      mode: "anchored",
      left: box.left + box.width + GAP,
      top: clamp(box.top + box.height / 2 - cardH / 2, MARGIN, vh - cardH - MARGIN),
    };
  }
  const below = box.top + box.height + GAP;
  const top = below + cardH <= vh - MARGIN ? below : box.top - GAP - cardH;
  return {
    mode: "anchored",
    top: clamp(top, MARGIN, vh - cardH - MARGIN),
    left: clamp(box.left + box.width / 2 - CARD_WIDTH / 2, MARGIN, vw - CARD_WIDTH - MARGIN),
  };
}

export function ProductTour() {
  const { tourOpen, closeTour } = useOnboarding();
  const [index, setIndexState] = useState(() => stepAcrossRoutes);
  const [box, setBox] = useState<Box | null>(null);
  const [placement, setPlacement] = useState<Placement>({ mode: "sheet" });
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const setIndex = useCallback((update: number | ((i: number) => number)) => {
    setIndexState((prev) => {
      const value = typeof update === "function" ? update(prev) : update;
      stepAcrossRoutes = value;
      return value;
    });
  }, []);
  const step = TOUR_STEPS[index]!;
  const last = index === TOUR_STEPS.length - 1;

  // Reset only when the tour closes, so a remount mid-tour keeps the current step.
  useEffect(() => {
    if (!tourOpen) setIndex(0);
  }, [tourOpen, setIndex]);

  const measure = useCallback(() => {
    const next = measureTarget(step.target);
    setBox(next);
    setPlacement(place(next, cardRef.current?.offsetHeight ?? 240));
  }, [step.target]);

  // Measure now, then again once the sidebar has finished expanding.
  useLayoutEffect(() => {
    if (!tourOpen) return;
    // Bring the target into view once per step; later scrolls are the user's.
    document
      .querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    measure();
    const t = window.setTimeout(measure, SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [tourOpen, measure, step.target]);

  useEffect(() => {
    if (!tourOpen) return;
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [tourOpen, measure]);

  const next = useCallback(() => {
    if (last) closeTour(true);
    else setIndex((i) => i + 1);
  }, [last, closeTour, setIndex]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [setIndex]);

  useEffect(() => {
    if (!tourOpen) return;
    // Capture phase: the tour owns the keyboard while it is open, so page-level
    // listeners (POS barcode scanner, shortcuts) don't react behind it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeTour(true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        back();
      } else if (e.key === "Tab") {
        // Keep focus inside the card (aria-modal).
        const card = cardRef.current;
        if (!card) return;
        const items = Array.from(card.querySelectorAll<HTMLElement>("button, a[href]"));
        if (items.length === 0) return;
        const first = items[0]!;
        const lastItem = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [tourOpen, next, back, closeTour]);

  // Remember what had focus before the tour and give it back afterwards.
  useEffect(() => {
    if (tourOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      return;
    }
    returnFocusRef.current?.focus?.({ preventScroll: true });
    returnFocusRef.current = null;
  }, [tourOpen]);

  // Keep keyboard users on the primary action as they step through.
  useEffect(() => {
    if (!tourOpen) return;
    const t = window.setTimeout(() => nextRef.current?.focus({ preventScroll: true }), 30);
    return () => window.clearTimeout(t);
  }, [tourOpen, index]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {tourOpen ? (
        <motion.div
          key="tour"
          className="fixed inset-0 z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Click shield + dim. With a target, the spotlight's shadow does the dimming. */}
          <div className={cn("absolute inset-0", !box && "bg-black/55 backdrop-blur-[1px]")} />

          {box ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute rounded-lg ring-2 ring-primary"
              style={{ boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)" }}
              initial={false}
              animate={{
                top: box.top - PAD,
                left: box.left - PAD,
                width: box.width + PAD * 2,
                height: box.height + PAD * 2,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            />
          ) : null}

          <motion.div
            key={placement.mode}
            ref={cardRef}
            data-tour-card
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            aria-describedby="tour-body"
            tabIndex={-1}
            className={cn(
              "absolute max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none",
              placement.mode === "sheet" && "inset-x-3 bottom-3",
            )}
            style={placement.mode === "sheet" ? {} : { width: CARD_WIDTH }}
            initial={false}
            animate={
              placement.mode === "anchored"
                ? { top: placement.top, left: placement.left, opacity: 1, scale: 1 }
                : { opacity: 1, scale: 1 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-4">
              <span className="tabular text-xs font-medium text-muted-foreground">
                Step {index + 1} of {TOUR_STEPS.length}
              </span>
              <button
                type="button"
                onClick={() => closeTour(true)}
                className="-mr-1 flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Skip tour
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="px-5 pb-4 pt-2"
                aria-live="polite"
              >
                <h2 id="tour-title" className="text-base font-semibold tracking-tight">
                  {step.title}
                </h2>
                <p id="tour-body" className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {step.what}
                </p>
                <div className="mt-3 flex gap-2.5 rounded-lg bg-primary-soft/70 p-3">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-[13px] leading-relaxed text-foreground">
                    <span className="font-medium">Why it matters: </span>
                    {step.why}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
              <div className="flex items-center gap-1" aria-hidden>
                {TOUR_STEPS.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === index ? "w-4 bg-primary" : i < index ? "w-1.5 bg-primary/50" : "w-1.5 bg-border",
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                {index > 0 ? (
                  <Button variant="ghost" size="sm" onClick={back}>
                    <ArrowLeft />
                    Back
                  </Button>
                ) : null}
                <Button ref={nextRef} size="sm" onClick={next}>
                  {last ? (
                    <>
                      Finish
                      <Check />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
