import { notFound, redirect } from "next/navigation";
import { COURSES, getCourseById } from "@/data/lessons";
import { LessonWorkspace } from "@/components/learning/lesson-workspace";
import { getLessonProgress } from "@/lib/actions/excel-learning";
import { getDashboardStatsCached } from "@/lib/request-cache";
import { getChapterSettings, getProProducts, hasPro, isAdmin, isProCourse } from "@/lib/pro-access";
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
  // Start every lookup at once; the page only waits for the slowest one.
  const lessonKey = course?.lessons.find((l) => l.id === lessonId || l.slug === lessonId)?.id;
  const [chapterSettings, admin, stats, needsPro, pro, progress] = await Promise.all([
    getChapterSettings(),
    isAdmin(),
    getDashboardStatsCached().catch(() => null),
    course ? isProCourse(course.id) : Promise.resolve(false),
    hasPro(),
    lessonKey ? getLessonProgress(lessonKey).catch(() => null) : Promise.resolve(null),
  ]);
  // Admins can open anything (hidden chapters, any lesson order, Pro chapters) to try it.
  if (!course || (chapterSettings[course.id]?.hidden && !admin)) {
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
  const doneIds = new Set(
    (stats?.lessonProgress ?? [])
      .filter((p) => p.status === "completed" || p.status === "mastered")
      .map((p) => p.lessonId)
  );
  const nextId = COURSES.filter((c) => !chapterSettings[c.id]?.hidden)
    .flatMap((c) => c.lessons)
    .find((l) => !doneIds.has(l.id))?.id;
  if (!admin && !doneIds.has(lesson.id) && lesson.id !== nextId) {
    redirect("/dashboard");
  }

  // Chapter 3 onwards needs Pro: learners who reach it are shown the paywall instead.
  if (!admin && needsPro && !pro) {
    return <Paywall products={await getProProducts()} />;
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
