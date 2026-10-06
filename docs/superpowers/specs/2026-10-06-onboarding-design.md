# ValGrow Business OS — New-User Onboarding

Date: 2026-10-06
Status: Draft for review
Builds on: `2026-10-06-ui-redesign-design.md` (tokens, motion helpers, shell)

## Goal

When a new user signs in, they should quickly understand **what ValGrow is, why it beats juggling separate tools, and what each part of the app is for** — by clicking through it themselves, in plain business language for owners/managers.

## Constraints

- Frontend only (`apps/web`). No backend, API, hook, or payload changes. No new dependencies (uses existing `motion`, shadcn/ui, lucide, Tailwind tokens).
- Existing hooks may be *read* (e.g. `useBranches`, `useProducts`) to detect checklist progress; no new endpoints.
- "New user" and onboarding progress are stored in `localStorage`, keyed by user id (`valgrow-onboarding:<userId>`), wrapped in try/catch; when storage is unavailable, onboarding simply behaves as "not seen" for the session and never crashes.
- Everything is skippable and replayable (Help page + user menu).
- Works in light/dark, at 390px width, keyboard-accessible (Esc closes, ←/→ step, focus moved into dialogs/cards), and respects `prefers-reduced-motion`.
- All copy lives in one file: `src/lib/onboarding-content.ts`.

## Success criteria

1. A user with no onboarding record sees the Welcome dialog once after landing on `/`; choosing either option records it and it never auto-shows again for that user.
2. The tour walks all steps, spotlighting the correct element on desktop; on mobile it shows bottom-sheet cards without a spotlight on hidden elements; Back/Next/Skip/Esc/arrow keys work; finishing or skipping records it.
3. The checklist on Overview reflects real data (ticks appear when records exist), shows % complete, links to the right pages, can be dismissed, and celebrates at 100%.
4. Nine main pages show a "How this works" button that opens a side panel with purpose, flow diagram, and key actions.
5. `/how-it-works` renders the clickable animated flow and the "old way vs ValGrow" comparison.
6. `tsc --noEmit` and `vite build` pass; no hydration warnings (all onboarding UI renders after mount).

## 1. Onboarding state — `src/lib/onboarding.ts`

```ts
type OnboardingState = {
  welcomeSeen: boolean;
  tourCompleted: boolean;
  checklistDismissed: boolean;
};
```
- `useOnboarding()` hook: reads user id from `useCurrentUser()`, loads/saves state from localStorage, exposes `state`, `markWelcomeSeen()`, `completeTour()`, `dismissChecklist()`, `startTour()`, `reset()`, plus `tourOpen` / `setTourOpen` shared through a small React context (`OnboardingProvider`) mounted inside `AppShell`.
- Until the user id is known and the component has mounted, state is "unknown" and nothing auto-opens (prevents flashes and hydration mismatch).

## 2. Welcome dialog — `components/onboarding/welcome-dialog.tsx`

- Auto-opens on `/` when `welcomeSeen === false`.
- Content: animated brand mark, headline "Your whole business, one place.", one-line subtitle, three benefit tiles (Everything connected — sales update stock automatically; One login instead of five tools; Live numbers — know today's sales and stock at a glance).
- Actions: primary **Take the 2-minute tour** (marks seen, starts tour), secondary **Skip, I'll explore** (marks seen), tertiary link **See how ValGrow works** → `/how-it-works`.

## 3. Guided tour — `components/onboarding/product-tour.tsx`

- Steps defined in content file: `{ id, target, title, what, why, placement }`. `target` is a `data-tour="<id>"` attribute added to existing shell elements (no behavior change).
- Steps (desktop): `sidebar`, `nav-overview`, `search`, `nav-pos`, `nav-products` (Products & Inventory), `nav-purchasing`, `nav-customers`, `nav-reports`, `help`.
- Rendering: full-screen overlay; spotlight = absolutely positioned rounded rect with `box-shadow: 0 0 0 9999px rgb(0 0 0 / .55)` animated (motion `layout`) between targets; card positioned beside target (flip to stay in viewport), shows step n/N, title, "What it is", "Why it matters", progress dots, Back / Next (Finish on last) / Skip.
- Recomputes position on resize/scroll. If a target is missing or hidden (e.g. sidebar collapsed or < lg), card renders centered/bottom-sheet with no spotlight.
- Expands the sidebar for the duration of the tour if collapsed (restores after).
- Keyboard: Esc = skip, ←/→ = back/next; focus moves to the card; `aria-live` announces step.

## 4. Getting-started checklist — `components/onboarding/getting-started.tsx`

- Shown at top of Overview below the greeting while not dismissed and not 100% for > 1 visit.
- Steps with detection (existing hooks, read-only):
  1. Add a branch — `useBranches()` length > 0 → `/branches`
  2. Add a warehouse — `useWarehouses()` length > 0 → `/warehouses`
  3. Add your products — `useProducts({ limit: 1 })` `meta.total` > 0 → `/products`
  4. Add a customer — `useCustomers()` length > 0 → `/customers`
  5. Open the register — `usePOSSessions()` any session → `/pos`
  6. Make your first sale — `useSalesReport({})` `summary.orderCount > 0` → `/pos`
- UI: progress ring + "n of 6 done", collapsible list; each row: check state (animated tick), title, one-line why, "Start"/"View" button. Next incomplete step highlighted. Dismiss (×) with confirm-free undo toast. At 6/6: celebration state ("You're all set") with confetti-free subtle burst animation, then auto-collapses.

## 5. "How this works" panel — `components/onboarding/page-guide.tsx`

- `PageGuideButton` (`variant="ghost" size="sm"`, `CircleHelp` icon, label "How this works") placed in the PageHeader actions of: POS, Products, Inventory, Purchasing, Purchase Orders, Goods Receipts, Customers, Reports, Accounting. Implemented by an optional `guide?: PageGuideId` prop on `PageHeader` and `ListPage` (falls through to PageHeader).
- Opens a right `Sheet` with: title + purpose paragraph; "Where it fits" horizontal flow (3–5 chips with arrows, current page highlighted, chips link to their pages); "What you can do here" (3–4 actions with icons); footer link to `/how-it-works`.

## 6. "How ValGrow works" page — `routes/how-it-works.tsx`

- PageHeader: "How ValGrow works" + subtitle.
- Flow: six stage cards in a row (wraps to grid on mobile) connected by animated dashed connectors: Buy → Receive → Stock → Sell → Get paid → Understand. Each stage: icon, name, one-liner. Clicking a stage selects it (animated highlight with `layoutId`) and reveals a detail panel: what happens, the modules involved (linked), and "what ValGrow does automatically" (e.g. "Selling at POS lowers stock and posts to your ledger").
- "Old way vs ValGrow" comparison: two columns (spreadsheets + separate apps vs one connected system) with 5 rows.
- CTA row: Replay the tour / Go to Overview.
- Added to Help page as a prominent card and to command palette via nav search targets (no nav-group change needed beyond adding an item under the first group: "How it works").

## 7. Entry points for replay

- Help page: "Replay product tour" and "How ValGrow works" cards.
- User menu: "Product tour" item.

## Out of scope

- Role-specific tours, server-side persistence of onboarding state, analytics, localization.
