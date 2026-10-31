"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserGroupIcon as Users,
  Analytics02Icon as Activity,
  UserAdd01Icon as UserPlus,
  CheckmarkCircle01Icon as CheckCircle,
  Building02Icon as Building2,
  Notification01Icon as Bell,
  Analytics01Icon as BarChart3,
  ArrowRight01Icon as ArrowRight,
  SentIcon as Send,
  GlobeIcon as Globe,
  Message01Icon as MessageSquare,
} from "@hugeicons/react";
import { getOverview } from "@/lib/actions/dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MiniWorldMap } from "@/components/world-map";
import { FEEDBACK_CATEGORIES } from "@/lib/feedback-categories";
import { OverviewSkeleton } from "@/components/skeletons";
import type { AdminOverview as Overview } from "@/types/admin-overview";

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const h = 20;
  const w = 48;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: i * step,
    y: h - (v / max) * (h - 2) - 1,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path
        d={line}
        fill="none"
        className="stroke-foreground/40"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1]!.x}
        cy={pts[pts.length - 1]!.y}
        r={2}
        className="fill-foreground"
      />
    </svg>
  );
}

function RingGauge({ value, size = 40 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-border/40"
        strokeWidth={3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-foreground transition-all duration-500"
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={circ - filled}
        strokeLinecap="butt"
      />
    </svg>
  );
}

function SectionHeader({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground/50" />
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {title}
        </p>
      </div>
      <Link
        href={href as never}
        className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
      >
        View all
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <OverviewSkeleton />;

  const { stats, sparkline, recentUsers, recentNotifications, recentFeedback, countries } = data;
  const signupSpark = sparkline.map((s) => s.signups);
  const activeSpark = sparkline.map((s) => s.active);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          A snapshot of your product, right now.
        </p>
      </div>

      {/* Row 1: Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Total Users
            </p>
            <Users className="h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold tracking-tight">
              {stats.totalUsers}
            </p>
            <Sparkline data={signupSpark} />
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            +{stats.usersLast7d} this week
          </p>
        </div>

        <div className="rounded-2xl p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Active Today
            </p>
            <Activity className="h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold tracking-tight">
              {stats.dailyActiveUsers}
            </p>
            <Sparkline data={activeSpark} />
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            {stats.weeklyActiveUsers} this week
          </p>
        </div>

        <div className="rounded-2xl p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Onboarding
            </p>
            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
          <div className="flex items-center gap-3">
            <RingGauge value={stats.onboardingRate} />
            <div>
              <p className="text-lg font-bold tracking-tight">
                {stats.onboardingRate}%
              </p>
              <p className="text-[12px] text-muted-foreground">
                {stats.onboardedUsers}/{stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Notifications
            </p>
            <Bell className="h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
          <div className="flex items-center gap-3">
            <RingGauge value={stats.notificationReadRate} />
            <div>
              <p className="text-lg font-bold tracking-tight">
                {stats.notificationReadRate}%
              </p>
              <p className="text-[12px] text-muted-foreground">read rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 flex items-center gap-3 bg-muted/50">
          <UserPlus className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          <div>
            <p className="text-sm font-bold tracking-tight">
              +{stats.usersLast30d}
            </p>
            <p className="text-[12px] text-muted-foreground">signups (30d)</p>
          </div>
        </div>
        <div className="rounded-2xl p-3 flex items-center gap-3 bg-muted/50">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          <div>
            <p className="text-sm font-bold tracking-tight">
              {stats.totalOrgs}
            </p>
            <p className="text-[12px] text-muted-foreground">
              orgs · {stats.totalMembers} members
            </p>
          </div>
        </div>
        <div className="rounded-2xl p-3 flex items-center gap-3 bg-muted/50">
          <Send className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          <div>
            <p className="text-sm font-bold tracking-tight">
              {stats.totalNotifications}
            </p>
            <p className="text-[12px] text-muted-foreground">
              notifications sent
            </p>
          </div>
        </div>
      </div>

      {/* Row 3: Recent users + Recent notifications side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Recent users */}
        <div className="rounded-2xl bg-muted/50">
          <div className="px-4 py-3 border-b border-border/60">
            <SectionHeader
              title="Recent Users"
              href="/admin/users"
              icon={Users}
            />
          </div>
          <div className="divide-y divide-border/30">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No users yet
              </p>
            ) : (
              recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="px-4 py-2.5 flex items-center gap-3"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={u.image ?? ""} />
                    <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                      {u.name?.charAt(0).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {u.name}
                    </p>
                    <p className="text-[12px] text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {u.role === "admin" && (
                      <Badge variant="default" className="text-[11px] mb-0.5">
                        admin
                      </Badge>
                    )}
                    <p className="text-[11px] text-muted-foreground/50">
                      {timeAgo(u.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent notifications */}
        <div className="rounded-2xl bg-muted/50">
          <div className="px-4 py-3 border-b border-border/60">
            <SectionHeader
              title="Recent Notifications"
              href="/admin/notifications"
              icon={Bell}
            />
          </div>
          <div className="divide-y divide-border/30">
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No notifications sent yet
              </p>
            ) : (
              recentNotifications.map((n) => (
                <div key={n.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className="text-[11px] px-1.5 py-0"
                      >
                        {n.tag}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground/50">
                        → {n.recipientCount} recipient
                        {n.recipientCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 shrink-0">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Feedback glimpse */}
   

      {/* Row 5: Mini map + Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          href={"/admin/analytics" as never}
          className="rounded-2xl p-3 block hover:bg-muted/20 transition-colors group bg-muted/50"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-muted-foreground/50" />
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                User Locations
              </p>
            </div>
            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
          </div>
          <MiniWorldMap countries={countries} />
        </Link>

        <div className="md:col-span-2">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
            Quick Links
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                href: "/admin/users",
                label: "Users",
                icon: Users,
                desc: "Manage roles & access",
              },
              {
                href: "/admin/analytics",
                label: "Analytics",
                icon: BarChart3,
                desc: "Growth & engagement",
              },
              {
                href: "/admin/notifications",
                label: "Notifications",
                icon: Bell,
                desc: "Send messages",
              },
              {
                href: "/admin/general",
                label: "Settings",
                icon: CheckCircle,
                desc: "App config & features",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href as never}
                className="rounded-2xl flex items-start gap-2.5 p-3 hover:bg-muted/30 transition-colors group bg-muted/50"
              >
                <item.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium group-hover:text-foreground transition-colors">
                    {item.label}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-muted/50">
        <div className="px-4 py-3 border-b border-border/60">
          <SectionHeader
            title="Feedback"
            href="/admin/feedback"
            icon={MessageSquare}
          />
        </div>
        {recentFeedback.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No feedback yet
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border/60">
              <span className="text-[12px] text-muted-foreground">
                {stats.totalFeedback} total
              </span>
              <span className="text-[12px] text-muted-foreground">&middot;</span>
              <span className="text-[12px] font-medium">
                {stats.openFeedback} open
              </span>
            </div>
            <div className="divide-y divide-border/30">
              {recentFeedback.map((f) => {
                const catLabel =
                  FEEDBACK_CATEGORIES.find((c) => c.value === f.category)
                    ?.label ?? f.category;
                return (
                  <div key={f.id} className="px-4 py-2.5 flex items-center gap-3">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage src={f.user?.image ?? ""} />
                      <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">
                        {f.user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium truncate">
                          {f.user?.name ?? "Unknown"}
                        </span>
                        <span className="text-[11px] bg-foreground/10 text-foreground px-1.5 py-px font-semibold uppercase tracking-wider shrink-0">
                          {catLabel}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-px font-semibold uppercase tracking-wider shrink-0 ${
                            f.status === "open"
                              ? "bg-brand text-brand-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {f.status}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                        {f.message}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground/50 shrink-0">
                      {timeAgo(f.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
