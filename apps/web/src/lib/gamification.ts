/**
 * Gamification utilities: XP levels, streaks, achievements.
 */

export interface Level {
  level: number;
  minXp: number;
  maxXp: number;
  title: string;
}

// XP required per level (exponential curve)
const LEVELS: Level[] = [
  { level: 1, minXp: 0, maxXp: 100, title: "Spreadsheet Novice" },
  { level: 2, minXp: 100, maxXp: 250, title: "Data Explorer" },
  { level: 3, minXp: 250, maxXp: 500, title: "Formula Apprentice" },
  { level: 4, minXp: 500, maxXp: 900, title: "Formula Practitioner" },
  { level: 5, minXp: 900, maxXp: 1500, title: "Spreadsheet Analyst" },
  { level: 6, minXp: 1500, maxXp: 2500, title: "Data Wizard" },
  { level: 7, minXp: 2500, maxXp: 4000, title: "Formula Expert" },
  { level: 8, minXp: 4000, maxXp: 6000, title: "Spreadsheet Master" },
  { level: 9, minXp: 6000, maxXp: 9000, title: "Excel Champion" },
  { level: 10, minXp: 9000, maxXp: Infinity, title: "Spreadsheet Legend" },
];

export function getLevelInfo(totalXp: number): {
  level: Level;
  xpProgress: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  const level = LEVELS.find(l => totalXp >= l.minXp && totalXp < l.maxXp) ?? LEVELS[LEVELS.length - 1]!;
  const xpProgress = totalXp - level.minXp;
  const xpForNextLevel = level.maxXp === Infinity ? 0 : level.maxXp - level.minXp;
  const progressPercent = xpForNextLevel === 0 ? 100 : Math.min(100, Math.round((xpProgress / xpForNextLevel) * 100));
  return { level, xpProgress, xpForNextLevel, progressPercent };
}

export function getLevelFromXp(totalXp: number): Level {
  return LEVELS.find(l => totalXp >= l.minXp && totalXp < l.maxXp) ?? LEVELS[LEVELS.length - 1]!;
}

export function getNextLevelXp(totalXp: number): Level | null {
  const currentIdx = LEVELS.findIndex(l => totalXp >= l.minXp && totalXp < l.maxXp);
  if (currentIdx === -1 || currentIdx >= LEVELS.length - 1) return null;
  return LEVELS[currentIdx + 1] ?? null;
}

export interface AchievementDef {
  slug: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  criteria: {
    type: "lessons_completed" | "streak" | "xp_total" | "course_completed" | "first_lesson" | "daily_challenge" | "perfect_lesson";
    value: number;
    courseId?: string;
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    slug: "first-lesson",
    title: "First Step",
    description: "Complete your first lesson",
    icon: "🎯",
    xpReward: 25,
    criteria: { type: "first_lesson", value: 1 },
  },
  {
    slug: "five-lessons",
    title: "Getting Started",
    description: "Complete 5 lessons",
    icon: "📚",
    xpReward: 50,
    criteria: { type: "lessons_completed", value: 5 },
  },
  {
    slug: "ten-lessons",
    title: "On a Roll",
    description: "Complete 10 lessons",
    icon: "🔥",
    xpReward: 100,
    criteria: { type: "lessons_completed", value: 10 },
  },
  {
    slug: "twenty-lessons",
    title: "Excel Devotee",
    description: "Complete 20 lessons",
    icon: "⭐",
    xpReward: 200,
    criteria: { type: "lessons_completed", value: 20 },
  },
  {
    slug: "three-day-streak",
    title: "Consistent",
    description: "Maintain a 3-day learning streak",
    icon: "📅",
    xpReward: 50,
    criteria: { type: "streak", value: 3 },
  },
  {
    slug: "seven-day-streak",
    title: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    icon: "🗓️",
    xpReward: 150,
    criteria: { type: "streak", value: 7 },
  },
  {
    slug: "thirty-day-streak",
    title: "Unstoppable",
    description: "Maintain a 30-day learning streak",
    icon: "🏆",
    xpReward: 500,
    criteria: { type: "streak", value: 30 },
  },
  {
    slug: "formula-beginner",
    title: "Formula Beginner",
    description: "Complete the Core Formulas chapter",
    icon: "➕",
    xpReward: 100,
    criteria: { type: "course_completed", value: 1, courseId: "b3" },
  },
  {
    slug: "lookup-specialist",
    title: "Lookup Specialist",
    description: "Complete the Lookup Functions chapter",
    icon: "🔍",
    xpReward: 150,
    criteria: { type: "course_completed", value: 1, courseId: "i3" },
  },
  {
    slug: "daily-challenge",
    title: "Daily Devotion",
    description: "Complete your first challenge",
    icon: "☀️",
    xpReward: 30,
    criteria: { type: "daily_challenge", value: 1 },
  },
  {
    slug: "perfect-lesson",
    title: "Perfectionist",
    description: "Complete a lesson without using any hints",
    icon: "💎",
    xpReward: 50,
    criteria: { type: "perfect_lesson", value: 1 },
  },
  {
    slug: "xp-500",
    title: "XP Hunter",
    description: "Earn 500 total XP",
    icon: "✨",
    xpReward: 50,
    criteria: { type: "xp_total", value: 500 },
  },
  {
    slug: "xp-1000",
    title: "XP Master",
    description: "Earn 1,000 total XP",
    icon: "💫",
    xpReward: 100,
    criteria: { type: "xp_total", value: 1000 },
  },
];

/** Check which achievements should be unlocked for a user */
export function checkAchievements(stats: {
  lessonsCompleted: number;
  currentStreak: number;
  totalXp: number;
  completedCourseIds: string[];
  completedDailyChallenges: number;
  perfectLessons: number;
  unlockedSlugs: string[];
}): AchievementDef[] {
  const newlyUnlocked: AchievementDef[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (stats.unlockedSlugs.includes(achievement.slug)) continue;

    const { type, value, courseId } = achievement.criteria;
    let unlocked = false;

    switch (type) {
      case "first_lesson":
        unlocked = stats.lessonsCompleted >= 1;
        break;
      case "lessons_completed":
        unlocked = stats.lessonsCompleted >= value;
        break;
      case "streak":
        unlocked = stats.currentStreak >= value;
        break;
      case "xp_total":
        unlocked = stats.totalXp >= value;
        break;
      case "course_completed":
        unlocked = courseId ? stats.completedCourseIds.includes(courseId) : false;
        break;
      case "daily_challenge":
        unlocked = stats.completedDailyChallenges >= value;
        break;
      case "perfect_lesson":
        unlocked = stats.perfectLessons >= value;
        break;
    }

    if (unlocked) newlyUnlocked.push(achievement);
  }

  return newlyUnlocked;
}

/** Calculate current streak from an array of activity dates (ISO date strings) */
export function calculateStreak(activityDates: string[]): { current: number; longest: number } {
  if (activityDates.length === 0) return { current: 0, longest: 0 };

  const today = new Date();

  const dates = [...new Set(activityDates.map(d => d.slice(0, 10)))].sort().reverse();

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  // Check if today or yesterday has activity (streak is still alive)
  const mostRecent = dates[0];
  if (!mostRecent) return { current: 0, longest: 0 };

  const mostRecentDate = new Date(mostRecent + "T00:00:00Z");
  const diff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));

  // If last activity was more than 1 day ago, streak is broken
  if (diff > 1) return { current: 0, longest: 0 };

  for (const dateStr of dates) {
    const date = new Date(dateStr + "T00:00:00Z");
    if (!prevDate) {
      streak = 1;
    } else {
      const dayDiff = Math.round((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) {
        streak++;
      } else {
        longest = Math.max(longest, streak);
        streak = 1;
      }
    }
    prevDate = date;
  }

  current = streak;
  longest = Math.max(longest, streak);

  return { current, longest };
}

/** Generate an idempotency key for XP transactions */
export function generateXpKey(userId: string, reason: string, referenceId: string): string {
  return `${userId}:${reason}:${referenceId}`;
}

/** Daily goal progress (0-100) */
export function calculateDailyProgress(minutesToday: number, dailyGoalMinutes: number): number {
  return Math.min(100, Math.round((minutesToday / Math.max(1, dailyGoalMinutes)) * 100));
}
