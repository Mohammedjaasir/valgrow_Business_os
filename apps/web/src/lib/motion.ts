import { createElement, useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, type Transition, type Variants } from "motion/react";
import { useRouterState } from "@tanstack/react-router";

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: easeOut } },
};

export const staggerContainer = (stagger = 0.03): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger } },
});

export const staggerItem = fadeRise;

export const overlaySpring: Transition = { type: "spring", stiffness: 400, damping: 30 };

/** Fades and lifts route content in whenever the pathname changes. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return createElement(
    motion.div,
    {
      key: pathname,
      variants: fadeRise,
      initial: "hidden",
      animate: "show",
      className: "min-w-0 space-y-6",
    },
    children,
  );
}

/** Animates from the previous value to `value`; returns the in-flight number. */
export function useCountUp(value: number, durationMs = 600) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(value)) return;
    const controls = animate(from.current, value, {
      duration: durationMs / 1000,
      ease: easeOut,
      onUpdate: (v) => setDisplay(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, durationMs]);

  return display;
}
