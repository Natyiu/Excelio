import type { AchievementDef } from "@/lib/gamification";
import { COURSES } from "@/data/lessons";

export interface ProgressContext {
  lessonsCompleted: number;
  currentStreak: number;
  totalXp: number;
  doneLessonIds: Set<string>;
}

/** Live progress toward an achievement, or null when there's nothing to count. */
export function achievementProgress(a: AchievementDef, ctx: ProgressContext): { value: number; max: number } | null {
  const max = a.criteria.value;
  switch (a.criteria.type) {
    case "first_lesson":
    case "lessons_completed":
      return { value: ctx.lessonsCompleted, max };
    case "streak":
      return { value: ctx.currentStreak, max };
    case "xp_total":
      return { value: ctx.totalXp, max };
    case "course_completed": {
      const course = COURSES.find((c) => c.id === a.criteria.courseId);
      if (!course) return null;
      return { value: course.lessons.filter((l) => ctx.doneLessonIds.has(l.id)).length, max: course.lessons.length };
    }
    default:
      return null;
  }
}
