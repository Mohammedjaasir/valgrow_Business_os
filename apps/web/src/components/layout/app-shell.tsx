import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Bell,
  Compass,
  Building2,
  Check,
  ChevronsUpDown,
  CircleHelp,
  GitBranch,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationItem } from "@/components/foundation/notification-item";
import { BrandLogo } from "@/components/brand-logo";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CommandPalette } from "@/components/layout/command-palette";
import { useTheme } from "@/components/theme-provider";
import { branches, navGroups, notifications, organizations } from "@/lib/nav";
import { PageTransition } from "@/lib/motion";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding";
import { OnboardingOverlays } from "@/components/onboarding/overlays";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { useOrganizations } from "@/hooks/queries/useOrganizations";
import { useBranches } from "@/hooks/queries/useBranches";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { useLogoutMutation } from "@/hooks/queries/useAuthMutations";
import { setActiveOrgId } from "@/lib/api-client";

const COMPACT_KEY = "valgrow-sidebar-compact";

// Each route renders its own AppShell, so cache the preference across remounts
// to avoid replaying the width transition on every navigation.
let cachedCompact: boolean | null = null;

function readCompact() {
  if (cachedCompact !== null) return cachedCompact;
  try {
    cachedCompact = localStorage.getItem(COMPACT_KEY) === "1";
  } catch {
    cachedCompact = false;
  }
  return cachedCompact;
}

function isActivePath(pathname: string, url: string) {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-8 w-10 shrink-0 items-center justify-center", className)}>
      <BrandLogo className="h-6" />
    </span>
  );
}

function OrgSwitcher({ compact }: { compact: boolean }) {
  const { data: userMe } = useCurrentUser();
  const { data: apiOrgs } = useOrganizations();
  const orgList = apiOrgs && apiOrgs.length > 0 ? apiOrgs : organizations;

  const currentOrg = userMe?.activeOrganization
    ? orgList.find((o) => o.id === userMe.activeOrganization?.id) || userMe.activeOrganization
    : orgList[0]!;

  const handleSelect = (orgId: string) => {
    setActiveOrgId(orgId);
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full min-w-0 items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            compact && "justify-center",
          )}
          aria-label="Switch organization"
        >
          <BrandMark />
          {!compact ? (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-semibold text-foreground">
                  {currentOrg.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  ValGrow Business OS
                </span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {orgList.map((o) => (
          <DropdownMenuItem key={o.id} onClick={() => handleSelect(o.id)} className="gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{o.name}</span>
            <span className="text-xs text-muted-foreground">{o.plan}</span>
            {o.id === currentOrg.id ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/organization">Organization settings</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarNav({
  compact,
  onNavigate,
  layoutGroup,
}: {
  compact: boolean;
  onNavigate?: () => void;
  layoutGroup: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <ScrollArea className="h-full">
      <TooltipProvider delayDuration={0}>
        <nav className={cn("space-y-4 py-3", compact ? "px-2" : "px-3")}>
          {navGroups.map((group, idx) => (
            <div key={group.label || idx} className="space-y-0.5">
              {group.label ? (
                compact ? (
                  <div className="mx-auto my-2 h-px w-5 bg-sidebar-border" />
                ) : (
                  <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                    {group.label}
                  </p>
                )
              ) : null}
              {group.items.map((item) => {
                const active = !item.soon && isActivePath(pathname, item.url);
                const link = (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    aria-label={compact ? item.title : undefined}
                    data-tour={`nav-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className={cn(
                      "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors",
                      compact && "justify-center px-0",
                      active
                        ? "font-medium text-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId={`${layoutGroup}-nav-active`}
                        className="absolute inset-0 rounded-md bg-sidebar-accent"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      >
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                      </motion.span>
                    ) : null}
                    <item.icon
                      className={cn(
                        "relative h-4 w-4 shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {!compact ? <span className="relative truncate">{item.title}</span> : null}
                    {!compact && item.soon ? (
                      <Badge variant="neutral" className="relative ml-auto px-1.5 py-0 text-[10px]">
                        Soon
                      </Badge>
                    ) : null}
                  </Link>
                );

                if (!compact) return link;
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </nav>
      </TooltipProvider>
    </ScrollArea>
  );
}

function BranchSwitcher() {
  const { data: apiBranches } = useBranches();
  const branchList = apiBranches && apiBranches.length > 0 ? apiBranches : branches;
  const [selected, setSelected] = useState(branchList[0]!.id);
  const current = branchList.find((b) => b.id === selected) || branchList[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden max-w-[180px] gap-1.5 md:inline-flex">
          <GitBranch className="text-muted-foreground" />
          <span className="truncate text-foreground">{current.name}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Branches
        </DropdownMenuLabel>
        {branchList.map((b) => (
          <DropdownMenuItem key={b.id} onClick={() => setSelected(b.id)} className="gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{b.name}</span>
            <span className="text-xs text-muted-foreground">{b.city}</span>
            {b.id === current.id ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/branches">Manage branches</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell() {
  const { data: apiNotifications } = useNotifications();
  const list =
    apiNotifications && apiNotifications.length > 0
      ? apiNotifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          time: new Date(n.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          unread: n.unread,
          kind: (n.kind.toLowerCase() === "error" ? "warning" : n.kind.toLowerCase()) as
            | "info"
            | "success"
            | "warning",
        }))
      : notifications;

  const unread = list.filter((n) => n.unread).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {unread > 0 ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 ? <Badge variant="brand">{unread} new</Badge> : null}
        </div>
        <div className="max-h-80 space-y-0.5 overflow-y-auto p-1.5">
          {list.map((n) => (
            <NotificationItem key={n.id} {...n} />
          ))}
        </div>
        <div className="border-t p-1.5">
          <Button asChild variant="ghost" size="sm" className="w-full text-foreground">
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ThemeSwitcher() {
  const { resolved, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      <motion.span
        key={resolved}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex"
      >
        {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </motion.span>
    </Button>
  );
}

function UserMenu() {
  const { data: userMe } = useCurrentUser();
  const { startTour } = useOnboarding();
  const logoutMutation = useLogoutMutation();

  const fullName =
    [userMe?.user?.firstName, userMe?.user?.lastName].filter(Boolean).join(" ") || "Account";
  const initials =
    [userMe?.user?.firstName, userMe?.user?.lastName]
      .filter(Boolean)
      .map((n) => n![0]!.toUpperCase())
      .join("") || "?";
  const roleName = userMe?.role?.name ?? "Member";

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-full p-0.5 pr-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:rounded-md md:pr-2"
          aria-label="Account menu"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
            {initials}
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-[13px] font-medium text-foreground">{fullName}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">{fullName}</p>
          <p className="text-xs text-muted-foreground">{roleName}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserRound /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/preferences">
            <Settings /> Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={startTour} className="cursor-pointer">
          <Compass /> Product tour
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        data-tour="search"
        className="hidden h-8 w-64 items-center gap-2 rounded-md border border-input bg-surface px-2.5 text-[13px] text-muted-foreground shadow-xs transition-colors hover:border-foreground/20 hover:text-foreground md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border bg-surface-2 px-1.5 py-px font-sans text-[10px] font-medium">
          Ctrl K
        </kbd>
      </button>
      <Button variant="ghost" size="icon" onClick={onOpen} className="md:hidden" aria-label="Search">
        <Search />
      </Button>
    </>
  );
}

type AppShellProps = {
  children: ReactNode;
  rightPanel?: ReactNode;
  fullBleed?: boolean;
};

export function AppShell(props: AppShellProps) {
  return (
    <OnboardingProvider overlays={<OnboardingOverlays />}>
      <AppShellInner {...props} />
    </OnboardingProvider>
  );
}

function AppShellInner({ children, rightPanel, fullBleed = false }: AppShellProps) {
  const { tourOpen } = useOnboarding();
  const [compactPref, setCompact] = useState(() => cachedCompact ?? false);
  // The tour points at labelled menu items, so show the full sidebar while it runs.
  const compact = compactPref && !tourOpen;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCompact(readCompact());
  }, []);

  const toggleCompact = () => {
    setCompact((c) => {
      const next = !c;
      cachedCompact = next;
      try {
        localStorage.setItem(COMPACT_KEY, next ? "1" : "0");
      } catch {
        // storage unavailable — keep in-memory state only
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside
        data-tour="sidebar"
        className={cn(
          "hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out lg:flex",
          compact ? "w-[60px]" : "w-[248px]",
        )}
      >
        <div className={cn("flex h-14 shrink-0 items-center", compact ? "px-2" : "px-3")}>
          <OrgSwitcher compact={compact} />
        </div>
        <div className="min-h-0 flex-1">
          <SidebarNav compact={compact} layoutGroup="desktop" />
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center gap-1 border-t border-sidebar-border p-2",
            compact ? "flex-col" : "justify-between",
          )}
        >
          <Button
            asChild
            variant="ghost"
            size={compact ? "icon" : "sm"}
            className={cn(!compact && "flex-1 justify-start")}
          >
            <Link to="/help" aria-label="Help and support" data-tour="help">
              <CircleHelp />
              {!compact ? "Help & support" : null}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCompact}
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
          >
            {compact ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col gap-0 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-14 shrink-0 items-center px-3">
                  <OrgSwitcher compact={false} />
                </div>
                <div className="min-h-0 flex-1">
                  <SidebarNav
                    compact={false}
                    layoutGroup="mobile"
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <Breadcrumbs />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <SearchTrigger onOpen={() => setPaletteOpen(true)} />
            <div className="mx-1 hidden h-5 w-px bg-border md:block" />
            <BranchSwitcher />
            <ThemeSwitcher />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          {fullBleed ? (
            <PageTransition>{children}</PageTransition>
          ) : (
            <div
              className={cn(
                "mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
                rightPanel && "grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]",
              )}
            >
              <PageTransition>{children}</PageTransition>
              {rightPanel ? <div className="space-y-4">{rightPanel}</div> : null}
            </div>
          )}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
