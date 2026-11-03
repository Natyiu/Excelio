/**
 * Realistic stats for an admin-made rival, worked out from the real curriculum: everything
 * up to a point in the chosen chapter counts as done, using each lesson's actual XP reward.
 */

export type Level = "beginner" | "intermediate" | "advanced";
export type EstimateChapter = { id: string; level: Level; lessonXp: number[] };
export type RivalEstimate = {
  currentChapter: string;
  lessonsCompleted: number;
  totalXp: number;
  weeklyXp: number;
  currentStreak: number;
};

const roundTo5 = (n: number) => Math.max(0, Math.round(n / 5) * 5);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * @param chapters every chapter in course order, with each lesson's XP reward
 * @param chapterId the chapter they're on; blank picks the first chapter of `level`
 * @param rand random source (0 ≤ r < 1), injectable for tests. Each call varies the
 *   numbers so several rivals at the same chapter don't look identical.
 */
export function estimateRival(
  chapters: EstimateChapter[],
  level: Level,
  chapterId: string,
  rand: () => number = Math.random
): RivalEstimate | null {
  const idx = chapterId
    ? chapters.findIndex((c) => c.id === chapterId)
    : chapters.findIndex((c) => c.level === level);
  const chapter = chapters[idx];
  if (!chapter) return null;

  // All earlier chapters are finished; they're part-way through this one (at least one lesson done overall).
  const before = chapters.slice(0, idx).flatMap((c) => c.lessonXp);
  let k = Math.floor(rand() * chapter.lessonXp.length);
  if (before.length + k === 0) k = 1;
  const done = [...before, ...chapter.lessonXp.slice(0, k)];
  const lessonXp = sum(done);

  // Challenges and achievements add roughly 5–25% on top of lesson XP.
  const totalXp = roundTo5(lessonXp * (1.05 + rand() * 0.2));

  // A typical week: 2–9 lessons at this chapter's average reward, plus a little extra.
  const avg = chapter.lessonXp.length ? sum(chapter.lessonXp) / chapter.lessonXp.length : 25;
  const lessonsThisWeek = 2 + Math.floor(rand() * 8);
  const weeklyXp = Math.min(totalXp, roundTo5(avg * lessonsThisWeek * (1 + rand() * 0.15)));

  // Streak: up to a month, never more days than lessons finished.
  const currentStreak = Math.max(1, Math.min(done.length, 1 + Math.floor(rand() * 30)));

  return { currentChapter: chapter.id, lessonsCompleted: done.length, totalXp, weeklyXp, currentStreak };
}
