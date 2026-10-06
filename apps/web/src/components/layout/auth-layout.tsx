import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BarChart3, Boxes, Check, ShoppingCart } from "lucide-react";
import { fadeRise, staggerContainer, staggerItem } from "@/lib/motion";
import { BrandLogo } from "@/components/brand-logo";

const highlights = [
  { icon: Boxes, title: "Inventory & POS", text: "Live stock, batches and a fast checkout." },
  { icon: ShoppingCart, title: "Purchasing & CRM", text: "From purchase order to loyal customer." },
  { icon: BarChart3, title: "Finance & reports", text: "Ledgers, taxes and real-time insight." },
];

function LogoMark({ size = "md" }: { size?: "md" | "lg" }) {
  // On the indigo brand panel the gold mark sits on a white tile, as in the original artwork.
  return size === "lg" ? (
    <span className="flex h-11 items-center rounded-lg bg-white px-2.5 shadow-md ring-1 ring-white/40">
      <BrandLogo className="h-7" />
    </span>
  ) : (
    <BrandLogo className="h-7" />
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative hidden overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="gradient-brand absolute inset-0" />
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />
        <div className="animate-hero-drift-b pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[26rem] w-[26rem] rounded-full bg-black/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-3">
          <LogoMark size="lg" />
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-semibold">ValGrow</span>
            <span className="block text-xs text-white/70">Business OS</span>
          </span>
        </Link>

        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          animate="show"
          className="relative max-w-md space-y-8"
        >
          <motion.h2
            variants={staggerItem}
            className="text-4xl font-semibold leading-[1.1] tracking-tight"
          >
            Run your entire business from one place.
          </motion.h2>
          <ul className="space-y-5">
            {highlights.map((h) => (
              <motion.li key={h.title} variants={staggerItem} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <h.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{h.title}</span>
                  <span className="block text-sm text-white/70">{h.text}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <div className="relative flex items-center gap-2 text-xs text-white/70">
          <Check className="h-3.5 w-3.5" />
          Secure, role-based access for every branch
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <motion.div
          variants={fadeRise}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm space-y-8"
        >
          <div className="flex items-center gap-2.5 lg:hidden">
            <LogoMark />
            <span className="font-display text-[15px] font-semibold">ValGrow Business OS</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          {footer ? <div className="text-sm text-muted-foreground">{footer}</div> : null}
        </motion.div>
      </div>
    </div>
  );
}
