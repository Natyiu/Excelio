"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { useMounted } from "@/lib/use-mounted";
import {
  DashboardSquare01Icon as LayoutDashboard,
  UserGroupIcon as Users,
  Notification01Icon as Bell,
  Settings02Icon as Settings2,
  ToggleOnIcon as ToggleRight,
  SquareLockPasswordIcon as Key,
  Analytics01Icon as BarChart3,
  Message01Icon as MessageSquare,
  ArrowLeft01Icon as ArrowLeft,
  File01Icon as FileText,
  Sun03Icon as Sun,
  Moon02Icon as Moon,
  CreditCardIcon as CreditCard,
  GlobeIcon as Globe,
  RocketIcon as Rocket,
  StarIcon as Star,
  BookOpen01Icon as Book,
  ChartLineData01Icon as Insights,
  CrownIcon as Crown,
} from "@hugeicons/react";

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean };

// Grouped like a founder thinks about the product.
const adminGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
      { name: "Insights", href: "/admin/insights", icon: Insights },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Learning",
    items: [
      { name: "Curriculum", href: "/admin/curriculum", icon: Book },
      { name: "Testimonials", href: "/admin/testimonials", icon: Star },
      { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Blog", href: "/admin/blog", icon: FileText },
    ],
  },
  {
    title: "Billing",
    items: [
      { name: "Paid Users", href: "/admin/paid-users", icon: Crown },
      { name: "Products", href: "/admin/products", icon: CreditCard },
    ],
  },
  {
    title: "Settings",
    items: [
      { name: "General", href: "/admin/general", icon: Settings2 },
      { name: "Site Settings", href: "/admin/site-settings", icon: Globe },
      { name: "Features", href: "/admin/features", icon: ToggleRight },
      { name: "API Keys", href: "/admin/api-keys", icon: Key },
      { name: "Deployment", href: "/admin/deployment", icon: Rocket },
    ],
  },
];
const adminNav = adminGroups.flatMap((g) => g.items);

const isActive = (pathname: string, item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-[14px] font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
    >
      {dark ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 shrink-0 flex-col border-r border-border/60 bg-background px-3 py-5 md:flex">
      <Link href="/admin" className="mb-5 flex items-center gap-2 px-3">
        <span className="text-[24px] font-bold tracking-tight text-brand">Excelio</span>
        <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">Admin</span>
      </Link>

      <nav className="flex-1 space-y-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {adminGroups.map((g) => (
          <div key={g.title}>
            <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80">{g.title}</p>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href as never}
                    className={
                      active
                        ? "flex items-center gap-3 rounded-xl bg-brand-soft px-3 py-1.5 text-[14px] font-semibold text-brand-deep dark:text-brand"
                        : "flex items-center gap-3 rounded-xl px-3 py-1.5 text-[14px] font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                    }
                  >
                    <item.icon className={active ? "h-5 w-5 text-brand" : "h-5 w-5 text-muted-foreground"} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-3 space-y-0.5 border-t border-border/60 pt-3">
        <Link
          href={"/dashboard" as never}
          className="flex items-center gap-3 rounded-xl px-3 py-1.5 text-[14px] font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          Back to app
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <div className="-mx-1 mb-6 flex gap-1.5 overflow-x-auto px-1 pb-1 md:hidden">
      {adminNav.map((item) => (
        <Link
          key={item.href}
          href={item.href as never}
          className={
            isActive(pathname, item)
              ? "shrink-0 rounded-full bg-brand-soft px-3.5 py-1.5 text-[13px] font-semibold text-brand-deep dark:text-brand"
              : "shrink-0 rounded-full border-2 border-border px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground"
          }
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
