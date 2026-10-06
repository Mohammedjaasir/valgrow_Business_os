import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronRight, CircleHelp, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PAGE_GUIDES, type PageGuideId } from "@/lib/onboarding-content";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const HOW_IT_WORKS_PATH: string = "/how-it-works";

/** "How this works" button that opens a side panel explaining the current page. */
export function PageGuideButton({ id, className }: { id: PageGuideId; className?: string }) {
  const [open, setOpen] = useState(false);
  const guide = PAGE_GUIDES[id];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn("text-muted-foreground", className)}
        onClick={() => setOpen(true)}
      >
        <CircleHelp />
        How this works
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="space-y-1.5 border-b px-6 pb-5 pt-6 text-left">
            <p className="text-xs font-medium text-primary">How this works</p>
            <SheetTitle className="text-lg tracking-tight">{guide.title}</SheetTitle>
            <SheetDescription className="text-[13px] leading-relaxed">{guide.purpose}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Where it fits
              </h3>
              <motion.ol
                variants={staggerContainer(0.06)}
                initial="hidden"
                animate="show"
                className="mt-3 flex flex-wrap items-center gap-1.5"
              >
                {guide.flow.map((stage, i) => (
                  <Fragment key={stage.label}>
                    <motion.li variants={staggerItem}>
                      {i === guide.current ? (
                        <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-xs">
                          {stage.label}
                        </span>
                      ) : (
                        <Link
                          to={stage.to}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center rounded-md border bg-surface px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          {stage.label}
                        </Link>
                      )}
                    </motion.li>
                    {i < guide.flow.length - 1 ? (
                      <motion.li variants={staggerItem} aria-hidden className="text-muted-foreground/60">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </motion.li>
                    ) : null}
                  </Fragment>
                ))}
              </motion.ol>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What you can do here
              </h3>
              <motion.ul
                variants={staggerContainer(0.07)}
                initial="hidden"
                animate="show"
                className="mt-3 space-y-2"
              >
                {guide.actions.map((a) => (
                  <motion.li
                    key={a.title}
                    variants={staggerItem}
                    className="flex gap-3 rounded-lg border bg-surface p-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                      <a.icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-[13px] font-medium text-foreground">{a.title}</span>
                      <span className="block text-xs text-muted-foreground">{a.text}</span>
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          </div>

          <div className="border-t px-6 py-4">
            <Button asChild variant="outline" className="w-full">
              <Link to={HOW_IT_WORKS_PATH} onClick={() => setOpen(false)}>
                <Workflow />
                See how everything connects
                <ArrowRight className="ml-auto" />
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
