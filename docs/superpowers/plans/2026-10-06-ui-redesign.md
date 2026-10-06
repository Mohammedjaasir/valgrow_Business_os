# UI Redesign (Refined Enterprise) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the ValGrow web app to a refined-enterprise, indigo-accented design with subtle motion, touching only `apps/web`.

**Architecture:** Change the design at the system layer first (CSS tokens → shadcn primitives → shell → foundation components) so all 78 routes inherit it, then hand-rebuild the markup of 7 flagship pages while keeping their hooks, handlers and payloads verbatim. Motion is centralized in `src/lib/motion.ts` and a `MotionConfig` in `__root.tsx`.

**Tech Stack:** React 19, TanStack Start/Router/Query, Tailwind v4 (`@theme` tokens in `src/styles.css`), shadcn/ui (new-york), lucide-react, recharts, `motion` (new).

**Spec:** `docs/superpowers/specs/2026-10-06-ui-redesign-design.md`

## Global Constraints

- No file outside `apps/web/` changes except `package-lock.json` and these docs.
- No changes to `src/hooks/queries/*`, `src/lib/api-client.ts`, route paths, mutation payloads, validation, or event-handler logic.
- Only new dependency: `motion` (in `apps/web/package.json`).
- Colors only via tokens; no `slate-*`, `purple-*`, `violet-*`, or hex literals in components after Task 10.
- Light + dark both correct; `.dark` must define real dark values.
- Responsive to 360px wide, no horizontal page scroll.
- All motion disabled under `prefers-reduced-motion` (`MotionConfig reducedMotion="user"` + CSS media query).
- Accent: indigo `oklch(0.51 0.23 277)` light / `oklch(0.62 0.2 277)` dark. Fonts: Inter (UI), Inter Tight (display).

## Review Focus

1. **Dark mode** — toggling theme must flip every surface; any leftover hardcoded light color is a bug. Pinned by Task 10's grep check + dark screenshots.
2. **POS barcode scanning** — the global USB scanner listener in `pos.tsx` must still add items after the rebuild (focus/keydown wiring untouched). Pinned in Task 7 manual check.
3. **Empty / loading / error data** — fresh DB has little data; Overview chart, recent sales, and lists must show designed empty states, not blank boxes or NaN. Pinned in Tasks 4 and 5.
4. **Long values** — long org names, product names, and large amounts must truncate/wrap without breaking layout at 390px. Pinned in Task 3 and Task 7 mobile screenshots.
5. **Refetch re-animation** — list stagger must run on first mount only, not on every query refetch. Pinned in Task 4 (`initial` keyed to mount, not data).

## Verification commands (used by every task)

- Typecheck: `cd apps/web && npx tsc --noEmit` → exit 0 (compare against baseline error count captured in Task 1 if baseline is non-zero).
- Build: `npm run build:web` (from repo root) → exit 0.
- Visual: dev servers on `:8080` (web) and `:3001` (api); screenshot with the browser skill at 1440×900 and 390×844, light and dark.

---

### Task 1: Branch, motion dependency, tokens, fonts, motion foundation

**Files:**
- Modify: `apps/web/package.json` (add `motion`)
- Modify: `apps/web/src/styles.css` (full token rewrite, utilities)
- Modify: `apps/web/src/routes/__root.tsx` (font links, MotionConfig, 404/error restyle)
- Create: `apps/web/src/lib/motion.ts`

**Interfaces — Produces:**
- `fadeRise: Variants`, `staggerContainer(stagger?: number): Variants`, `staggerItem: Variants`, `overlaySpring: Transition` from `@/lib/motion`
- `<PageTransition>{children}</PageTransition>` from `@/lib/motion` (keys by pathname)
- `useCountUp(value: number, durationMs?: number): number` from `@/lib/motion`
- Tokens: existing names kept + `--success-soft`, `--warning-soft`, `--destructive-soft`, `--info-soft`, `--primary-soft`, `--shadow-xs|md|lg`; utilities `panel`, `tabular`, `shimmer`.

- [ ] **Step 1:** `git switch -c feat/ui-redesign` (carries the user's uncommitted POS/warehouse edits along untouched; never stage them).
- [ ] **Step 2:** Capture baseline: `cd apps/web && npx tsc --noEmit 2>&1 | grep -c "error TS"` → record N.
- [ ] **Step 3:** `npm install motion --workspace=apps/web`.
- [ ] **Step 4:** Rewrite `:root` / `.dark` in `styles.css`:

```css
@theme {
  --font-display: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
:root {
  --radius: 0.5rem;
  --background: oklch(0.985 0.002 286);
  --foreground: oklch(0.21 0.006 286);
  --surface: oklch(1 0 0);
  --surface-2: oklch(0.967 0.003 286);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.21 0.006 286);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.21 0.006 286);
  --primary: oklch(0.51 0.23 277);
  --primary-foreground: oklch(0.985 0 0);
  --primary-soft: oklch(0.96 0.03 277);
  --brand: oklch(0.51 0.23 277);
  --brand-glow: oklch(0.6 0.2 290);
  --secondary: oklch(0.967 0.003 286);
  --secondary-foreground: oklch(0.21 0.006 286);
  --muted: oklch(0.967 0.003 286);
  --muted-foreground: oklch(0.55 0.014 286);
  --accent: oklch(0.955 0.006 286);
  --accent-foreground: oklch(0.21 0.006 286);
  --destructive: oklch(0.58 0.22 25);
  --destructive-foreground: oklch(0.985 0 0);
  --destructive-soft: oklch(0.96 0.03 25);
  --success: oklch(0.6 0.15 155);
  --success-soft: oklch(0.96 0.04 155);
  --warning: oklch(0.68 0.15 65);
  --warning-soft: oklch(0.97 0.05 80);
  --info: oklch(0.6 0.15 245);
  --info-soft: oklch(0.96 0.03 245);
  --border: oklch(0.92 0.004 286);
  --input: oklch(0.9 0.004 286);
  --ring: oklch(0.51 0.23 277);
  --chart-1: oklch(0.51 0.23 277);
  --chart-2: oklch(0.7 0.13 200);
  --chart-3: oklch(0.72 0.15 155);
  --chart-4: oklch(0.78 0.14 75);
  --chart-5: oklch(0.65 0.2 340);
  --sidebar: oklch(0.985 0.002 286);
  --sidebar-foreground: oklch(0.37 0.01 286);
  --sidebar-primary: oklch(0.51 0.23 277);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.955 0.006 286);
  --sidebar-accent-foreground: oklch(0.21 0.006 286);
  --sidebar-border: oklch(0.92 0.004 286);
  --sidebar-ring: oklch(0.51 0.23 277);
  --gradient-brand: linear-gradient(135deg, var(--brand), var(--brand-glow));
  --shadow-xs: 0 1px 2px oklch(0.2 0.01 286 / 0.05);
  --shadow-md: 0 4px 12px -2px oklch(0.2 0.01 286 / 0.08), 0 2px 4px -2px oklch(0.2 0.01 286 / 0.05);
  --shadow-lg: 0 24px 48px -12px oklch(0.2 0.01 286 / 0.18);
  --shadow-card: var(--shadow-xs);
  --shadow-panel: var(--shadow-lg);
}
.dark {
  --background: oklch(0.145 0.004 286);
  --foreground: oklch(0.96 0.003 286);
  --surface: oklch(0.18 0.005 286);
  --surface-2: oklch(0.21 0.006 286);
  --card: oklch(0.18 0.005 286);
  --card-foreground: oklch(0.96 0.003 286);
  --popover: oklch(0.2 0.006 286);
  --popover-foreground: oklch(0.96 0.003 286);
  --primary: oklch(0.62 0.2 277);
  --primary-foreground: oklch(0.99 0 0);
  --primary-soft: oklch(0.28 0.07 277);
  --brand: oklch(0.62 0.2 277);
  --brand-glow: oklch(0.68 0.18 290);
  --secondary: oklch(0.24 0.006 286);
  --secondary-foreground: oklch(0.96 0.003 286);
  --muted: oklch(0.24 0.006 286);
  --muted-foreground: oklch(0.68 0.012 286);
  --accent: oklch(0.25 0.006 286);
  --accent-foreground: oklch(0.96 0.003 286);
  --destructive: oklch(0.65 0.2 25);
  --destructive-foreground: oklch(0.99 0 0);
  --destructive-soft: oklch(0.28 0.07 25);
  --success: oklch(0.7 0.15 155);
  --success-soft: oklch(0.27 0.05 155);
  --warning: oklch(0.78 0.14 75);
  --warning-soft: oklch(0.29 0.05 75);
  --info: oklch(0.7 0.13 245);
  --info-soft: oklch(0.27 0.05 245);
  --border: oklch(0.27 0.006 286);
  --input: oklch(0.3 0.006 286);
  --ring: oklch(0.62 0.2 277);
  --chart-1: oklch(0.65 0.2 277);
  --chart-2: oklch(0.72 0.12 200);
  --chart-3: oklch(0.74 0.14 155);
  --chart-4: oklch(0.8 0.13 75);
  --chart-5: oklch(0.7 0.18 340);
  --sidebar: oklch(0.16 0.005 286);
  --sidebar-foreground: oklch(0.8 0.008 286);
  --sidebar-primary: oklch(0.62 0.2 277);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.24 0.006 286);
  --sidebar-accent-foreground: oklch(0.96 0.003 286);
  --sidebar-border: oklch(0.25 0.006 286);
  --sidebar-ring: oklch(0.62 0.2 277);
  --shadow-xs: 0 1px 2px oklch(0 0 0 / 0.3);
  --shadow-md: 0 6px 16px -4px oklch(0 0 0 / 0.5);
  --shadow-lg: 0 24px 48px -12px oklch(0 0 0 / 0.6);
}
```

Register new colors in `@theme inline` (`--color-primary-soft`, `--color-success-soft`, `--color-warning-soft`, `--color-destructive-soft`, `--color-info-soft`). Base layer: `body { font-feature-settings: "cv11", "ss01", "ss03"; -webkit-font-smoothing: antialiased; }`; headings `letter-spacing: -0.02em`. Utilities: `panel` (surface, 1px border, `--radius-lg`, `--shadow-xs`), `tabular { font-variant-numeric: tabular-nums; }`, `shimmer` (keyframe gradient sweep, disabled under reduced motion). Keep existing `gradient-brand`, `text-gradient-brand`, `animate-hero-drift-*` utilities.

- [ ] **Step 5:** `src/lib/motion.ts`:

```tsx
import { useEffect, useRef, useState, type ReactNode } from "react";
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

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <motion.div key={pathname} variants={fadeRise} initial="hidden" animate="show" className="min-w-0 space-y-6">
      {children}
    </motion.div>
  );
}

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
```

- [ ] **Step 6:** `__root.tsx`: add Google Fonts `<link>`s (preconnect + `Inter:wght@400;500;600;700` and `Inter+Tight:wght@500;600;700`, `display=swap`) to `head.links`; wrap app children in `<MotionConfig reducedMotion="user">`; restyle `NotFoundComponent` / `ErrorComponent` with tokens (muted "404" numerals in `font-display`, primary + outline `Button`s).
- [ ] **Step 7:** Typecheck (≤ N errors) and `npm run build:web` pass. Screenshot `/` light: still renders (old layout, new colors).
- [ ] **Step 8:** Commit `feat(web): enterprise design tokens, fonts, and motion foundation`.

### Task 2: shadcn primitive restyle

**Files (modify):** `src/components/ui/{button,badge,input,textarea,select,card,table,tabs,dialog,sheet,popover,dropdown-menu,tooltip,skeleton,sonner,checkbox,switch,pagination}.tsx`

**Interfaces — Produces:** `Badge` variants `success | warning | destructive-soft | info | neutral` added (existing variants kept); `Button` gains `size="xs"`.

- [ ] **Step 1:** `button.tsx` base: `rounded-md font-medium transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background`. Variants: default `bg-primary text-primary-foreground shadow-xs hover:bg-primary/90`; outline `border border-input bg-surface shadow-xs hover:bg-accent`; secondary `bg-secondary hover:bg-accent`; ghost `hover:bg-accent text-muted-foreground hover:text-foreground`. Sizes: xs `h-7 px-2.5 text-xs`, sm `h-8 px-3 text-[13px]`, default `h-9 px-3.5`, lg `h-10 px-5`, icon `h-9 w-9`.
- [ ] **Step 2:** `badge.tsx`: base `rounded-md px-2 py-0.5 text-xs font-medium gap-1`; add variants `success: "border-transparent bg-success-soft text-success"`, `warning: "border-transparent bg-warning-soft text-warning"`, `"destructive-soft": "border-transparent bg-destructive-soft text-destructive"`, `info: "border-transparent bg-info-soft text-info"`, `neutral: "border-transparent bg-secondary text-muted-foreground"`.
- [ ] **Step 3:** Inputs/select trigger/textarea: `h-9 rounded-md border-input bg-surface shadow-xs placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20`.
- [ ] **Step 4:** `card.tsx`: `rounded-lg border bg-card shadow-xs`; header `p-5`, title `text-sm font-semibold`. `table.tsx`: head `h-10 text-xs font-medium text-muted-foreground bg-surface-2/60`, row `hover:bg-surface-2/60 transition-colors`, cell `py-3`. `tabs.tsx`: list `bg-secondary rounded-md p-1`, trigger active `bg-surface shadow-xs text-foreground`.
- [ ] **Step 5:** Overlays: `dialog`/`sheet` content `shadow-lg border rounded-xl` (sheet: square edge side), overlay `bg-black/40 backdrop-blur-[2px]`; keep Radix `data-[state]` tw-animate classes but set `duration-200` and `zoom-in-[0.97]`. Popover/dropdown `shadow-md rounded-lg p-1`, items `rounded-md h-8`. Tooltip `bg-foreground text-background text-xs`. Skeleton: `bg-muted shimmer`.
- [ ] **Step 6:** Typecheck + build. Screenshot `/products` (list page) light + dark.
- [ ] **Step 7:** Commit `feat(web): restyle shadcn primitives for enterprise look`.

### Task 3: App shell, breadcrumbs, command palette

**Files (modify):** `src/components/layout/app-shell.tsx`, `src/components/layout/breadcrumbs.tsx`, `src/components/layout/command-palette.tsx`

**Interfaces:** `AppShell({ children, rightPanel?, fullBleed? })` — new optional `fullBleed?: boolean` (no max-width/padding, used by POS). All hook calls (`useCurrentUser`, `useOrganizations`, `useBranches`, `useNotifications`, `useLogoutMutation`, `setActiveOrgId`) kept exactly.

- [ ] **Step 1:** Remove outer framed card (`bg-slate-50 p-3` wrapper + rounded border box). Layout: `flex h-screen bg-background`.
- [ ] **Step 2:** Sidebar `bg-sidebar border-r`, width `w-[248px]` / compact `w-[60px]`, animated with `transition-[width] duration-200`; compact state persisted under localStorage key `valgrow-sidebar-compact` (try/catch). Header row (h-14): `OrgSwitcher` moved here as workspace switcher (logo mark `rounded-md bg-primary text-primary-foreground` "VG" + org name + chevrons); in compact show only mark. Remove "Upgrade plan" card; footer = Help link + collapse toggle.
- [ ] **Step 3:** Nav items `h-8 rounded-md px-2 text-[13px] gap-2.5`, inactive `text-sidebar-foreground hover:bg-sidebar-accent`, active `text-foreground font-medium` with a `motion.span layoutId="nav-active"` absolute background `bg-sidebar-accent` + 2px left indicator `bg-primary`. Group labels `text-[11px] font-medium text-muted-foreground px-2 mt-4`. Compact: icon-only with `Tooltip` showing title.
- [ ] **Step 4:** Topbar `h-14 sticky top-0 z-20 border-b bg-background/80 backdrop-blur`: left = mobile menu button + `Breadcrumbs`; center/right = search trigger button (`w-64 justify-between text-muted-foreground`, "Search…" + `⌘K` kbd) that opens `CommandPalette`, plus global `keydown` listener for ⌘/Ctrl+K; `BranchSwitcher` (ghost), `ThemeSwitcher`, `NotificationBell` (badge uses `bg-primary`), `UserMenu` (avatar `bg-primary-soft text-primary`, name hidden < md). Replace every slate/purple/hex class with tokens. Remove hardcoded "Overview" title.
- [ ] **Step 5:** Main: `overflow-y-auto`; inner `mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8` (skip when `fullBleed`); wrap children in `<PageTransition>`.
- [ ] **Step 6:** Breadcrumbs: `text-[13px] text-muted-foreground`, last crumb `text-foreground font-medium`, chevron separators. Command palette: `rounded-xl shadow-lg`, group headings styled small.
- [ ] **Step 7:** Long-name check: temporarily view with org name from API; truncation via `min-w-0 truncate` on switcher text.
- [ ] **Step 8:** Typecheck + build. Screenshots: `/` desktop light/dark, compact sidebar, 390px with drawer open.
- [ ] **Step 9:** Commit `feat(web): redesign app shell with animated sidebar and command bar`.

### Task 4: Foundation components

**Files (modify):** `src/components/foundation/{page-header,list-page,data-table,stat-card,states,notification-item,upload-zone}.tsx`

**Interfaces:**
- `PageHeader` props unchanged; breadcrumbs removed from it (now in topbar) — `PageHeader` renders eyebrow, title, description, actions.
- `StatCard({ label, value, hint?, icon?, tone?, delta?, trend? })` — new optional `delta?: { value: string; direction: "up" | "down" | "flat" }`, `trend?: number[]` (sparkline). `value` stays `string`; if it parses as a number (after stripping currency/commas) it is count-up animated and re-formatted preserving prefix/suffix.
- `StatusBadge` maps to Badge variants: Active/Enabled/Success/Paid/Completed/Delivered/Confirmed → `success`; Pending/Draft/Processing/Partially* → `warning`; Failed/Revoked/Cancelled/Overdue → `destructive-soft`; else `neutral`. Case-insensitive.
- `DataTable`, `ListPage`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `CardSkeleton`, `Section` signatures unchanged.

- [ ] **Step 1:** `PageHeader`: `flex flex-wrap items-end justify-between gap-4 pb-2`; eyebrow `text-xs font-medium text-primary`; title `text-2xl font-semibold tracking-tight font-display`; description `text-sm text-muted-foreground max-w-2xl`.
- [ ] **Step 2:** `StatCard`: `panel p-5`; label `text-[13px] text-muted-foreground font-medium`; icon in `h-8 w-8 rounded-md bg-primary-soft text-primary` (brand tone) or `bg-secondary text-muted-foreground`; value `text-2xl font-semibold tabular mt-2` using `useCountUp`; delta chip `text-xs font-medium` success/destructive coloured with arrow icon; sparkline = inline 80×28 SVG `polyline` stroke `var(--color-primary)` when `trend.length > 1`. Drop the blurred gradient blob. NaN-safe: non-numeric `value` renders as-is.
- [ ] **Step 3:** `DataTable`: `panel overflow-hidden`; toolbar `px-4 py-3 border-b`; table header `sticky top-0`; body rows wrapped with `motion.tr` via `TableRow asChild`-free approach: render `<motion.tbody variants={staggerContainer(0.02)} initial="hidden" animate="show">` with rows as `motion.tr` using `staggerItem` (only first 20 rows animate; rest render static). Stagger keyed to component mount (no `key` on data), so refetch doesn't replay. Footer: `text-xs text-muted-foreground` "Showing N records" (drop "placeholder").
- [ ] **Step 4:** `ListPage`: header actions — `Export` outline with `Download` icon, primary with `Plus`; stats grid uses StatCard with `icon` none; toolbar search `h-8 w-full sm:w-72` + `Filters` outline sm with `ListFilter` icon + `Columns` ghost with `Columns3` icon. Layout `space-y-6`.
- [ ] **Step 5:** `states.tsx`: Empty — no dashed border; `py-16`, icon `h-10 w-10 rounded-lg bg-secondary text-muted-foreground`, title `text-sm font-semibold`, description `text-[13px]`; default copy "No records yet" / "Records you create will show up here.". Error — `bg-destructive-soft/40 border-destructive/20`, default description "We couldn't load this data. Check your connection and try again.". LoadingSkeleton rows → table-like rows (`h-12` lines with 4 cells). Fade-in via `motion.div` `fadeRise`.
- [ ] **Step 6:** `notification-item`, `upload-zone`: token-only classes, `rounded-md`, hover `bg-accent`.
- [ ] **Step 7:** Typecheck + build. Screenshots: `/products`, `/suppliers` (ListPage), an empty list, light/dark. Reload list and confirm rows animate once; trigger refetch (window refocus) and confirm no replay.
- [ ] **Step 8:** Commit `feat(web): redesign foundation components with motion`.

### Task 5: Overview dashboard

**Files:**
- Modify: `src/routes/index.tsx`
- Create: `src/components/dashboard/overview.tsx` (new sections: `OverviewGreeting`, `KpiGrid`, `RevenueChartCard`, `RecentSalesCard`, `AttentionCard`, `QuickActions`)
- Delete after switching: `overview-components.tsx`, `overview-illustrations.tsx`, `hero-card.tsx`, `module-card.tsx`, `right-panel.tsx` — only if `grep -r` shows no other importers.

**Interfaces — Consumes:** `useDashboardOverview()`, `useCurrentUser()`, `useSalesReport({ dateFrom, dateTo })` (last 30 days, ISO date strings `YYYY-MM-DD`), `StatCard`, `EmptyState`, `ErrorState`, `CardSkeleton`, `staggerContainer`, `staggerItem`.

- [ ] **Step 1:** `OverviewGreeting`: "Good morning/afternoon/evening, {firstName}" (from `currentUser` if present, else no name), today's date `Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'})`, right side `QuickActions`: outline buttons linking to `/pos` (New sale), `/products` (Add product), `/purchase-orders` (New PO).
- [ ] **Step 2:** `KpiGrid` (staggered, `grid sm:grid-cols-2 xl:grid-cols-4`): Today's sales (`todaysTotalPosSales`, currency via `Intl.NumberFormat(undefined,{style:'currency',currency:'USD'})`, trend from `salesByDate` totals), Orders today (`todaysOrderCount`), Active customers, Active products. Second row of compact stat chips: Low stock (warning tone → links `/inventory`), Open POs (`/purchase-orders`), Pending GRNs (`/goods-receipts`). Loading → 4 `CardSkeleton`; error → `ErrorState onRetry={refetch}`.
- [ ] **Step 3:** `RevenueChartCard` (xl col-span-2): recharts `AreaChart` of `salesByDate` (x: short date, y: totalSales), gradient fill from `var(--color-chart-1)` 25%→0, stroke 2px, no vertical gridlines, horizontal grid `var(--color-border)`, tooltip styled as popover. Header shows 30-day total (`summary.totalSales`) and order count. Empty `salesByDate` → `EmptyState` "No sales in the last 30 days".
- [ ] **Step 4:** `RecentSalesCard`: last 6 `records` sorted by date desc — number, customer, date, `StatusBadge`, right-aligned tabular total; link "View all" → `/reports`. Empty → EmptyState.
- [ ] **Step 5:** `AttentionCard`: list rows for low stock / pending GRNs / open POs counts with icon, count, chevron link; all-zero → "You're all caught up" success state.
- [ ] **Step 6:** `index.tsx` composes: Greeting, KpiGrid, `grid xl:grid-cols-3 gap-6` [RevenueChart (col-span-2), Attention], RecentSales.
- [ ] **Step 7:** Typecheck + build. Screenshots `/` light/dark, desktop + 390px; confirm zero-data state shows designed empties (fresh seed has no sales).
- [ ] **Step 8:** Commit `feat(web): data-first overview dashboard`.

### Task 6: Auth pages

**Files (modify):** `src/components/layout/auth-layout.tsx`, `src/routes/login.tsx`, `src/routes/forgot-password.tsx`, `src/routes/reset-password.tsx`

- [ ] **Step 1:** `AuthLayout`: `grid min-h-screen lg:grid-cols-2`. Left (hidden < lg): `gradient-brand` background with layered radial highlights + subtle grid pattern (CSS `background-image: linear-gradient(...)` 32px), brand mark, headline "Run your entire business from one place.", 3 value bullets (Inventory & POS, Purchasing & CRM, Finance & reports) with check icons, footer © line. Right: centered `max-w-sm` form column with mobile brand mark.
- [ ] **Step 2:** Login/forgot/reset: keep form state, handlers, mutations, validation and redirects verbatim; restyle fields (`Label` + `Input` h-10), primary full-width submit with loading spinner, error as inline `Alert` destructive-soft. Remove hardcoded colors. Form enters with `fadeRise`.
- [ ] **Step 3:** Typecheck + build. Screenshot `/login` desktop + mobile, light/dark. Log in with seeded credentials and land on `/`.
- [ ] **Step 4:** Commit `feat(web): split-screen auth pages`.

### Task 7: POS register

**Files (modify):** `src/routes/pos.tsx` (markup/classes only). Preserve every hook call, state variable, handler, effect (including the global barcode `keydown` listener and session/warehouse logic) and the user's uncommitted edits in this file — edit around them.

- [ ] **Step 1:** Read the whole file; list each handler/effect and confirm none are modified by the diff at the end (`git diff -U0 src/routes/pos.tsx | grep -E "^[-+].*(use[A-Z]|const handle|onKeyDown|addEventListener)"` should show only moved lines, no changed logic).
- [ ] **Step 2:** Use `<AppShell fullBleed>`; layout `grid h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_400px]`.
- [ ] **Step 3:** Top bar strip: session status badge (success "Session open" / neutral), warehouse select, cashier, open/close session buttons.
- [ ] **Step 4:** Left pane: search/scan input `h-11` with `ScanBarcode` icon + hint "Scan or search products", category chips (horizontal scroll, active = `bg-foreground text-background`), product grid `grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3`; product tile `panel p-3 hover:border-primary/40 hover:shadow-md active:scale-[0.98]` with name (2-line clamp), SKU muted, price `tabular font-semibold`, stock badge (warning when low, destructive-soft when 0, tile disabled at 0 if existing logic disables).
- [ ] **Step 5:** Right pane `border-l bg-surface flex flex-col`: customer selector row; cart list with `AnimatePresence` + `motion.div layout` items (name, unit price, qty stepper `h-8` buttons, line total, remove icon); empty cart illustration-free EmptyState "Cart is empty — scan or tap a product"; totals block (subtotal, discount, tax, total `text-2xl font-semibold tabular`); payment method segmented control; `Charge {total}` button `h-12 w-full text-base`.
- [ ] **Step 6:** Mobile (< lg): cart becomes bottom `Sheet` opened by sticky "View cart (n) · total" bar.
- [ ] **Step 7:** Typecheck + build. Manual: open session, add product by click, add product by typing a SKU + Enter into the window (simulated scanner), change qty, checkout. Screenshots desktop + 390px.
- [ ] **Step 8:** Commit only the presentational hunks: `git add -p src/routes/pos.tsx` excluding the user's pre-existing edits is impractical when interleaved — instead commit the file and note in the commit body that it includes the user's prior uncommitted POS changes, after asking the user. Commit `feat(web): redesign POS register`.

### Task 8: Reports

**Files (modify):** `src/routes/reports.tsx`

- [ ] **Step 1:** Keep `useSalesReport`, `useCustomerReport`, `useInventoryMovementReport`, filter state and `exportReportToCsv` calls verbatim.
- [ ] **Step 2:** Layout: PageHeader (Export CSV outline action); report switcher as `Tabs` with animated underline (`motion.span layoutId="report-tab"`); filter bar in a `panel p-3 flex flex-wrap gap-2` (date range inputs, selects, search) with "Reset" ghost.
- [ ] **Step 3:** Summary row of `StatCard`s; charts in `grid lg:grid-cols-2 gap-6` using chart tokens (`var(--color-chart-1..5)`), consistent card headers (`text-sm font-semibold` + muted subtitle); tables via `DataTable` styling with right-aligned tabular numbers.
- [ ] **Step 4:** Empty/loading/error per section using foundation states.
- [ ] **Step 5:** Typecheck + build; screenshot each tab light/dark. Commit `feat(web): redesign reports workspace`.

### Task 9: Products, Inventory, Customers

**Files (modify):** `src/routes/products.tsx`, `src/routes/inventory.tsx`, `src/routes/customers.tsx`

- [ ] **Step 1:** For each: keep hooks, mutations, dialog open state, form fields and payload mapping verbatim (customers' `taxIdNumber` mapping from upstream commit `d5d4d14` must remain).
- [ ] **Step 2:** Page structure: PageHeader with actions → summary stat strip (4 `StatCard`s from data already computed/loaded on the page; no new queries) → toolbar (search, status filter chips as `ToggleGroup`, view count) → table with avatar/initial cells for names, SKU/codes in `font-mono text-xs text-muted-foreground`, `StatusBadge`, right-aligned tabular amounts, row action `DropdownMenu` (ghost icon button).
- [ ] **Step 3:** Create/edit dialogs: `max-w-2xl`, sectioned form (`grid sm:grid-cols-2 gap-4`, section titles `text-xs font-semibold uppercase tracking-wide text-muted-foreground`), sticky footer with Cancel/Save. Customer 360 dialog: header with avatar + key metrics, tabs for sections.
- [ ] **Step 4:** Inventory: low-stock rows get `bg-warning-soft/30`; quantity column with small inline bar showing on-hand vs reorder level when both fields exist.
- [ ] **Step 5:** Typecheck + build; screenshots each page + one dialog, light/dark, 390px. Create a customer end-to-end to confirm the payload still works.
- [ ] **Step 6:** Commit `feat(web): redesign products, inventory and customers`.

### Task 10: Hardcoded color sweep and final verification

**Files (modify):** any `src/**/*.tsx` still matching the grep below (known: `routes/crm-tags.tsx`, `routes/pipelines.tsx`, `routes/customers.tsx`, `components/dashboard/hero-card.tsx` if retained).

- [ ] **Step 1:** Run `grep -rnE "(slate|purple|violet|gray|zinc)-[0-9]+|#[0-9A-Fa-f]{6}\b|bg-white|text-white" apps/web/src --include=*.tsx | grep -v "ui/chart.tsx"`; replace each with tokens (`text-white` on `bg-primary` → `text-primary-foreground`; tag color pickers that store user-chosen hex values are data and stay).
- [ ] **Step 2:** Re-run grep → only intentional data-color lines remain.
- [ ] **Step 3:** `npx tsc --noEmit` (≤ baseline N) and `npm run build:web` → exit 0.
- [ ] **Step 4:** `git diff --stat main...HEAD -- . ':!apps/web' ':!docs' ':!package-lock.json'` → empty.
- [ ] **Step 5:** Full screenshot pass: `/login`, `/`, `/pos`, `/reports`, `/products`, `/inventory`, `/customers`, `/suppliers`, `/accounting`, `/crm` at 1440 light, 1440 dark, 390 light. Fix any regressions found.
- [ ] **Step 6:** Commit `chore(web): remove hardcoded colors; final redesign polish`.
