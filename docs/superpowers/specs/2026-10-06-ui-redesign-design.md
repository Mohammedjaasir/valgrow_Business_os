# ValGrow Business OS — UI Redesign (Refined Enterprise)

Date: 2026-10-06
Status: Draft for review

## Goal

Redesign the web frontend (`apps/web`) to a professional, premium "refined enterprise" standard (Linear/Stripe class) with tasteful motion, without changing any backend code or frontend behavior.

## Constraints

- **No backend changes.** Nothing under `apps/api`, `prisma/`, or root config is modified.
- **No behavior changes.** Routes, data hooks (`src/hooks/queries/*`), `src/lib/api-client.ts`, form payloads, validation, and business logic stay as-is. Only markup structure, styling, and motion change.
- Only new dependency: `motion` in `apps/web/package.json`.
- Light and dark themes both supported (existing `ThemeProvider` / `valgrow-theme` storage kept).
- Responsive down to 360px; no horizontal page scroll.
- All motion respects `prefers-reduced-motion`.

## Success criteria

1. `npm run typecheck` and `npm run build:web` pass.
2. All 78 routes render with the new design (via shared system); no runtime errors on the flagship pages.
3. Flagship pages (Overview, POS, Reports, Products, Inventory, Customers, Login) are hand-redesigned.
4. Before/after screenshots of flagship pages in light + dark reviewed.
5. Existing flows still work: login, POS sale incl. barcode scanning, create customer, list filtering/pagination.

## 1. Design tokens & typography (`src/styles.css`)

- **Neutrals:** zinc scale. Light: background `oklch(0.985 0 0)`, surface/card white, borders `oklch(0.92 0.004 286)`. Dark: graphite background `oklch(0.145 0.005 286)`, card `oklch(0.18 0.006 286)`, borders `oklch(0.27 0.006 286)`.
- **Accent:** indigo primary `oklch(0.51 0.23 277)` (dark: `oklch(0.62 0.2 277)`). Used only for primary actions, focus rings, active nav, selected states, links.
- **Status:** success `oklch(0.6 0.15 155)`, warning `oklch(0.72 0.15 70)`, destructive `oklch(0.58 0.22 25)`, info `oklch(0.6 0.15 245)`, each with a subtle tinted background variant (`--success-soft` etc.) for badges.
- **Charts:** 5-step indigo-led categorical palette validated for both themes.
- **Type:** Inter (UI) + Inter Display weights for headings via Google Fonts; `font-feature-settings: "cv11","ss01"`; `tabular-nums` utility applied to tables, amounts, KPIs. Scale: 12/13/14/16/20/24/30.
- **Shape:** `--radius: 0.5rem`; 1px borders; shadows: `--shadow-xs` (inputs/cards), `--shadow-md` (popovers), `--shadow-lg` (dialogs) — soft, layered, neutral.
- Existing token names (`--brand`, `--surface`, `--surface-2`, `--success`, etc.) are kept so current class usage continues to work; values change.

## 2. App shell (`src/components/layout/*`)

- **Sidebar:** 248px, collapsible to 60px icon rail (state persisted in localStorage). Workspace switcher header (logo mark + org name). Grouped nav from `src/lib/nav.ts` (data unchanged) with small uppercase group labels. Active item: indigo text + soft indigo background with a `motion` `layoutId` indicator that slides between items. "Soon" items shown with a muted badge. Footer: help + user card.
- **Topbar:** 56px, sticky, translucent with backdrop blur. Breadcrumbs left; ⌘K search trigger (opens existing command palette), theme toggle, notifications, user menu right.
- **Mobile (<1024px):** sidebar becomes a `Sheet` drawer opened by a menu button.
- **Content area:** max width 1440px, 24px/32px gutters (16px on mobile).
- **Auth layout:** split screen — left brand panel (indigo gradient mesh, product value statements), right form card. Single column on mobile.

## 3. Shared components

- **shadcn primitives (`src/components/ui/*`):** restyle button (sizes, indigo primary, subtle secondary/outline/ghost, press scale), input/select/textarea (36px height, focus ring), badge (soft status variants), card, table, tabs (animated underline), dialog/sheet/popover/dropdown (motion entrance), tooltip, skeleton (shimmer), sonner toasts.
- **`foundation/page-header.tsx`:** title (24px semibold), description, actions slot, optional tabs row.
- **`foundation/list-page.tsx`:** toolbar (search, filter chips, view actions), card-wrapped table with sticky header, compact rows (44px), hover state, right-aligned numeric columns, status badges, pagination footer. Staggered row entrance on first load.
- **`foundation/data-table.tsx`:** same visual language as list-page table.
- **`foundation/stat-card.tsx`:** label, large tabular value with count-up, delta chip (up/down tinted), optional sparkline.
- **`foundation/states.tsx`:** empty (icon in tinted circle, title, description, action), loading (skeleton rows matching layout), error (inline alert with retry).
- **404 / error components in `__root.tsx`:** restyled to match.

## 4. Flagship pages

Data, hooks, handlers, and payloads stay; layout/markup/styling are rebuilt.

- **Overview (`routes/index.tsx`, `components/dashboard/*`):** greeting header with date + quick actions; KPI row (4 stat cards with sparklines, count-up); revenue/sales area chart (recharts, new palette); recent orders table; activity feed; low-stock / alerts panel. Illustrations replaced by clean data-first panels.
- **POS (`routes/pos.tsx`):** full-height two-pane register. Left: search/scan bar (barcode scanner logic untouched), category chips, responsive product grid with clear price + stock. Right: cart panel with line items (qty steppers), customer selector, totals block, large primary "Charge" button. Session/warehouse controls in a compact header. Touch targets ≥44px. Cart items animate in/out.
- **Reports (`routes/reports.tsx`):** report category nav, filter bar, chart cards in a consistent grid, export actions grouped.
- **Products, Inventory, Customers:** list-page treatment plus page-specific summary stat strip and refined create/edit dialogs/sheets.
- **Login (`routes/login.tsx`, forgot/reset password):** new auth layout.

## 5. Motion (`motion` + CSS)

- Shared helpers in `src/lib/motion.ts`: `fadeRise` (opacity 0→1, y 8→0, 200ms, ease-out), `stagger(0.03)`, spring preset for overlays (`stiffness 400, damping 30`).
- Route content: `fadeRise` on mount, keyed by pathname.
- Lists/cards: staggered entrance, first render only (no re-animation on refetch).
- KPI numbers: count-up over 600ms.
- Sidebar active indicator and tab underline: shared `layoutId` slide.
- Dialogs/sheets/popovers: scale 0.97→1 + fade.
- Buttons: `active:scale-[0.98]`; hover transitions 150ms in CSS.
- Global `MotionConfig reducedMotion="user"`; CSS motion wrapped in `@media (prefers-reduced-motion: no-preference)`.

## 6. Verification

- Typecheck + production build of `apps/web`.
- Drive the running app in a browser: screenshot flagship pages in light and dark at desktop (1440) and mobile (390) widths; click through login, POS add-to-cart, customer create dialog, list pagination.
- `git diff --stat` confirms no files outside `apps/web` changed (besides this spec and lockfile).

## Out of scope

- Hand-redesign of the remaining ~70 non-flagship routes (they inherit the system styling only).
- New features, new data, API changes, copy rewrites beyond labels needed by new layouts.
