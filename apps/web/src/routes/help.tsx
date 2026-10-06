import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Compass, ListChecks, Workflow } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useOnboarding } from "@/lib/onboarding";
import { staggerContainer, staggerItem } from "@/lib/motion";

const description = "Learn how ValGrow works, replay the tour, and find answers to common questions.";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Support · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Help & Support · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: HelpPage,
});

const faqs: [string, string][] = [
  [
    "Where should I start?",
    "Open the Overview and follow the getting-started checklist: add a branch, a warehouse, your products and a customer, then open the register and make your first sale.",
  ],
  [
    "Do I need to update stock by hand?",
    "No. Receiving goods adds stock and every POS sale removes it. Use Inventory → Adjust only for corrections after a stock-take or damage.",
  ],
  [
    "Where do I see how the business is doing?",
    "The Overview shows today's numbers. Reports has sales, customer and stock-movement reports you can filter and export to Excel.",
  ],
  [
    "What does each page do?",
    "Most main pages have a “How this works” button next to the page title. It explains what the page is for and where it fits in the business flow.",
  ],
];

function HelpPage() {
  const { startTour, restoreChecklist, state } = useOnboarding();

  const cards = [
    {
      icon: Compass,
      title: "Take the product tour",
      body: "A 2-minute walkthrough of the menu and the main parts of the app.",
      action: (
        <button type="button" onClick={startTour}>
          Start tour
        </button>
      ),
    },
    {
      icon: Workflow,
      title: "How ValGrow works",
      body: "See how buying, stock, selling and reports connect — step by step.",
      action: <Link to="/how-it-works">Open guide</Link>,
    },
    {
      icon: ListChecks,
      title: "Getting-started checklist",
      body: state.checklistDismissed
        ? "You hid the setup checklist. Bring it back to your Overview."
        : "Six quick setup steps, tracked on your Overview.",
      action: (
        <Link to="/" onClick={restoreChecklist}>
          {state.checklistDismissed ? "Show on Overview" : "Go to Overview"}
        </Link>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="Support" title="Help & Support" description={description} />
      <motion.div
        variants={staggerContainer(0.06)}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-3"
      >
        {cards.map((c) => (
          <motion.div
            key={c.title}
            variants={staggerItem}
            className="panel group flex flex-col p-5 transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <c.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-semibold">{c.title}</p>
            <p className="mt-1 flex-1 text-[13px] text-muted-foreground">{c.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-primary [&>a]:hover:underline [&>button]:hover:underline">
              {c.action}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </motion.div>
        ))}
      </motion.div>

      <Section title="Frequently asked questions" description="Quick answers for your first days with ValGrow.">
        <Accordion type="single" collapsible>
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-sm">{q}</AccordionTrigger>
              <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>
    </AppShell>
  );
}
