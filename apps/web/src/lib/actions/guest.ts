"use server";

import { requireAuth } from "@/lib/auth-guards";
import { visibleCourses } from "@/lib/pro-access";
import { completeLessonWithXP } from "@/lib/actions/excel-learning";

/** The lesson people can try before signing up: the first lesson of the first chapter shown. */
export async function getGuestLesson() {
  const course = (await visibleCourses())[0];
  const lesson = course?.lessons[0];
  return course && lesson ? { course, lesson } : null;
}

/**
 * Give a newly signed-in learner the lesson they finished as a guest. Only the guest lesson
 * can be claimed, and the XP comes from the lesson itself, not from the browser.
 */
export async function claimGuestLesson(lessonId: string, hintCount: number): Promise<{ xpAwarded: number; lessonTitle: string } | null> {
  await requireAuth();
  const guest = await getGuestLesson();
  if (!guest || guest.lesson.id !== lessonId) return null;
  const hints = Math.max(0, Math.min(10, Math.floor(hintCount) || 0));
  const result = await completeLessonWithXP(guest.lesson.id, guest.course.id, guest.lesson.xpReward, hints);
  return { xpAwarded: result?.xpAwarded ?? 0, lessonTitle: guest.lesson.title };
}
