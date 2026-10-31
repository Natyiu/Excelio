import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import Link from "next/link";
import {
  FireIcon as Flame,
  FlashIcon as Zap,
  Target02Icon as Target,
  Medal01Icon as Medal,
  PencilEdit02Icon as Pencil,
  StarIcon,
} from "@hugeicons/react";
import { getCompletedChallengeIds, getDashboardStats, getUserAchievements } from "@/lib/actions/excel-learning";
import { ACHIEVEMENTS, getLevelInfo } from "@/lib/gamification";
import { achievementProgress } from "@/lib/achievement-progress";
import { visibleCourses } from "@/lib/pro-access";
import { CHALLENGES } from "@/data/curriculum/challenges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ACHIEVEMENT_ICONS, achievementColour } from "@/components/achievement-icons";
import { LEVELS, levelStyle } from "@/components/level-picker";
import { Mascot } from "@/components/mascot";
import { Panel, SectionTitle } from "@/components/game-ui";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [stats, challengeIds, unlocked] = await Promise.all([
    getDashboardStats(),
    getCompletedChallengeIds().catch(() => []),
    getUserAchievements().catch(() => []),
  ]);

  const user = session?.user;
  const shownCourses = await visibleCourses();
  const totalXp = stats?.totalXp ?? 0;
  const levelInfo = getLevelInfo(totalXp);
  const doneIds = new Set(
    (stats?.lessonProgress ?? []).filter((p) => p.status === "completed" || p.status === "mastered").map((p) => p.lessonId)
  );
  const unlockedSlugs = new Set(unlocked.filter((u) => u.unlockedAt).map((u) => u.slug));
  const handle = user?.email?.split("@")[0] ?? "";

  const statTiles = [
    { label: "Day streak", value: stats?.currentStreak ?? 0, icon: Flame, colour: "#ea580c" },
    { label: "Total XP", value: totalXp.toLocaleString(), icon: Zap, colour: "#d97706" },
    { label: "Current level", value: levelInfo.level.title, icon: Medal, colour: "#1d9a52" },
    { label: "Challenges cleared", value: `${challengeIds.length}/${Object.values(CHALLENGES).flat().length}`, icon: Target, colour: "#7c3aed" },
  ];

  // Achievements in progress first (closest to done), then locked ones, then unlocked.
  const ctx = {
    lessonsCompleted: stats?.lessonsCompleted ?? 0,
    currentStreak: stats?.currentStreak ?? 0,
    totalXp,
    doneLessonIds: doneIds,
  };
  const achievements = ACHIEVEMENTS.map((a) => ({ a, p: achievementProgress(a, ctx), got: unlockedSlugs.has(a.slug) }))
    .sort((x, y) => Number(x.got) - Number(y.got) || (y.p ? y.p.value / y.p.max : -1) - (x.p ? x.p.value / x.p.max : -1))
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Cover: light green in both themes */}
      <section className="relative flex h-56 items-end justify-center overflow-hidden rounded-2xl bg-[#d7f5e3]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,#9fdcb8_1px,transparent_1px),linear-gradient(to_bottom,#9fdcb8_1px,transparent_1px)] [background-size:56px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />
        {user?.image ? (
          <Avatar className="relative mb-6 h-36 w-36 border-[6px] border-white shadow-[0_6px_0_#1d9a52]">
            <AvatarImage src={user.image} />
            <AvatarFallback className="bg-brand text-5xl font-bold text-brand-foreground">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <Mascot mood="wave" size={170} className="relative -mb-2" />
        )}
        <Link
          href="/dashboard/settings"
          aria-label="Edit profile"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-b-4 border-[#9fdcb8] bg-white text-[#0d6b37] transition-transform hover:brightness-95 active:translate-y-0.5"
        >
          <Pencil className="h-5 w-5" />
        </Link>
      </section>

      {/* Identity */}
      <section className="flex items-start justify-between gap-4 border-b-2 border-border pb-6">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{user?.name}</h1>
          <p className="truncate text-[15px] text-muted-foreground">@{handle}</p>
          {user?.createdAt && (
            <p className="mt-1 text-[15px]">
              Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
          )}
          <p className="mt-2 text-sm font-bold text-brand">
            {stats?.lessonsCompleted ?? 0} lessons · {unlockedSlugs.size} badges
          </p>
        </div>
        <span className="shrink-0 rounded-xl bg-brand px-3 py-1.5 text-sm font-black text-brand-foreground shadow-[0_3px_0_var(--brand-deep)]">
          LVL {levelInfo.level.level}
        </span>
      </section>

      {/* Statistics */}
      <section>
        <SectionTitle>Statistics</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {statTiles.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-start gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3.5">
                <Icon className="mt-0.5 h-6 w-6 shrink-0" style={{ color: s.colour }} />
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{s.value}</p>
                  <p className="text-[14px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <SectionTitle
          action={
            <Link href="/dashboard/achievements" className="text-sm font-bold uppercase tracking-wide text-brand">
              View all
            </Link>
          }
        >
          Achievements
        </SectionTitle>
        <Panel className="divide-y-2 divide-border overflow-hidden">
          {achievements.map(({ a, p, got }) => {
            const Icon = ACHIEVEMENT_ICONS[a.slug] ?? StarIcon;
            const c = achievementColour(a.slug);
            return (
              <div key={a.slug} className="flex items-center gap-4 p-4">
                <span
                  className={cn("flex h-20 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-white", !got && !p?.value && "opacity-70")}
                  style={{ background: c.base, boxShadow: `0 4px 0 ${c.deep}` }}
                >
                  <Icon className="h-8 w-8" />
                  <span className="text-[9px] font-black uppercase tracking-wide">+{a.xpReward} XP</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-bold">{a.title}</p>
                    {p && !got && (
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        {Math.min(p.value, p.max)}/{p.max}
                      </span>
                    )}
                  </div>
                  {got ? (
                    <p className="mt-2 text-sm font-bold text-brand">Unlocked</p>
                  ) : (
                    <span className="mt-2 block h-3 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${p ? Math.min(100, (p.value / p.max) * 100) : 0}%`, background: c.base }}
                      />
                    </span>
                  )}
                  <p className="mt-1.5 text-[14px] text-muted-foreground">{a.description}</p>
                </div>
              </div>
            );
          })}
        </Panel>
      </section>

      {/* Learning path */}
      <section>
        <SectionTitle>Learning path</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => {
            const chapters = shownCourses.filter((c) => c.difficulty === l.id);
            const lessons = chapters.flatMap((c) => c.lessons);
            const done = lessons.filter((x) => doneIds.has(x.id)).length;
            const pct = lessons.length ? done / lessons.length : 0;
            return (
              <div key={l.id} style={levelStyle(l.id)} className="rounded-2xl border-2 border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{l.label}</p>
                  <span className="text-sm font-bold tabular-nums text-brand">{Math.round(pct * 100)}%</span>
                </div>
                <span className="mt-2 block h-2.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${pct * 100}%` }} />
                </span>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  {done}/{lessons.length} lessons · {chapters.filter((c) => c.lessons.every((x) => doneIds.has(x.id))).length}/{chapters.length} chapters
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
