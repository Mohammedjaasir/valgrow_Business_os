import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WELCOME } from "@/lib/onboarding-content";
import { useOnboarding } from "@/lib/onboarding";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { BrandLogo } from "@/components/brand-logo";

const HOW_IT_WORKS_PATH: string = "/how-it-works";

function HeroMark() {
  return (
    <div className="relative mx-auto flex h-16 w-20 items-center justify-center">
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-2xl border border-primary/30"
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 1.2, ease: "easeOut" }}
        />
      ))}
      <motion.span
        initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className="relative flex h-16 w-20 items-center justify-center rounded-2xl border bg-surface shadow-lg"
      >
        <BrandLogo className="h-9" />
      </motion.span>
    </div>
  );
}

export function WelcomeDialog() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { ready, state, tourOpen, markWelcomeSeen, startTour } = useOnboarding();
  const open = ready && !state.welcomeSeen && !tourOpen && pathname === "/";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && markWelcomeSeen()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <div className="relative border-b bg-surface-2/60 px-6 pb-6 pt-8 text-center sm:px-8">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] dark:opacity-20" />
          <div className="relative">
            <HeroMark />
            <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {WELCOME.eyebrow}
            </p>
            <DialogTitle className="mt-2 text-2xl font-semibold tracking-tight">
              {WELCOME.title}
            </DialogTitle>
            <DialogDescription className="mx-auto mt-2 max-w-sm text-sm">
              {WELCOME.subtitle}
            </DialogDescription>
            <Link
              to={HOW_IT_WORKS_PATH}
              onClick={markWelcomeSeen}
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
            >
              {WELCOME.link}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <motion.ul
          variants={staggerContainer(0.08)}
          initial="hidden"
          animate="show"
          className="space-y-1 px-4 py-4 sm:px-6"
        >
          {WELCOME.benefits.map((b) => (
            <motion.li
              key={b.title}
              variants={staggerItem}
              className="flex gap-3 rounded-lg p-2.5 transition-colors hover:bg-surface-2/70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <b.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{b.title}</span>
                <span className="block text-[13px] text-muted-foreground">{b.text}</span>
              </span>
            </motion.li>
          ))}
        </motion.ul>

        <div className="flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <Button variant="ghost" onClick={markWelcomeSeen}>
            {WELCOME.secondary}
          </Button>
          <Button onClick={startTour}>
            {WELCOME.primary}
            <ArrowRight />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
