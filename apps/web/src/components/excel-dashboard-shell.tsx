"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Home01Icon as Home,
  CodeSquareIcon as Sandbox,
  Target02Icon as Target,
  RankingIcon as Ranking,
  Award01Icon as Award,
  UserIcon as User,
  MoreHorizontalIcon as More,
  Notification03Icon as Bell,
  FireIcon as Flame,
  FlashIcon as Zap,
  Moon02Icon as Moon,
  Sun03Icon as Sun,
  Clock01Icon as Clock,
  ArrowRight01Icon as ArrowRight,
} from "@hugeicons/react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { IconTile, Panel, ProgressBar } from "@/components/game-ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Extra path prefixes that should also mark this item active. */
  match?: string[];
};

const PROFILE_HREF = "/dashboard/profile";

const NAV_ITEMS: NavItem[] = [
  { label: "Learn", href: "/dashboard", icon: Home, match: ["/dashboard/learn"] },
  { label: "Practice", href: "/dashboard/practice", icon: Sandbox },
  { label: "Challenge", href: "/dashboard/daily-challenge", icon: Target },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Ranking },
  { label: "Achievements", href: "/dashboard/achievements", icon: Award },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];
const profileItem = NAV_ITEMS.find((item) => item.href === PROFILE_HREF);

// Secondary pages are reached from the More page instead of the main nav.
const MORE_PAGES = [
  { label: "More", href: "/dashboard/more" },
  { label: "Organizations", href: "/dashboard/organizations" },
  { label: "Invitations", href: "/dashboard/invitations" },
  { label: "Settings", href: "/dashboard/settings" },
];

function isActive(pathname: string, item: { href: string; match?: string[] }) {
  if (item.href === "/dashboard") {
    return pathname === "/dashboard" || (item.match?.some((m) => pathname.startsWith(m)) ?? false);
  }
  return pathname.startsWith(item.href);
}

// Lessons, challenges and practice sheets take over the whole screen; their list pages keep the sidebar.
const isLessonRoute = (p: string) =>
  /^\/dashboard\/learn\/[^/]+\/[^/]+/.test(p) ||
  /^\/dashboard\/daily-challenge\/[^/]+\/[^/]+/.test(p) ||
  /^\/dashboard\/practice\/[^/]+\/[^/]+/.test(p) ||
  p === "/dashboard/upgrade";
// No wide-only routes right now: list pages share the Learn layout, with the quests rail.
const isWideRoute = (_p: string) => false;

export type ShellStats = {
  totalXp: number;
  currentStreak: number;
  todayXp: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
};

export type LeaderRow = { rank: number; name: string; avatarUrl: string | null; xp: number; isMe: boolean };

export function ExcelDashboardShell({
  children,
  stats,
  unreadNotifications = 0,
  leaders = [],
}: {
  /** This week's top three, plus the learner if they're outside it. */
  leaders?: LeaderRow[];
  children: React.ReactNode;
  /** Shown as a badge on Notifications. */
  unreadNotifications?: number;
  /** The signed-in session. Account actions now live on the More page, which loads its own. */
  session: typeof authClient.$Infer.Session;
  stats?: ShellStats;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  if (isLessonRoute(pathname)) {
    return <div className="min-h-screen bg-background font-apple text-foreground">{children}</div>;
  }

  const showRail = !isWideRoute(pathname);
  const moreActive = MORE_PAGES.some((p) => pathname.startsWith(p.href));

  return (
    <div className="flex min-h-screen bg-background font-apple text-foreground antialiased">
      {/* ── Sidebar (desktop) ── */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-2 border-border bg-background px-4 py-6 lg:flex">
        <Link href="/dashboard" className="inline-flex items-center gap-[0.3em] mb-8 px-4 text-[26px] font-bold tracking-tight text-brand">
          <BrandLogo />
          Excelio
        </Link>

        <nav className="flex-1 space-y-1">
          {/* Profile sits at the bottom of the sidebar instead, above the theme toggle. */}
          {NAV_ITEMS.filter((item) => item.href !== PROFILE_HREF).map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(pathname, item)}
              badge={item.href === "/dashboard/notifications" ? unreadNotifications : 0}
            />
          ))}
          <SidebarLink item={{ label: "More", href: "/dashboard/more", icon: More }} active={moreActive} />
        </nav>

        {profileItem && <SidebarLink item={profileItem} active={isActive(pathname, profileItem)} />}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          {isDark ? (
            <Sun className="h-[22px] w-[22px] text-muted-foreground" />
          ) : (
            <Moon className="h-[22px] w-[22px] text-muted-foreground" />
          )}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-border bg-background px-4 lg:hidden">
          <Link href="/dashboard" className="inline-flex items-center gap-[0.3em] text-xl font-bold tracking-tight text-brand">
            <BrandLogo />
            Excelio
          </Link>
          <StatRow stats={stats} />
        </header>

        <div className="flex flex-1 gap-8 px-4 lg:px-8">
          {/* The content column is centred in the space between the sidebar and the
              rail, so the gap on its left matches the gap on its right. Its top padding
              matches the rail's (40px), so the first card starts level with the stat row. */}
          <div className="flex min-w-0 flex-1 justify-center">
            <main className={cn("w-full min-w-0 pb-8 pt-6 lg:pt-10", showRail ? "max-w-[620px]" : "max-w-none")}>
              {children}
            </main>
          </div>

          {showRail && (
            <aside className="hidden w-[340px] shrink-0 xl:block">
              <div className="sticky top-0 space-y-5 pb-6 pt-10">
                {/* Top-aligned so the icons line up with the top of the first content card. */}
                <div className="flex h-10 items-start">
                  <StatRow stats={stats} />
                </div>
                <QuestsPanel stats={stats} />
                <Panel className="p-5">
                  <p className="text-lg font-semibold">Weekly leaderboard</p>
                  {leaders.length > 0 ? (
                    <LeaderList leaders={leaders} />
                  ) : (
                    <div className="mt-3 flex items-center gap-4">
                      <IconTile tone="amber">
                        <Ranking className="h-6 w-6" />
                      </IconTile>
                      <p className="text-[15px] text-muted-foreground">
                        Nobody has earned XP yet this week. Finish a lesson to take first place.
                      </p>
                    </div>
                  )}
                  <Link
                    href="/dashboard/leaderboard"
                    className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand"
                  >
                    View leaderboard <ArrowRight className="h-4 w-4" />
                  </Link>
                </Panel>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ── Bottom tab bar (mobile) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t-2 border-border bg-background px-2 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as never}
              aria-label={item.label}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                active ? "bg-brand-soft text-brand" : "text-muted-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              {item.href === "/dashboard/notifications" && unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>
          );
        })}
        <Link
          href={"/dashboard/more" as never}
          aria-label="More"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
            moreActive ? "bg-brand-soft text-brand" : "text-muted-foreground"
          )}
        >
          <More className="h-6 w-6" />
        </Link>
      </nav>
    </div>
  );
}

function SidebarLink({ item, active, badge = 0 }: { item: NavItem; active: boolean; badge?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href as never}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-medium transition-colors",
        active
          ? "bg-brand-soft font-semibold text-brand-deep dark:text-brand"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("h-[22px] w-[22px]", active ? "text-brand" : "text-muted-foreground")} />
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[12px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// Gold, silver and bronze, as on the leaderboard podium.
const MEDALS = ["#f5b301", "#b8c2cc", "#d9822b"];

function LeaderList({ leaders }: { leaders: LeaderRow[] }) {
  return (
    <ol className="mt-3 space-y-1">
      {leaders.map((l) => {
        const medal = MEDALS[l.rank - 1];
        return (
          <li key={l.rank}>
            {l.rank > 3 && <span aria-hidden className="my-1.5 block border-t-2 border-dashed border-border" />}
            <div className={cn("flex items-center gap-3 rounded-xl px-2 py-1.5", l.isMe && "bg-brand-soft")}>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-black tabular-nums",
                  medal ? "text-white" : "text-muted-foreground"
                )}
                style={medal ? { background: medal } : undefined}
              >
                {l.rank}
              </span>
              <Avatar className="h-9 w-9 shrink-0 border-2" style={{ borderColor: medal ?? "var(--border)" }}>
                <AvatarImage src={l.avatarUrl || undefined} />
                <AvatarFallback className="bg-muted text-[12px] font-bold">{l.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className={cn("min-w-0 flex-1 truncate text-[15px] font-semibold", l.isMe && "text-brand")}>
                {l.isMe ? "You" : l.name}
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-muted-foreground">{l.xp.toLocaleString()} XP</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const CHIP = "flex items-center gap-1.5 px-2";

function StatRow({ stats }: { stats?: ShellStats }) {
  const streak = stats?.currentStreak ?? 0;
  const xp = stats?.totalXp ?? 0;
  return (
    <div className="flex items-center gap-2 text-[15px] font-semibold tabular-nums">
      <span className={cn(CHIP, streak > 0 ? "text-orange-500" : "text-muted-foreground")}>
        <Flame className="h-[18px] w-[18px]" /> {streak}
      </span>
      <span className={cn(CHIP, "text-brand")}>
        <Zap className="h-[18px] w-[18px]" /> {xp.toLocaleString()}
      </span>
      <span className={cn(CHIP, "text-green-500 max-sm:hidden")}>
        <Clock className="h-[18px] w-[18px]" /> {stats?.todayMinutes ?? 0}m
      </span>
    </div>
  );
}

function QuestsPanel({ stats }: { stats?: ShellStats }) {
  const goal = stats?.dailyGoalMinutes || 10;
  const quests = [
    { label: "Earn 10 XP", value: stats?.todayXp ?? 0, max: 10, icon: Zap, tone: "amber" as const },
    { label: `Spend ${goal} minutes learning`, value: stats?.todayMinutes ?? 0, max: goal, icon: Clock, tone: "sky" as const },
    { label: "Extend your streak", value: (stats?.todayXp ?? 0) > 0 ? 1 : 0, max: 1, icon: Flame, tone: "rose" as const },
  ];
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Daily quests</p>
        <Link href="/dashboard/achievements" className="text-sm font-semibold text-brand">
          View all
        </Link>
      </div>
      <ul className="mt-4 space-y-5">
        {quests.map((q) => {
          const Icon = q.icon;
          return (
            <li key={q.label} className="flex items-center gap-4">
              <IconTile tone={q.value >= q.max ? "brand" : q.tone} className="h-10 w-10">
                <Icon className="h-5 w-5" />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-[15px] font-medium">{q.label}</p>
                <ProgressBar value={q.value} max={q.max} showLabel />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
