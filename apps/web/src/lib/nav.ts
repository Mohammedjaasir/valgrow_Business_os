import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  ShieldCheck,
  KeyRound,
  Settings,
  Bell,
  History,
  Search,
  FolderOpen,
  LifeBuoy,
  UserRound,
  SlidersHorizontal,
  Network,
  UsersRound,
  ScrollText,
  Palette,
  Lock,
  Cpu,
  Component,
  ShoppingCart,
  Boxes,
  Contact,
  Calculator,
  BriefcaseBusiness,
  BarChart3,
  Sparkles,
  Package,
  FolderTree,
  Tag,
  Scale,
  Receipt,
  Warehouse,
  MapPin,
  Barcode,
  ArrowRightLeft,
  Sliders,
  BookmarkCheck,
  ShoppingBag,
  PackageCheck,
  CreditCard,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  soon?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard },
      { title: "Global Search", url: "/search", icon: Search },
      { title: "How it works", url: "/how-it-works", icon: Workflow },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { title: "POS", url: "/pos", icon: ShoppingBag },
      { title: "Products", url: "/products", icon: Package },
      { title: "Inventory", url: "/inventory", icon: Boxes },
      { title: "Purchasing", url: "/purchasing", icon: ShoppingCart },
      { title: "Customers", url: "/customers", icon: Contact },
      { title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { title: "Organization", url: "/organization", icon: Building2 },
    ],
  },
];

export const organizations = [
  { id: "valgrow", name: "ValGrow Holdings", plan: "Enterprise" },
  { id: "northwind", name: "Northwind Retail", plan: "Growth" },
  { id: "helio", name: "Helio Logistics", plan: "Starter" },
];

export const branches = [
  { id: "hq", name: "Head Office", city: "Bengaluru" },
  { id: "north", name: "North Hub", city: "Delhi" },
  { id: "west", name: "West Hub", city: "Mumbai" },
  { id: "south", name: "South Hub", city: "Chennai" },
];

export const notifications = [
  {
    id: "1",
    title: "Role updated",
    body: "The Operations Manager role gained 3 new permissions.",
    time: "2m ago",
    unread: true,
    kind: "info" as const,
  },
  {
    id: "2",
    title: "New member invited",
    body: "An invitation was sent to placeholder@example.com.",
    time: "1h ago",
    unread: true,
    kind: "success" as const,
  },
  {
    id: "3",
    title: "Security review due",
    body: "Quarterly access review for North Hub is pending.",
    time: "Yesterday",
    unread: false,
    kind: "warning" as const,
  },
];

export const primaryNav: { title: string; url: string; soon?: boolean }[] = [
  { title: "Dashboard", url: "/" },
  { title: "POS", url: "/pos" },
  { title: "Organization", url: "/organization" },
  { title: "Products", url: "/products" },
  { title: "Stock", url: "/inventory" },
  { title: "Analytics", url: "/", soon: true },
  { title: "Reports", url: "/", soon: true },
];

export const searchTargets = navGroups
  .filter((g) => g.label !== "Business modules")
  .flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
