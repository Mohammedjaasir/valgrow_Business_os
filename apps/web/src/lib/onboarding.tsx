import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";

export type OnboardingState = {
  welcomeSeen: boolean;
  tourCompleted: boolean;
  checklistDismissed: boolean;
};

const DEFAULT_STATE: OnboardingState = {
  welcomeSeen: false,
  tourCompleted: false,
  checklistDismissed: false,
};

const storageKey = (userId: string) => `valgrow-onboarding:${userId}`;

// Per-user state kept in memory too, so it survives AppShell remounts even when
// localStorage is unavailable (private mode, blocked storage).
const memoryCache = new Map<string, OnboardingState>();

function load(userId: string): OnboardingState {
  const cached = memoryCache.get(userId);
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<OnboardingState>) };
  } catch {
    return DEFAULT_STATE;
  }
}

function save(userId: string, state: OnboardingState) {
  memoryCache.set(userId, state);
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota) — keep in-memory state for this session.
  }
}

// The tour survives AppShell remounts (each route renders its own shell).
let tourOpenAcrossRoutes = false;

type OnboardingApi = {
  /** True once the signed-in user is known and their saved state is loaded. */
  ready: boolean;
  state: OnboardingState;
  tourOpen: boolean;
  markWelcomeSeen: () => void;
  startTour: () => void;
  closeTour: (completed?: boolean) => void;
  dismissChecklist: () => void;
  restoreChecklist: () => void;
  reset: () => void;
};

const noop = () => {};

const FALLBACK: OnboardingApi = {
  ready: false,
  state: DEFAULT_STATE,
  tourOpen: false,
  markWelcomeSeen: noop,
  startTour: noop,
  closeTour: noop,
  dismissChecklist: noop,
  restoreChecklist: noop,
  reset: noop,
};

const OnboardingContext = createContext<OnboardingApi>(FALLBACK);

export function OnboardingProvider({
  children,
  overlays,
}: {
  children: ReactNode;
  /** Rendered after children; receives nothing — reads context itself. */
  overlays?: ReactNode;
}) {
  const { data: me } = useCurrentUser();
  const userId = me?.user?.id;
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [tourOpen, setTourOpenState] = useState(() => tourOpenAcrossRoutes);

  useEffect(() => {
    if (!userId) return;
    setState(load(userId));
    setReady(true);
  }, [userId]);

  const update = useCallback(
    (patch: Partial<OnboardingState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        if (userId) save(userId, next);
        return next;
      });
    },
    [userId],
  );

  const setTourOpen = useCallback((open: boolean) => {
    tourOpenAcrossRoutes = open;
    setTourOpenState(open);
  }, []);

  const api = useMemo<OnboardingApi>(
    () => ({
      ready,
      state,
      tourOpen,
      markWelcomeSeen: () => update({ welcomeSeen: true }),
      startTour: () => {
        update({ welcomeSeen: true });
        setTourOpen(true);
      },
      closeTour: (completed = true) => {
        setTourOpen(false);
        if (completed) update({ tourCompleted: true });
      },
      dismissChecklist: () => update({ checklistDismissed: true }),
      restoreChecklist: () => update({ checklistDismissed: false }),
      reset: () => update(DEFAULT_STATE),
    }),
    [ready, state, tourOpen, update, setTourOpen],
  );

  return (
    <OnboardingContext.Provider value={api}>
      {children}
      {overlays}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
