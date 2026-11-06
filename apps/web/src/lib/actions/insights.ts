"use server";

import prisma from "@Batman/db";
import { COURSES, getAllLessons } from "@/data/lessons";
import { requireAdmin } from "@/lib/auth-guards";
import { computeDropOff, type DropOffAttempt, type DropOffLesson, type DropOffResult } from "@/lib/drop-off";
import { PRO_LIFETIME, PRO_MONTHLY, PRO_YEARLY } from "@/lib/plans";
import { getChapterSettings, getProProducts } from "@/lib/pro-access";

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const dayKey = (d: Date) => startOfDay(d).toISOString().slice(0, 10);
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

export type FounderInsights = Awaited<ReturnType<typeof getFounderInsights>>;

/** Everything on Admin → Insights, worked out from real activity. Admins only. */
export async function getFounderInsights() {
  await requireAdmin();
  const now = new Date();
  const today = startOfDay(now);
  const since = (days: number) => new Date(today.getTime() - days * DAY);

  const [totalUsers, newUsers7, signups30, activity30, completions, subs, profiles, products, settings, attemptsAll, attemptsWrong, acquisitions] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since(7) } } }),
      prisma.user.findMany({ where: { createdAt: { gte: since(60) } }, select: { id: true, createdAt: true } }),
      prisma.dailyActivity.findMany({
        where: { activityDate: { gte: since(60) } },
        select: { userId: true, activityDate: true, lessonsCompleted: true, xpEarned: true },
      }),
      prisma.lessonProgress.findMany({
        where: { status: { in: ["completed", "mastered"] } },
        select: { userId: true, lessonId: true, completedAt: true },
      }),
      prisma.subscription.findMany({ select: { userId: true, status: true, productId: true, currentPeriodEnd: true, cancelAtPeriodEnd: true } }),
      prisma.userProfile.findMany({ select: { id: true, totalXp: true, currentStreak: true, user: { select: { name: true } } } }),
      getProProducts(),
      getChapterSettings(),
      prisma.challengeAttempt.groupBy({ by: ["lessonId"], _count: { _all: true }, _sum: { hintCount: true } }),
      prisma.challengeAttempt.groupBy({ by: ["lessonId"], where: { isCorrect: false }, _count: { _all: true } }),
      // Empty if the table hasn't been created yet
      prisma.userAcquisition.findMany({ select: { userId: true, channel: true, source: true } }).catch(() => []),
    ]);

  // ── Active learners ──
  const activeSince = (days: number) => new Set(activity30.filter((a) => a.activityDate >= since(days)).map((a) => a.userId)).size;
  const dau = new Set(activity30.filter((a) => a.activityDate >= today).map((a) => a.userId)).size;

  // ── Daily series, last 30 days ──
  const series = new Map<string, { date: string; active: Set<string>; lessons: number; signups: number }>();
  for (let i = 29; i >= 0; i--) {
    const k = dayKey(since(i));
    series.set(k, { date: k, active: new Set(), lessons: 0, signups: 0 });
  }
  for (const a of activity30) {
    const row = series.get(dayKey(a.activityDate));
    if (row) {
      row.active.add(a.userId);
      row.lessons += a.lessonsCompleted;
    }
  }
  for (const u of signups30) {
    const row = series.get(dayKey(u.createdAt));
    if (row) row.signups += 1;
  }
  const daily = [...series.values()].map((r) => ({ date: r.date.slice(5), active: r.active.size, lessons: r.lessons, signups: r.signups }));

  // ── Revenue ──
  const lifetimeSubs = subs.filter((s) => s.status === "lifetime").length;
  const recurringSubs = subs.filter((s) => (s.status === "active" || s.status === "trialing") && s.currentPeriodEnd > now);
  const yearlySubs = recurringSubs.filter((s) => s.productId && s.productId === products.yearly).length;
  const monthlySubs = recurringSubs.length - yearlySubs;
  const activeSubs = [...recurringSubs, ...subs.filter((s) => s.status === "lifetime")];
  const mrr = Math.round((monthlySubs * PRO_MONTHLY + (yearlySubs * PRO_YEARLY) / 12) * 100) / 100;
  const cancelling = recurringSubs.filter((s) => s.cancelAtPeriodEnd).length;
  const proIds = new Set(activeSubs.map((s) => s.userId));

  // ── Chapter funnel and paywall ──
  const doneByUser = new Map<string, Set<string>>();
  for (const c of completions) {
    const set = doneByUser.get(c.userId) ?? new Set<string>();
    set.add(c.lessonId);
    doneByUser.set(c.userId, set);
  }
  const visible = COURSES.filter((c) => !settings[c.id]?.hidden);
  const finishedChapter = (userDone: Set<string>, courseId: string) =>
    COURSES.find((c) => c.id === courseId)!.lessons.every((l) => userDone.has(l.id));
  const funnel = visible.map((c, i) => {
    let finished = 0;
    for (const done of doneByUser.values()) if (finishedChapter(done, c.id)) finished++;
    return { chapter: `${i + 1}`, title: c.title, finished, pro: settings[c.id]?.access === "pro" };
  });
  const firstPro = visible.findIndex((c) => settings[c.id]?.access === "pro");
  const freeBeforePaywall = firstPro > 0 ? visible.slice(0, firstPro) : [];
  let reachedPaywall = 0;
  let convertedAtPaywall = 0;
  if (freeBeforePaywall.length) {
    for (const [userId, done] of doneByUser) {
      if (freeBeforePaywall.every((c) => finishedChapter(done, c.id))) {
        reachedPaywall++;
        if (proIds.has(userId)) convertedAtPaywall++;
      }
    }
  }

  // ── Retention: came back the day after signing up, and in their second week ──
  const activeDays = new Map<string, Set<string>>();
  for (const a of activity30) {
    const set = activeDays.get(a.userId) ?? new Set<string>();
    set.add(dayKey(a.activityDate));
    activeDays.set(a.userId, set);
  }
  const cohort = signups30.filter((u) => u.createdAt < since(14));
  let d1 = 0;
  let w2 = 0;
  for (const u of cohort) {
    const days = activeDays.get(u.id);
    if (!days) continue;
    const signup = startOfDay(u.createdAt).getTime();
    if (days.has(dayKey(new Date(signup + DAY)))) d1++;
    for (let i = 7; i <= 13; i++) {
      if (days.has(dayKey(new Date(signup + i * DAY)))) {
        w2++;
        break;
      }
    }
  }

  // ── Hardest lessons ──
  const lessonTitle = new Map(getAllLessons().map((l) => [l.id, l.title]));
  const wrong = new Map(attemptsWrong.map((a) => [a.lessonId, a._count._all]));
  const hardest = attemptsAll
    .filter((a) => a._count._all >= 5)
    .map((a) => ({
      lesson: lessonTitle.get(a.lessonId) ?? a.lessonId,
      attempts: a._count._all,
      wrongRate: pct(wrong.get(a.lessonId) ?? 0, a._count._all),
      hintsPerAttempt: Math.round(((a._sum.hintCount ?? 0) / a._count._all) * 100) / 100,
    }))
    .sort((x, y) => y.wrongRate - x.wrongRate)
    .slice(0, 8);

  // ── Streaks and top learners ──
  const buckets = [
    { label: "0", min: 0, max: 0 },
    { label: "1–2", min: 1, max: 2 },
    { label: "3–6", min: 3, max: 6 },
    { label: "7–13", min: 7, max: 13 },
    { label: "14–29", min: 14, max: 29 },
    { label: "30+", min: 30, max: Infinity },
  ];
  const streaks = buckets.map((b) => ({
    label: b.label,
    learners: profiles.filter((p) => p.currentStreak >= b.min && p.currentStreak <= b.max).length,
  }));
  const topLearners = [...profiles]
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, 8)
    .map((p) => ({ name: p.user?.name ?? "Learner", xp: p.totalXp, streak: p.currentStreak, pro: proIds.has(p.id) }));

  const lessons7 = completions.filter((c) => c.completedAt && c.completedAt >= since(7)).length;

  // ── Where learners come from ──
  const bySource = new Map<string, { source: string; channel: string | null; signups: number; finishedLesson: number; pro: number }>();
  for (const a of acquisitions) {
    const row = bySource.get(a.source) ?? { source: a.source, channel: a.channel, signups: 0, finishedLesson: 0, pro: 0 };
    row.signups++;
    if (doneByUser.has(a.userId)) row.finishedLesson++;
    if (proIds.has(a.userId)) row.pro++;
    bySource.set(a.source, row);
  }
  const trackedRows = [...bySource.values()].sort((a, b) => b.signups - a.signups);
  const sum = (key: "signups" | "finishedLesson" | "pro") => trackedRows.reduce((n, r) => n + r[key], 0);
  // Everyone else signed up before tracking began, or had cookies blocked.
  const unknownSource = {
    source: "Unknown",
    channel: null,
    signups: totalUsers - sum("signups"),
    finishedLesson: doneByUser.size - sum("finishedLesson"),
    pro: proIds.size - sum("pro"),
  };
  const sources = unknownSource.signups > 0 ? [...trackedRows, unknownSource] : trackedRows;

  return {
    kpis: {
      totalUsers,
      newUsers7,
      dau,
      wau: activeSince(7),
      mau: activeSince(30),
      lessonsCompleted: completions.length,
      lessons7,
      proSubscribers: activeSubs.length,
      monthlySubs,
      yearlySubs,
      lifetimeSubs,
      lifetimeRevenue: lifetimeSubs * PRO_LIFETIME,
      cancelling,
      mrr,
      arr: Math.round(mrr * 12 * 100) / 100,
      conversion: pct(activeSubs.length, totalUsers),
    },
    daily,
    funnel,
    paywall: {
      chapter: firstPro >= 0 ? firstPro + 1 : null,
      reached: reachedPaywall,
      converted: convertedAtPaywall,
      rate: pct(convertedAtPaywall, reachedPaywall),
    },
    retention: { cohort: cohort.length, d1: pct(d1, cohort.length), w2: pct(w2, cohort.length) },
    hardest,
    streaks,
    topLearners,
    sources,
  };
}

export type UserDropOff = DropOffResult & {
  userId: string;
  name: string;
  email: string;
  signedUpAt: Date;
  isPro: boolean;
  /** Null if they signed up before tracking began, or had cookies blocked. */
  cameFrom: { channel: string; source: string; campaign: string | null } | null;
};

/** Where each learner stopped, most recently active first. Admin accounts are left out. */
export async function getUserDropOffs(): Promise<UserDropOff[]> {
  await requireAdmin();
  const now = new Date();

  const [users, completions, attempts, xp, subs, settings, acquisitions] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    prisma.lessonProgress.findMany({
      where: { status: { in: ["completed", "mastered"] } },
      select: { userId: true, lessonId: true },
    }),
    prisma.challengeAttempt.findMany({
      select: { userId: true, lessonId: true, challengeId: true, isCorrect: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.xpTransaction.groupBy({ by: ["userId"], _max: { createdAt: true } }),
    prisma.subscription.findMany({ select: { userId: true, status: true, currentPeriodEnd: true } }),
    getChapterSettings(),
    // Empty if the table hasn't been created yet
    prisma.userAcquisition.findMany({ select: { userId: true, channel: true, source: true, campaign: true } }).catch(() => []),
  ]);
  const cameFrom = new Map(acquisitions.map((a) => [a.userId, a]));

  const lessons: DropOffLesson[] = COURSES.filter((c) => !settings[c.id]?.hidden).flatMap((c, i) =>
    c.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      chapter: i + 1,
      chapterTitle: c.title,
      pro: settings[c.id]?.access === "pro",
      stepIds: l.content.challenges.map((ch) => ch.id),
    }))
  );

  const proIds = new Set(
    subs
      .filter((s) => s.status === "lifetime" || ((s.status === "active" || s.status === "trialing") && s.currentPeriodEnd > now))
      .map((s) => s.userId)
  );
  const doneByUser = new Map<string, Set<string>>();
  for (const c of completions) {
    const set = doneByUser.get(c.userId) ?? new Set<string>();
    set.add(c.lessonId);
    doneByUser.set(c.userId, set);
  }
  const attemptsByUser = new Map<string, DropOffAttempt[]>();
  for (const a of attempts) {
    const list = attemptsByUser.get(a.userId) ?? [];
    list.push(a);
    attemptsByUser.set(a.userId, list);
  }
  const lastXp = new Map(xp.map((x) => [x.userId, x._max.createdAt]));

  return users
    .filter((u) => u.role !== "admin")
    .map((u) => {
      const userAttempts = attemptsByUser.get(u.id) ?? [];
      const times = [userAttempts.at(-1)?.createdAt, lastXp.get(u.id)].flatMap((t) => (t ? [t.getTime()] : []));
      const isPro = proIds.has(u.id);
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        signedUpAt: u.createdAt,
        isPro,
        cameFrom: cameFrom.get(u.id) ?? null,
        ...computeDropOff({
          lessons,
          completedLessonIds: doneByUser.get(u.id) ?? new Set(),
          attempts: userAttempts,
          isPro,
          signedUpAt: u.createdAt,
          lastActive: times.length ? new Date(Math.max(...times)) : null,
          now,
        }),
      };
    })
    .sort((a, b) => (b.lastActive ?? b.signedUpAt).getTime() - (a.lastActive ?? a.signedUpAt).getTime());
}
