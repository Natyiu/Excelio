import { notFound, redirect } from "next/navigation";
import { COURSES, getCourseById } from "@/data/lessons";
import { LessonWorkspace } from "@/components/learning/lesson-workspace";
import { getDashboardStats, getLessonProgress } from "@/lib/actions/excel-learning";
import { getChapterSettings, getProProducts, hasPro, isProCourse } from "@/lib/pro-access";
import { Paywall } from "@/components/paywall";

interface LessonPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;

  const course = getCourseById(courseId);
  const chapterSettings = await getChapterSettings();
  if (!course || chapterSettings[course.id]?.hidden) {
    notFound();
  }

  const lesson = course.lessons.find(
    (l) => l.id === lessonId || l.slug === lessonId
  );

  if (!lesson) {
    notFound();
  }

  // Lessons unlock in order: only finished lessons and the first unfinished
  // one can be opened. Anything further ahead sends the learner back.
  const stats = await getDashboardStats().catch(() => null);
  const doneIds = new Set(
    (stats?.lessonProgress ?? [])
      .filter((p) => p.status === "completed" || p.status === "mastered")
      .map((p) => p.lessonId)
  );
  const nextId = COURSES.filter((c) => !chapterSettings[c.id]?.hidden)
    .flatMap((c) => c.lessons)
    .find((l) => !doneIds.has(l.id))?.id;
  if (!doneIds.has(lesson.id) && lesson.id !== nextId) {
    redirect("/dashboard");
  }

  // Chapter 3 onwards needs Pro: learners who reach it are shown the paywall instead.
  if ((await isProCourse(course.id)) && !(await hasPro())) {
    return <Paywall products={await getProProducts()} />;
  }

  // Get user progress if logged in
  let progress = null;
  try {
    progress = await getLessonProgress(lesson.id);
  } catch {
    progress = null;
  }

  return (
    <LessonWorkspace
      lesson={lesson}
      course={course}
      initialChallengeIndex={progress?.currentChallengeIndex ?? 0}
      alreadyCompleted={doneIds.has(lesson.id)}
    />
  );
}
