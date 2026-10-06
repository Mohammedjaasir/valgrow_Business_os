/**
 * All onboarding copy lives here so it can be edited without touching components.
 * Written for business owners and managers — plain language, outcome first.
 */
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  FileText,
  IndianRupee,
  Layers,
  PackagePlus,
  PackageSearch,
  ReceiptText,
  RefreshCcw,
  ScanBarcode,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// ─── Welcome ────────────────────────────────────────────────────────────────

export const WELCOME = {
  eyebrow: "Welcome to ValGrow",
  title: "Your whole business, one place.",
  subtitle:
    "Sales, stock, purchasing, customers and accounts — connected, so you stop copying numbers between tools.",
  benefits: [
    {
      icon: RefreshCcw,
      title: "Everything stays in sync",
      text: "Sell an item and your stock, customer history and accounts update on their own.",
    },
    {
      icon: Layers,
      title: "One login, not five tools",
      text: "No more spreadsheets for stock, a separate till and another app for invoices.",
    },
    {
      icon: BarChart3,
      title: "Live numbers, any time",
      text: "See today's sales, low stock and money owed the moment you open the app.",
    },
  ],
  primary: "Take the 2-minute tour",
  secondary: "Skip, I'll explore",
  link: "See how ValGrow works",
} as const;

// ─── Tour ───────────────────────────────────────────────────────────────────

export type TourStep = {
  id: string;
  /** Matches a `data-tour` attribute in the app shell. */
  target: string;
  title: string;
  what: string;
  why: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "sidebar",
    target: "sidebar",
    title: "Your control panel",
    what: "Every part of your business lives in this menu, grouped by what you do every day.",
    why: "You never need another app — sales, stock, buying and reports are all one click away.",
  },
  {
    id: "overview",
    target: "nav-overview",
    title: "Overview",
    what: "Your daily snapshot: today's sales, orders, customers and anything that needs attention.",
    why: "Start your day here to know how the business is doing in ten seconds.",
  },
  {
    id: "search",
    target: "search",
    title: "Find anything fast",
    what: "Search every page and action from one box. Press Ctrl + K from anywhere.",
    why: "Saves hunting through menus — type what you want and go straight there.",
  },
  {
    id: "pos",
    target: "nav-pos",
    title: "POS — your shop counter",
    what: "Ring up sales by tapping products or scanning barcodes, then take cash, card or UPI.",
    why: "Every sale instantly lowers stock and records the money — no end-of-day re-typing.",
  },
  {
    id: "products",
    target: "nav-products",
    title: "Products & stock",
    what: "Your catalog of items with prices, plus live stock levels for every warehouse.",
    why: "Know exactly what you have and where it is, so you never sell what you don't have.",
  },
  {
    id: "purchasing",
    target: "nav-purchasing",
    title: "Purchasing",
    what: "Order from suppliers and record deliveries when goods arrive.",
    why: "Received goods are added to stock automatically, and you can see what's still on order.",
  },
  {
    id: "customers",
    target: "nav-customers",
    title: "Customers",
    what: "Everyone you sell to, with contact details, credit limits and purchase history.",
    why: "Know your best customers and who owes you money — at a glance.",
  },
  {
    id: "reports",
    target: "nav-reports",
    title: "Reports",
    what: "Sales, customer and stock-movement reports you can filter and export to Excel.",
    why: "Make decisions with real numbers — what sells, who buys, and where stock goes.",
  },
  {
    id: "help",
    target: "help",
    title: "Help is always here",
    what: "Replay this tour or open the visual guide to how everything connects.",
    why: "You can come back any time — nothing you skip today is lost.",
  },
];

// ─── Getting-started checklist ──────────────────────────────────────────────

export type ChecklistId = "branch" | "warehouse" | "products" | "customer" | "register" | "sale";

export type ChecklistStepContent = {
  id: ChecklistId;
  title: string;
  why: string;
  to: string;
  cta: string;
  icon: LucideIcon;
};

export const CHECKLIST_STEPS: ChecklistStepContent[] = [
  {
    id: "branch",
    title: "Add your branch",
    why: "Your shop or office location — sales and stock are tracked per branch.",
    to: "/branches",
    cta: "Add branch",
    icon: ClipboardCheck,
  },
  {
    id: "warehouse",
    title: "Add a warehouse",
    why: "Where your stock physically sits, so quantities are always accurate.",
    to: "/warehouses",
    cta: "Add warehouse",
    icon: Boxes,
  },
  {
    id: "products",
    title: "Add your products",
    why: "The items you sell, with prices — they appear at the POS automatically.",
    to: "/products",
    cta: "Add products",
    icon: PackagePlus,
  },
  {
    id: "customer",
    title: "Add a customer",
    why: "Track who buys from you, their history and any money they owe.",
    to: "/customers",
    cta: "Add customer",
    icon: UserPlus,
  },
  {
    id: "register",
    title: "Open the register",
    why: "Start a POS session with your opening cash to begin selling.",
    to: "/pos",
    cta: "Open POS",
    icon: ScanBarcode,
  },
  {
    id: "sale",
    title: "Make your first sale",
    why: "Watch stock, sales and reports update by themselves — that's the magic.",
    to: "/pos",
    cta: "Go to POS",
    icon: IndianRupee,
  },
];

// ─── Per-page guides ────────────────────────────────────────────────────────

export type PageGuideId =
  | "pos"
  | "products"
  | "inventory"
  | "purchasing"
  | "purchase-orders"
  | "goods-receipts"
  | "customers"
  | "reports"
  | "accounting";

export type PageGuide = {
  title: string;
  purpose: string;
  flow: { label: string; to: string }[];
  /** Index in `flow` of the current page. */
  current: number;
  actions: { icon: LucideIcon; title: string; text: string }[];
};

const BUY_TO_SELL = [
  { label: "Purchase order", to: "/purchase-orders" },
  { label: "Goods receipt", to: "/goods-receipts" },
  { label: "Stock", to: "/inventory" },
  { label: "POS sale", to: "/pos" },
  { label: "Reports", to: "/reports" },
];

export const PAGE_GUIDES: Record<PageGuideId, PageGuide> = {
  pos: {
    title: "POS — the shop counter",
    purpose:
      "Sell to walk-in or saved customers. Each sale lowers stock in the register's warehouse and records the payment, so your numbers are always current.",
    flow: BUY_TO_SELL,
    current: 3,
    actions: [
      { icon: ScanBarcode, title: "Scan or tap to sell", text: "Use a USB barcode scanner or tap product tiles." },
      { icon: Wallet, title: "Split payments", text: "Take cash, card, UPI or bank transfer in one sale." },
      { icon: ReceiptText, title: "Print receipts", text: "Download a PDF receipt after every sale." },
    ],
  },
  products: {
    title: "Products — your catalog",
    purpose:
      "Everything you sell, with SKU, category, brand and prices. Products you add here appear at the POS and in purchase orders automatically.",
    flow: [
      { label: "Products", to: "/products" },
      { label: "Purchase order", to: "/purchase-orders" },
      { label: "Stock", to: "/inventory" },
      { label: "POS sale", to: "/pos" },
    ],
    current: 0,
    actions: [
      { icon: PackagePlus, title: "Add products", text: "Name, SKU, prices and category in one form." },
      { icon: Layers, title: "Organize", text: "Group items by category and brand for faster search." },
      { icon: PackageSearch, title: "Check stock", text: "Switch to Live stock levels to see quantities." },
    ],
  },
  inventory: {
    title: "Inventory — live stock levels",
    purpose:
      "How much of each product you have, where it is, and how much is reserved for orders. Quantities change automatically as you buy and sell.",
    flow: BUY_TO_SELL,
    current: 2,
    actions: [
      { icon: Boxes, title: "See what's available", text: "On hand minus reserved = what you can sell." },
      { icon: ClipboardCheck, title: "Adjust stock", text: "Correct counts after a stock-take or damage." },
      { icon: Truck, title: "Know where it is", text: "Stock is tracked per warehouse and location." },
    ],
  },
  purchasing: {
    title: "Purchasing — buying from suppliers",
    purpose:
      "Plan and track what you buy. Raise purchase orders, record deliveries, and keep supplier bills and payments together.",
    flow: BUY_TO_SELL,
    current: 0,
    actions: [
      { icon: ShoppingCart, title: "Order stock", text: "Create purchase orders for your suppliers." },
      { icon: Truck, title: "Receive deliveries", text: "Record what arrived — stock goes up automatically." },
      { icon: FileText, title: "Track bills", text: "Match supplier invoices and payments to orders." },
    ],
  },
  "purchase-orders": {
    title: "Purchase orders",
    purpose:
      "A purchase order tells a supplier what you want and at what price. It's your record of what's on the way.",
    flow: BUY_TO_SELL,
    current: 0,
    actions: [
      { icon: ShoppingCart, title: "Create an order", text: "Pick a supplier, add products and quantities." },
      { icon: ClipboardCheck, title: "Approve & send", text: "Move orders from draft to approved." },
      { icon: Truck, title: "Receive against it", text: "When goods arrive, record a goods receipt." },
    ],
  },
  "goods-receipts": {
    title: "Goods receipts",
    purpose:
      "When a delivery arrives, record what you actually received. This is the moment your stock goes up.",
    flow: BUY_TO_SELL,
    current: 1,
    actions: [
      { icon: Truck, title: "Record a delivery", text: "Choose the purchase order and enter quantities." },
      { icon: Boxes, title: "Stock updates", text: "Received quantities are added to the warehouse." },
      { icon: ClipboardCheck, title: "Handle differences", text: "Receive part of an order and the rest later." },
    ],
  },
  customers: {
    title: "Customers",
    purpose:
      "Everyone you sell to. Their details, credit limit and purchase history live here and are used by the POS, quotations and invoices.",
    flow: [
      { label: "Customer", to: "/customers" },
      { label: "POS / invoice", to: "/pos" },
      { label: "Payment", to: "/customer-payments" },
      { label: "Reports", to: "/reports" },
    ],
    current: 0,
    actions: [
      { icon: UserPlus, title: "Add customers", text: "Code, contact details, tax ID and terms." },
      { icon: Users, title: "Customer 360", text: "Open a customer to see history and balance." },
      { icon: Wallet, title: "Credit control", text: "Set credit limits and payment terms." },
    ],
  },
  reports: {
    title: "Reports",
    purpose:
      "Turn everyday activity into answers: what sells, who buys, how stock moves. Filter by date, branch or customer and export to Excel.",
    flow: BUY_TO_SELL,
    current: 4,
    actions: [
      { icon: BarChart3, title: "Sales report", text: "Revenue, orders, tax and top products." },
      { icon: Users, title: "Customer report", text: "Who buys most and who owes money." },
      { icon: Boxes, title: "Stock movements", text: "Every item in and out, with a full audit trail." },
    ],
  },
  accounting: {
    title: "Accounting",
    purpose:
      "Your books, kept up to date automatically. Sales, purchases and payments post to the ledger, so profit, tax and balances are always ready.",
    flow: [
      { label: "Sales & purchases", to: "/reports" },
      { label: "Journal entries", to: "/journal-entries" },
      { label: "Ledger", to: "/accounts" },
      { label: "Financial reports", to: "/financial-reports" },
    ],
    current: 2,
    actions: [
      { icon: FileText, title: "Chart of accounts", text: "Your accounts, already set up for you." },
      { icon: ReceiptText, title: "Automatic postings", text: "No manual entries for everyday sales." },
      { icon: BarChart3, title: "Profit & tax", text: "Profit & loss, balance sheet and tax reports." },
    ],
  },
};

// ─── How ValGrow works ──────────────────────────────────────────────────────

export type FlowStage = {
  id: string;
  name: string;
  icon: LucideIcon;
  short: string;
  detail: string;
  automatic: string;
  modules: { label: string; to: string }[];
};

export const FLOW_STAGES: FlowStage[] = [
  {
    id: "buy",
    name: "Buy",
    icon: ShoppingCart,
    short: "Order from suppliers",
    detail: "Raise a purchase order listing what you need, from which supplier, at what price.",
    automatic: "ValGrow remembers supplier prices and shows what is already on order.",
    modules: [
      { label: "Suppliers", to: "/suppliers" },
      { label: "Purchase orders", to: "/purchase-orders" },
    ],
  },
  {
    id: "receive",
    name: "Receive",
    icon: Truck,
    short: "Record deliveries",
    detail: "When goods arrive, record a goods receipt against the purchase order.",
    automatic: "Stock goes up in the right warehouse the moment you save the receipt.",
    modules: [{ label: "Goods receipts", to: "/goods-receipts" }],
  },
  {
    id: "stock",
    name: "Stock",
    icon: Boxes,
    short: "Always know what you have",
    detail: "See on-hand, reserved and available quantities for every product and warehouse.",
    automatic: "Every purchase, sale and adjustment updates quantities instantly.",
    modules: [
      { label: "Products", to: "/products" },
      { label: "Inventory", to: "/inventory" },
    ],
  },
  {
    id: "sell",
    name: "Sell",
    icon: ScanBarcode,
    short: "POS and invoices",
    detail: "Sell at the counter with the POS, or send quotations and invoices to business customers.",
    automatic: "Each sale lowers stock and records the customer's purchase history.",
    modules: [
      { label: "POS", to: "/pos" },
      { label: "Sales orders", to: "/sales-orders" },
      { label: "Invoices", to: "/sales-invoices" },
    ],
  },
  {
    id: "paid",
    name: "Get paid",
    icon: Wallet,
    short: "Cash, card, UPI, credit",
    detail: "Take payment on the spot or track what customers owe and when it's due.",
    automatic: "Payments post to your accounts and reduce the customer's balance.",
    modules: [
      { label: "Customer payments", to: "/customer-payments" },
      { label: "Accounts receivable", to: "/accounts-receivable" },
    ],
  },
  {
    id: "understand",
    name: "Understand",
    icon: BarChart3,
    short: "Reports and accounts",
    detail: "Read sales, stock and profit reports built from everything above.",
    automatic: "Your ledger, profit & loss and tax figures are always up to date.",
    modules: [
      { label: "Reports", to: "/reports" },
      { label: "Accounting", to: "/accounting" },
    ],
  },
];

export const COMPARISON: { topic: string; old: string; valgrow: string }[] = [
  {
    topic: "Stock levels",
    old: "Counted by hand and kept in a spreadsheet that's always out of date.",
    valgrow: "Updated automatically with every purchase and sale.",
  },
  {
    topic: "Selling",
    old: "A separate till app; totals re-typed into the books at day end.",
    valgrow: "POS sales flow straight into stock, customers and accounts.",
  },
  {
    topic: "Buying",
    old: "Orders on WhatsApp or paper; nobody knows what's still coming.",
    valgrow: "Purchase orders and deliveries tracked in one place.",
  },
  {
    topic: "Customers",
    old: "Contacts in one phone, dues in a notebook.",
    valgrow: "One customer record with history, credit limit and balance.",
  },
  {
    topic: "Reports",
    old: "Hours of copying numbers to see last month's results.",
    valgrow: "Live reports and Excel export in a click.",
  },
];
