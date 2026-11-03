import { COURSES } from "@/data/lessons";
import type { LessonDifficulty } from "@/types/excel-learning";

/** Every lesson in course order, with its chapter's level. */
const LESSON_LEVELS: LessonDifficulty[] = COURSES.flatMap((c) => c.lessons.map(() => c.difficulty));

/**
 * A learner's level from how many lessons they've finished: the level of the chapter
 * they're working through (lessons unlock in order). Finishing everything counts as advanced.
 */
export function levelFromCompleted(completed: number): LessonDifficulty {
  if (LESSON_LEVELS.length === 0) return "beginner";
  const i = Math.min(Math.max(0, completed), LESSON_LEVELS.length - 1);
  return LESSON_LEVELS[i]!;
}

/**
 * The streak as it stands today. The stored streak only resets when the learner is next
 * active, so a streak whose last day was before yesterday has really ended.
 */
export function liveStreak(currentStreak: number, lastActivityDate: Date | null, now = new Date()): number {
  if (!lastActivityDate || currentStreak <= 0) return 0;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastActivityDate);
  last.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - last.getTime()) / 86_400_000);
  return days <= 1 ? currentStreak : 0;
}
