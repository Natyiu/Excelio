"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAdminBadges, type AdminBadges } from "@/lib/actions/admin-badges";
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
  GlobeIcon as Globe,
  RocketIcon as Rocket,
  StarIcon as Star,
  BookOpen01Icon as Book,
  ChartLineData01Icon as Insights,
  CrownIcon as Crown,
  ChartIncreaseIcon as Revenue,
  RankingIcon as Ranking,
  Megaphone01Icon as Megaphone,
} from "@hugeicons/react";
import { BrandLogo } from "@/components/brand-logo";

type BadgeKey = keyof AdminBadges;
type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean; badge?: BadgeKey };

/** Each badge has its own colour so you can tell them apart at a glance. */
const BADGE_COLOUR: Record<BadgeKey, string> = {
  feedback: "bg-orange-500 text-white",
  testimonials: "bg-amber-400 text-amber-950",
  paidUsers: "bg-violet-600 text-white",
  users: "bg-sky-500 text-white",
};
const BADGE_HINT: Record<BadgeKey, string> = {
  feedback: "new since you last looked",
  testimonials: "new since you last looked",
  paidUsers: "new since you last looked",
  users: "new since you last looked",
};

// "New since you last looked" is tracked in the admin's browser; opening a page clears its badge.
const BADGE_KEYS: BadgeKey[] = ["feedback", "testimonials", "paidUsers", "users"];
const SEEN_PATH: Record<BadgeKey, string> = {
  feedback: "/admin/feedback",
  testimonials: "/admin/testimonials",
  paidUsers: "/admin/paid-users",
  users: "/admin/users",
};
const seenKey = (k: BadgeKey) => `excelio:admin-seen:${k}`;
const readSeen = (k: BadgeKey) => {
  try {
    return localStorage.getItem(seenKey(k)) ?? undefined;
  } catch {
    return undefined;
  }
};

/** Badge counts, refreshed on every admin page change. Opening a page clears its badge. */
function useAdminBadges(pathname: string): AdminBadges | null {
  const [badges, setBadges] = useState<AdminBadges | null>(null);
  useEffect(() => {
    for (const k of BADGE_KEYS) {
      // Never looked before (new browser, or first time): start counting from now, so
      // people you've already seen are never counted as new.
      if (!readSeen(k) || pathname.startsWith(SEEN_PATH[k])) {
        try {
          localStorage.setItem(seenKey(k), new Date().toISOString());
        } catch {
          /* ignore */
        }
      }
    }
    let cancelled = false;
    getAdminBadges(Object.fromEntries(BADGE_KEYS.map((k) => [k, readSeen(k)])))
      .then((b) => !cancelled && setBadges(b))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);
  return badges;
}

function Badge({ k, count, className }: { k: BadgeKey; count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      title={`${count} ${BADGE_HINT[k]}`}
      className={`ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums ${BADGE_COLOUR[k]} ${className ?? ""}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

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
      { name: "Testimonials", href: "/admin/testimonials", icon: Star, badge: "testimonials" },
      { name: "Feedback", href: "/admin/feedback", icon: MessageSquare, badge: "feedback" },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Users", href: "/admin/users", icon: Users, badge: "users" },
      { name: "Rivals", href: "/admin/rivals", icon: Ranking },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { name: "Blog", href: "/admin/blog", icon: FileText },
    ],
  },
  {
    title: "Billing",
    items: [
      { name: "Revenue", href: "/admin/revenue", icon: Revenue },
      { name: "Paid Users", href: "/admin/paid-users", icon: Crown, badge: "paidUsers" },
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
  const badges = useAdminBadges(pathname);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 shrink-0 flex-col border-r border-border/60 bg-background px-3 py-5 md:flex">
      <Link href="/admin" className="mb-5 flex items-center gap-2 px-3">
        <span className="inline-flex items-center gap-[0.3em] text-[24px] font-bold tracking-tight text-brand"><BrandLogo />Excelio</span>
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
                    {item.badge && badges && <Badge k={item.badge} count={badges[item.badge]} />}
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
  const badges = useAdminBadges(pathname);

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
          <span className="flex items-center gap-1.5">
            {item.name}
            {item.badge && badges && <Badge k={item.badge} count={badges[item.badge]} className="ml-0" />}
          </span>
        </Link>
      ))}
    </div>
  );
}
