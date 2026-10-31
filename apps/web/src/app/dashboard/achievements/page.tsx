import type { CSSProperties } from "react";
import { CheckmarkBadge01Icon, LockIcon, StarIcon } from "@hugeicons/react";
import { ACHIEVEMENTS, type AchievementDef } from "@/lib/gamification";
import { getUserAchievements, getDashboardStats } from "@/lib/actions/excel-learning";
import { achievementProgress } from "@/lib/achievement-progress";
import { ACHIEVEMENT_ICONS as ICONS } from "@/components/achievement-icons";
import { Mascot } from "@/components/mascot";
import { SectionTitle } from "@/components/game-ui";
import { cn } from "@/lib/utils";

/** Shelves, each with its own colour. */
const SHELVES: { title: string; slugs: string[]; base: string; deep: string }[] = [
  { title: "Lessons", slugs: ["first-lesson", "five-lessons", "ten-lessons", "twenty-lessons", "perfect-lesson"], base: "#1d9a52", deep: "#0d6b37" },
  { title: "Streaks", slugs: ["three-day-streak", "seven-day-streak", "thirty-day-streak"], base: "#ea580c", deep: "#9a3412" },
  { title: "Mastery", slugs: ["formula-beginner", "lookup-specialist", "daily-challenge"], base: "#0284c7", deep: "#075985" },
  { title: "XP", slugs: ["xp-500", "xp-1000"], base: "#7c3aed", deep: "#5b21b6" },
];

const colours = (base: string, deep: string) =>
  ({ "--brand": base, "--brand-deep": deep, "--brand-soft": `color-mix(in oklab, ${base} 16%, var(--background))` }) as CSSProperties;

export default async function AchievementsPage() {
  const [stats, unlocked] = await Promise.all([getDashboardStats(), getUserAchievements()]);

  const unlockedOn = new Map<string, string>();
  for (const u of unlocked) {
    if (u.unlockedAt) unlockedOn.set(u.slug, new Date(u.unlockedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));
  }
  const doneLessons = new Set(
    (stats?.lessonProgress ?? []).filter((p) => p.status === "completed" || p.status === "mastered").map((p) => p.lessonId)
  );

  const ctx = {
    lessonsCompleted: stats?.lessonsCompleted ?? 0,
    currentStreak: stats?.currentStreak ?? 0,
    totalXp: stats?.totalXp ?? 0,
    doneLessonIds: doneLessons,
  };
  const progressFor = (a: AchievementDef) => achievementProgress(a, ctx);

  const earnedXp = ACHIEVEMENTS.filter((a) => unlockedOn.has(a.slug)).reduce((n, a) => n + a.xpReward, 0);
  // The locked achievement you're closest to.
  const next = ACHIEVEMENTS.filter((a) => !unlockedOn.has(a.slug))
    .map((a) => ({ a, p: progressFor(a) }))
    .filter((x) => x.p)
    .sort((x, y) => y.p!.value / y.p!.max - x.p!.value / x.p!.max)[0];

  return (
    <div className="space-y-8">
      {/* Trophy room banner, in gold */}
      <section
        style={colours("#d97706", "#92400e")}
        className="relative overflow-hidden rounded-2xl bg-brand px-6 pb-6 pt-8 text-brand-foreground"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(white_1.5px,transparent_1.5px)] [background-size:20px_20px] [mask-image:linear-gradient(to_left,black,transparent_85%)]"
        />
        <Mascot mood="trophy" size={150} className="absolute -bottom-2 right-4 hidden sm:block" />
        <div className="relative max-w-md">
          <p className="text-[13px] font-bold uppercase tracking-wide opacity-80">Trophy room</p>
          <h1 className="mt-1 text-3xl font-bold">
            {unlockedOn.size} of {ACHIEVEMENTS.length} unlocked
          </h1>
          <p className="mt-2 text-[15px] opacity-90">{earnedXp} XP earned from achievements so far.</p>

          {next && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-black/15 p-3">
              <NextIcon slug={next.a.slug} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-wide opacity-80">Next up</p>
                <p className="truncate font-bold">{next.a.title}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/25">
                    <span className="block h-full rounded-full bg-white" style={{ width: `${Math.min(100, (next.p!.value / next.p!.max) * 100)}%` }} />
                  </span>
                  <span className="text-[12px] font-bold tabular-nums">
                    {Math.min(next.p!.value, next.p!.max)}/{next.p!.max}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Shelves of badges */}
      {SHELVES.map((shelf) => {
        const items = shelf.slugs.map((s) => ACHIEVEMENTS.find((a) => a.slug === s)).filter((a): a is AchievementDef => Boolean(a));
        const got = items.filter((a) => unlockedOn.has(a.slug)).length;
        return (
          <section key={shelf.title} style={colours(shelf.base, shelf.deep)}>
            <SectionTitle action={<span className="text-sm font-bold text-muted-foreground">{got}/{items.length}</span>}>{shelf.title}</SectionTitle>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {items.map((a) => (
                <Badge key={a.slug} achievement={a} unlockedOn={unlockedOn.get(a.slug)} progress={progressFor(a)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function NextIcon({ slug }: { slug: string }) {
  const Icon = ICONS[slug] ?? StarIcon;
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
      <Icon className="h-6 w-6" />
    </span>
  );
}

function Badge({
  achievement: a,
  unlockedOn,
  progress,
}: {
  achievement: AchievementDef;
  unlockedOn?: string;
  progress: { value: number; max: number } | null;
}) {
  const Icon = ICONS[a.slug] ?? StarIcon;
  const got = Boolean(unlockedOn);
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl border-2 border-b-[5px] p-4 text-center",
        got ? "border-brand/40 bg-brand-soft" : "border-border bg-card"
      )}
    >
      <div className="flex w-full justify-end">
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", got ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground")}>
          +{a.xpReward} XP
        </span>
      </div>

      {/* medal */}
      <span
        className={cn(
          "relative -mt-1 flex h-20 w-20 items-center justify-center rounded-full",
          got ? "bg-brand text-brand-foreground shadow-[0_5px_0_var(--brand-deep)]" : "bg-muted text-muted-foreground/60 shadow-[0_5px_0_var(--border)]"
        )}
      >
        {got && <span aria-hidden className="absolute inset-1.5 rounded-full border-2 border-white/30" />}
        <Icon className="h-9 w-9" />
        {!got && (
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted-foreground/80 text-card">
            <LockIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </span>

      <p className="mt-4 font-bold leading-tight">{a.title}</p>
      <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{a.description}</p>

      <div className="mt-auto w-full pt-3">
        {got ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-brand">
            <CheckmarkBadge01Icon className="h-4 w-4" /> {unlockedOn}
          </span>
        ) : progress ? (
          <div className="flex items-center gap-2">
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (progress.value / progress.max) * 100)}%` }} />
            </span>
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
              {Math.min(progress.value, progress.max)}/{progress.max}
            </span>
          </div>
        ) : (
          <span className="text-[12px] font-semibold text-muted-foreground">Locked</span>
        )}
      </div>
    </div>
  );
}
