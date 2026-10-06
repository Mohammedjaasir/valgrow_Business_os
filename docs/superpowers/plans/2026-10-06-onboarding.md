# New-User Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Welcome dialog, spotlight tour, getting-started checklist, per-page "How this works" panels, and a `/how-it-works` page so new users understand ValGrow.

**Architecture:** One content file (`lib/onboarding-content.ts`) holds all copy; `lib/onboarding.tsx` holds per-user localStorage state and an `OnboardingProvider` context mounted inside `AppShell`. Presentational components live in `components/onboarding/*`. Tour targets are `data-tour` attributes on existing shell elements. Checklist progress reads existing query hooks only.

**Tech Stack:** React 19, TanStack Router/Query, Tailwind v4 tokens, shadcn/ui (Dialog, Sheet, Button, Badge), `motion/react`, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-06-onboarding-design.md`

## Global Constraints

- Frontend only; no backend/hook/payload changes; no new dependencies.
- Storage key `valgrow-onboarding:<userId>`; all storage access in try/catch.
- Onboarding UI renders only after mount and once user id is known (no hydration mismatch, no flash).
- Light/dark tokens only; 390px works; Esc / ←→ keyboard; `prefers-reduced-motion` respected (MotionConfig already global).
- All copy in `src/lib/onboarding-content.ts`.

## Review Focus

1. **Missing tour targets** (collapsed sidebar, mobile drawer closed) — tour must fall back to a centered card, never point at (0,0) or crash.
2. **Storage unavailable / user id not yet loaded** — no welcome flash on every page load, no exception.
3. **Checklist with failing queries** — a failed query must not tick a step or show 100%.
4. **Tour + dialogs focus** — Esc closes only the tour; keyboard handler removed on close; body scroll not left locked.
5. **Viewport edges** — tour card stays fully on-screen for targets near edges and on resize.

## Verification (every task)

- `cd apps/web && npx tsc --noEmit` → exit 0.
- Browser: Playwright scripts in scratchpad against `http://localhost:8080` (login `alex.verma@valgrow.dev` / `DevelopmentPass123!`), clearing `valgrow-onboarding:*` keys to simulate a new user; screenshots light/dark, 1440 and 390.

---

### Task 1: Content, state, provider, tour anchors

**Files:** Create `src/lib/onboarding-content.ts`, `src/lib/onboarding.tsx`. Modify `src/components/layout/app-shell.tsx` (wrap in `OnboardingProvider`, add `data-tour` attrs: `sidebar` on aside, `search` on SearchTrigger, `help` on Help button, `nav-<slug>` on nav links via `data-tour={`nav-${slug(item.title)}`}`; user-menu item "Product tour").

**Produces:**
- `onboarding-content.ts`: `WELCOME`, `TOUR_STEPS: TourStep[]` (`{ id: string; target: string; title: string; what: string; why: string }`), `CHECKLIST_STEPS: ChecklistStepContent[]` (`{ id: ChecklistId; title: string; why: string; to: string; cta: string }`), `PAGE_GUIDES: Record<PageGuideId, PageGuide>` (`{ title; purpose; flow: { label; to }[]; current: number; actions: { icon: LucideIcon; title; text }[] }`), `FLOW_STAGES: FlowStage[]`, `COMPARISON: { old: string; valgrow: string }[]`, `type PageGuideId`.
- `onboarding.tsx`: `OnboardingProvider`, `useOnboarding(): { ready: boolean; state: OnboardingState; markWelcomeSeen(); completeTour(); dismissChecklist(); restoreChecklist(); tourOpen: boolean; startTour(); closeTour(); reset() }`.

- [ ] Write content + state; mount provider; add anchors.
- [ ] tsc; screenshot `/` (no visible change expected).
- [ ] Commit `feat(web): onboarding state, content and tour anchors`.

### Task 2: Welcome dialog

**Files:** Create `src/components/onboarding/welcome-dialog.tsx`; render from `OnboardingProvider` (only on pathname `/`).

- [ ] Dialog (max-w-lg): animated mark, headline, subtitle, 3 benefit tiles (stagger), buttons: Take the tour / Skip, link to `/how-it-works`. Opens when `ready && !state.welcomeSeen` on `/`.
- [ ] Browser: clear key → welcome appears; Skip → reload → does not reappear.
- [ ] Commit `feat(web): first-login welcome dialog`.

### Task 3: Spotlight product tour

**Files:** Create `src/components/onboarding/product-tour.tsx`; render from provider when `tourOpen`.

- [ ] Resolve target `document.querySelector('[data-tour="…"]')`; visible = rect width/height > 0 and within viewport. Spotlight `motion.div` animate {x,y,w,h} with 8px padding; box-shadow cutout overlay; card placement right of target for sidebar items, below for topbar items, clamped to viewport (16px margin); missing/hidden target → centered card (bottom sheet < 640px).
- [ ] Recompute on step change, resize, scroll (rAF throttled). Force sidebar expanded during tour via provider flag consumed by AppShell (`forceExpanded`).
- [ ] Keyboard: Esc skip, ←/→; focus card on step; `aria-live="polite"`; cleanup listeners on close.
- [ ] Browser: walk all steps desktop (screenshot 3 steps), mobile 390 (centered cards), Esc closes and records completion.
- [ ] Commit `feat(web): spotlight product tour`.

### Task 4: Getting-started checklist

**Files:** Create `src/components/onboarding/getting-started.tsx`; add to `routes/index.tsx` under greeting.

- [ ] Detection via `useBranches`, `useWarehouses`, `useProducts({ limit: 1 })`, `useCustomers`, `usePOSSessions()`, `useSalesReport({})`; a step is done only when its query succeeded and condition holds; loading → skeleton rows.
- [ ] UI: progress ring (SVG, animated stroke), "n of 6 done", rows with animated check, next step highlighted with primary CTA; dismiss button → `dismissChecklist()` + toast with Undo (`restoreChecklist`). 6/6 → "You're all set" state.
- [ ] Browser: current dev DB shows correct ticks (branch, warehouse, products, customer, register done; first sale not done).
- [ ] Commit `feat(web): getting-started checklist`.

### Task 5: "How this works" page guides

**Files:** Create `src/components/onboarding/page-guide.tsx`; modify `components/foundation/page-header.tsx` (optional `guide?: PageGuideId` → renders `PageGuideButton` before actions), `components/foundation/list-page.tsx` (pass-through `guide`), and pages: `pos.tsx` (session bar + open screen: button only, via `PageGuideButton` directly — committed without user WIP as before), `products.tsx`, `inventory.tsx`, `purchasing.tsx`, `purchase-orders.tsx`, `goods-receipts.tsx`, `customers.tsx`, `reports.tsx`, `accounting.tsx`.

- [ ] Sheet (right, sm:max-w-md): purpose, "Where it fits" chips with arrows (current highlighted, others link), actions list, footer link.
- [ ] Browser: open guide on 3 pages, light/dark, 390.
- [ ] Commit `feat(web): per-page "How this works" guides`.

### Task 6: How-it-works page and replay entry points

**Files:** Create `src/routes/how-it-works.tsx`; modify `routes/help.tsx` (two cards: Replay tour, How ValGrow works), `lib/nav.ts` (add "How it works" item to first group, icon `Workflow`). `routeTree.gen.ts` regenerates via vite plugin — commit only the added route lines (file has user-unrelated diffs; stage via reconstructed blob if needed).

- [ ] Flow stages row with animated connectors, `layoutId` selection, detail panel, comparison table, CTA row.
- [ ] Browser: click 3 stages, screenshots light/dark/390; Help replay starts tour.
- [ ] Commit `feat(web): how-it-works page and replay entry points`.

### Task 7: Final verification and review

- [ ] tsc + build; scope check (`git diff --stat` outside apps/web/docs empty).
- [ ] End-to-end first-login run: clear storage → welcome → tour all steps → checklist visible → guide panel → how-it-works.
- [ ] Fresh reviewer (opus) whole-branch review against spec + Review Focus; fix Critical/Important.
