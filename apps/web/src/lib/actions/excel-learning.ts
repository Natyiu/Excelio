"use server";

import { auth } from "@Batman/auth";
import { isProCourse } from "@/lib/pro-access";
import { getSubscriptionStatus } from "@/lib/subscription";
import prisma from "@Batman/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateXpKey, checkAchievements, ACHIEVEMENTS } from "@/lib/gamification";
import { COURSES, getAllLessons } from "@/data/lessons";
import { CHALLENGES } from "@/data/curriculum/challenges";
import type { LessonStatus } from "@/types/excel-learning";

// ─── User Profile ──────────────────────────────────────────────────────────────

export async function getOrCreateUserProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  let profile = await prisma.userProfile.findUnique({
    where: { id: session.user.id },
  });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: {
        id: session.user.id,
        skillLevel: "beginner",
        learningGoals: [],
        dailyGoalMinutes: 10,
        timezone: "UTC",
        totalXp: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  }

  return profile;
}

export async function updateUserProfile(data: {
  skillLevel?: string;
  learningGoals?: string[];
  dailyGoalMinutes?: number;
  timezone?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");

  return prisma.userProfile.upsert({
    where: { id: session.user.id },
    create: { id: session.user.id, ...data },
    update: data,
  });
}

// ─── Curriculum rows ───────────────────────────────────────────────────────────

const syncedLessons = new Set<string>();

/**
 * Lessons live in code (`data/lessons.ts`), but progress and attempts reference
 * the `course` and `lesson` tables. Make sure the rows for a lesson and its
 * chapter exist before writing anything that points at them.
 */
async function ensureLessonRows(lessonId: string) {
  if (syncedLessons.has(lessonId)) return;
  const course = COURSES.find((c) => c.lessons.some((l) => l.id === lessonId));
  const lesson = course?.lessons.find((l) => l.id === lessonId);
  if (!course || !lesson) throw new Error(`Unknown lesson: ${lessonId}`);

  const courseData = {
    slug: course.slug,
    title: course.title,
    description: course.description,
    difficulty: course.difficulty,
    sortOrder: course.sortOrder,
    published: course.published,
  };
  await prisma.course.upsert({ where: { id: course.id }, create: { id: course.id, ...courseData }, update: courseData });

  // The full lesson content stays in code; the row only needs to exist.
  const lessonData = {
    courseId: course.id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    difficulty: lesson.difficulty,
    estimatedMinutes: lesson.estimatedMinutes,
    xpReward: lesson.xpReward,
    sortOrder: lesson.sortOrder,
    prerequisites: lesson.prerequisites,
    published: lesson.published,
  };
  await prisma.lesson.upsert({
    where: { id: lesson.id },
    create: { id: lesson.id, ...lessonData, content: {} },
    update: lessonData,
  });
  syncedLessons.add(lessonId);
}

// ─── Lesson Progress ───────────────────────────────────────────────────────────

export async function getLessonProgress(lessonId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  return prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId: session.user.id, lessonId },
    },
  });
}

export async function getAllLessonProgress() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return prisma.lessonProgress.findMany({
    where: { userId: session.user.id },
  });
}

export async function updateLessonProgress(data: {
  lessonId: string;
  courseId: string;
  status: LessonStatus;
  currentChallengeIndex?: number;
  workbookState?: object;
  attempts?: number;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");

  const completedAt = data.status === "completed" || data.status === "mastered"
    ? new Date()
    : undefined;

  await ensureLessonRows(data.lessonId);

  return prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId: session.user.id, lessonId: data.lessonId },
    },
    create: {
      userId: session.user.id,
      lessonId: data.lessonId,
      courseId: data.courseId,
      status: data.status,
      currentChallengeIndex: data.currentChallengeIndex ?? 0,
      workbookState: data.workbookState ?? {},
      attempts: data.attempts ?? 0,
      completedAt,
    },
    update: {
      status: data.status,
      currentChallengeIndex: data.currentChallengeIndex,
      workbookState: data.workbookState,
      attempts: data.attempts !== undefined ? { increment: data.attempts } : undefined,
      completedAt,
      updatedAt: new Date(),
    },
  });
}

// ─── XP System ────────────────────────────────────────────────────────────────

export async function awardXP(amount: number, reason: string, referenceId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");

  const idempotencyKey = generateXpKey(session.user.id, reason, referenceId);

  // Check if already awarded (idempotent)
  const existing = await prisma.xpTransaction.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return { awarded: false, amount: 0, newTotal: 0 };

  // Create transaction + update profile in a transaction
  const [, profile] = await prisma.$transaction([
    prisma.xpTransaction.create({
      data: {
        userId: session.user.id,
        amount,
        reason,
        referenceId,
        idempotencyKey,
      },
    }),
    prisma.userProfile.upsert({
      where: { id: session.user.id },
      create: { id: session.user.id, totalXp: amount },
      update: { totalXp: { increment: amount } },
    }),
  ]);

  // Update daily activity
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.dailyActivity.upsert({
    where: { userId_activityDate: { userId: session.user.id, activityDate: today } },
    create: {
      userId: session.user.id,
      activityDate: today,
      xpEarned: amount,
      minutesPracticed: 0,
      lessonsCompleted: 0,
      challengesCompleted: 1,
    },
    update: {
      xpEarned: { increment: amount },
      challengesCompleted: { increment: 1 },
    },
  });

  // Check achievements
  await checkAndUnlockAchievements(session.user.id);

  return { awarded: true, amount, newTotal: profile.totalXp };
}

export async function completeLessonWithXP(lessonId: string, courseId: string, xpReward: number, hintCount = 0) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");
  if (
    session.user.role !== "admin" &&
    (await isProCourse(courseId)) &&
    !(await getSubscriptionStatus(session.user.id)).isSubscribed
  ) {
    throw new Error("This chapter needs Pro");
  }

  const idempotencyKey = generateXpKey(session.user.id, "lesson_complete", lessonId);
  const alreadyAwarded = await prisma.xpTransaction.findUnique({ where: { idempotencyKey } });

  await ensureLessonRows(lessonId);

  // Update lesson progress
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: {
      userId: session.user.id,
      lessonId,
      courseId,
      status: "completed",
      completedAt: new Date(),
      attempts: 1,
    },
    update: {
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  let xpAwarded = 0;
  if (!alreadyAwarded) {
    // Award XP (reduced if hints used)
    const finalXp = hintCount === 0 ? xpReward : Math.max(Math.floor(xpReward * 0.7), 5);

    await prisma.xpTransaction.create({
      data: {
        userId: session.user.id,
        amount: finalXp,
        reason: "lesson_complete",
        referenceId: lessonId,
        idempotencyKey,
      },
    });

    await prisma.userProfile.upsert({
      where: { id: session.user.id },
      create: { id: session.user.id, totalXp: finalXp },
      update: { totalXp: { increment: finalXp } },
    });

    // Update streak
    await updateStreak(session.user.id);

    // Update daily activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.dailyActivity.upsert({
      where: { userId_activityDate: { userId: session.user.id, activityDate: today } },
      create: {
        userId: session.user.id,
        activityDate: today,
        xpEarned: finalXp,
        minutesPracticed: 5,
        lessonsCompleted: 1,
        challengesCompleted: 0,
      },
      update: {
        xpEarned: { increment: finalXp },
        minutesPracticed: { increment: 5 },
        lessonsCompleted: { increment: 1 },
      },
    });

    xpAwarded = finalXp;
  }

  // Check achievements
  await checkAndUnlockAchievements(session.user.id);

  // The roadmap, XP counters and quests all read from these; show the new state right away.
  revalidatePath("/dashboard", "layout");

  return { xpAwarded, alreadyCompleted: !!alreadyAwarded };
}

// ─── Streak Management ────────────────────────────────────────────────────────

async function updateStreak(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { id: userId } });
  if (!profile) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastActivity = profile.lastActivityDate;

  let currentStreak = profile.currentStreak;

  if (!lastActivity) {
    currentStreak = 1;
  } else {
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already recorded today, no change
    } else if (diffDays === 1) {
      // Consecutive day
      currentStreak = profile.currentStreak + 1;
    } else {
      // Streak broken
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(profile.longestStreak, currentStreak);

  await prisma.userProfile.update({
    where: { id: userId },
    data: { currentStreak, longestStreak, lastActivityDate: today },
  });
}

// ─── Achievements ──────────────────────────────────────────────────────────────

async function checkAndUnlockAchievements(userId: string) {
  const [profile, progress, completions, userAchievements] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: userId } }),
    prisma.lessonProgress.findMany({ where: { userId, status: { in: ["completed", "mastered"] } } }),
    // Challenges award XP with this reason; older daily-challenge completions count too.
    prisma.xpTransaction
      .count({ where: { userId, reason: "challenge_complete" } })
      .then(async (n) => n + (await prisma.dailyChallengeCompletion.count({ where: { userId } }))),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievement: { select: { slug: true } } } }),
  ]);

  if (!profile) return;

  const unlockedSlugs = userAchievements.map(ua => ua.achievement.slug);
  const completedCourseIds = getCompletedCourseIds(progress.map(p => p.lessonId));

  // Count perfect lessons (no hints - tracked separately for now, approximated)
  const perfectLessons = progress.filter(p => p.score === 100).length;

  const toUnlock = checkAchievements({
    lessonsCompleted: progress.length,
    currentStreak: profile.currentStreak,
    totalXp: profile.totalXp,
    completedCourseIds,
    completedDailyChallenges: completions,
    perfectLessons,
    unlockedSlugs,
  });

  for (const achievement of toUnlock) {
    // Find or create achievement record
    let dbAchievement = await prisma.achievement.findUnique({
      where: { slug: achievement.slug },
    });

    if (!dbAchievement) {
      dbAchievement = await prisma.achievement.create({
        data: {
          slug: achievement.slug,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          xpReward: achievement.xpReward,
          criteria: achievement.criteria as object,
        },
      });
    }

    // Award achievement (if not already awarded)
    await prisma.userAchievement.createMany({
      data: [{ userId, achievementId: dbAchievement.id }],
      skipDuplicates: true,
    });

    // Award bonus XP for achievement
    if (achievement.xpReward > 0) {
      const achievementXpKey = generateXpKey(userId, "achievement", achievement.slug);
      await prisma.xpTransaction.createMany({
        data: [{
          userId,
          amount: achievement.xpReward,
          reason: "achievement",
          referenceId: achievement.slug,
          idempotencyKey: achievementXpKey,
        }],
        skipDuplicates: true,
      });
      await prisma.userProfile.update({
        where: { id: userId },
        data: { totalXp: { increment: achievement.xpReward } },
      });
    }
  }

  return toUnlock;
}

/** Chapters whose every lesson is among the completed lesson ids. */
function getCompletedCourseIds(completedLessonIds: string[]): string[] {
  const allLessons = getAllLessons();
  const completedSet = new Set(completedLessonIds);
  const completedCourses: string[] = [];

  // For each unique course, check if all its lessons are completed
  const uniqueCourses = [...new Set(allLessons.map(l => l.courseId))];
  for (const courseId of uniqueCourses) {
    const courseLessons = allLessons.filter(l => l.courseId === courseId);
    if (courseLessons.every(l => completedSet.has(l.id))) {
      completedCourses.push(courseId);
    }
  }
  return completedCourses;
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [profile, progress, todayActivity, recentAchievements] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: session.user.id } }),
    prisma.lessonProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.dailyActivity.findUnique({
      where: { userId_activityDate: { userId: session.user.id, activityDate: today } },
    }),
    prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
      take: 5,
    }),
  ]);

  const allLessons = getAllLessons();
  const completedLessons = progress.filter(p => p.status === "completed" || p.status === "mastered");
  const inProgressLesson = progress.find(p => p.status === "in_progress");
  const nextLesson = inProgressLesson
    ? allLessons.find(l => l.id === inProgressLesson.lessonId)
    : allLessons.find(l => !progress.some(p => p.lessonId === l.id && (p.status === "completed" || p.status === "mastered")));

  return {
    profile,
    totalXp: profile?.totalXp ?? 0,
    currentStreak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    lessonsCompleted: completedLessons.length,
    todayXp: todayActivity?.xpEarned ?? 0,
    todayMinutes: todayActivity?.minutesPracticed ?? 0,
    dailyGoalMinutes: profile?.dailyGoalMinutes ?? 10,
    nextLesson,
    recentAchievements: recentAchievements.map(ua => ({
      ...ua.achievement,
      unlockedAt: ua.unlockedAt.toISOString(),
    })),
    lessonProgress: progress,
  };
}

type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  isCurrentUser: boolean;
  /** An admin-made rival, not a real learner. Always shown with a "Rival" badge. */
  isRival: boolean;
};

export async function getLeaderboard(period: "weekly" | "alltime" = "weekly"): Promise<LeaderboardEntry[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  // Real learners
  let real: Omit<LeaderboardEntry, "rank">[];
  if (period === "weekly") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activities = await prisma.dailyActivity.groupBy({
      by: ["userId"],
      where: { activityDate: { gte: weekAgo } },
      _sum: { xpEarned: true },
      orderBy: { _sum: { xpEarned: "desc" } },
      take: 50,
    });

    const userIds = activities.map(a => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });

    real = activities.map((a) => {
      const user = users.find(u => u.id === a.userId);
      return {
        userId: a.userId,
        displayName: user?.name ?? "Anonymous",
        avatarUrl: user?.image ?? null,
        xp: a._sum.xpEarned ?? 0,
        isCurrentUser: a.userId === session.user.id,
        isRival: false,
      };
    });
  } else {
    const profiles = await prisma.userProfile.findMany({
      orderBy: { totalXp: "desc" },
      take: 50,
    });

    const userIds = profiles.map(p => p.id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });

    real = profiles.map((p) => {
      const user = users.find(u => u.id === p.id);
      return {
        userId: p.id,
        displayName: user?.name ?? "Anonymous",
        avatarUrl: user?.image ?? null,
        xp: p.totalXp,
        isCurrentUser: p.id === session.user.id,
        isRival: false,
      };
    });
  }

  // Admin-made rivals (none if the table hasn't been created yet)
  const rivals = await prisma.rival
    .findMany({ where: { active: true }, take: 50 })
    .catch(() => []);
  const rivalEntries = rivals.map((r) => ({
    userId: `rival:${r.id}`,
    displayName: r.name,
    avatarUrl: r.avatarUrl,
    xp: period === "weekly" ? r.weeklyXp : r.totalXp,
    isCurrentUser: false,
    isRival: true,
  }));

  return [...real, ...rivalEntries]
    .filter((e) => e.xp > 0 || !e.isRival)
    // On a tie, real learners rank above rivals
    .sort((a, b) => b.xp - a.xp || Number(a.isRival) - Number(b.isRival))
    .slice(0, 50)
    .map((e, idx) => ({ ...e, rank: idx + 1 }));
}

export async function recordChallengeAttempt(data: {
  lessonId: string;
  challengeId: string;
  isCorrect: boolean;
  hintCount?: number;
  attemptNumber?: number;
  durationSeconds?: number;
  userAnswer?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");

  await ensureLessonRows(data.lessonId);
  await prisma.challengeAttempt.create({
    data: {
      userId: session.user.id,
      lessonId: data.lessonId,
      challengeId: data.challengeId,
      isCorrect: data.isCorrect,
      hintCount: data.hintCount ?? 0,
      attemptNumber: data.attemptNumber ?? 1,
      durationSeconds: data.durationSeconds,
      userAnswer: data.userAnswer,
    },
  });
}

export async function getUserAchievements() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });

  // Merge with all achievements to show locked ones too
  return ACHIEVEMENTS.map(ach => {
    const unlocked = userAchievements.find(ua => ua.achievement.slug === ach.slug);
    return {
      ...ach,
      unlockedAt: unlocked?.unlockedAt.toISOString() ?? null,
    };
  });
}

// ─── Challenges ────────────────────────────────────────────────────────────────

/** Ids of the challenges this learner has finished (each pays XP once). */
export async function getCompletedChallengeIds(): Promise<string[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  const rows = await prisma.xpTransaction.findMany({
    where: { userId: session.user.id, reason: "challenge_complete" },
    select: { referenceId: true },
  });
  return rows.flatMap((r) => (r.referenceId ? [r.referenceId] : []));
}

/** Award a finished challenge's XP. The amount comes from the challenge data, not the client. */
export async function completeChallenge(challengeId: string) {
  const challenge = Object.values(CHALLENGES).flat().find((c) => c.id === challengeId);
  if (!challenge) throw new Error(`Unknown challenge: ${challengeId}`);
  const res = await awardXP(challenge.xpReward, "challenge_complete", challengeId);
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) await checkAndUnlockAchievements(session.user.id);
  revalidatePath("/dashboard", "layout");
  return { xpAwarded: res.awarded ? res.amount : 0, alreadyCompleted: !res.awarded };
}
