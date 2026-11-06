import Link from "next/link";
import { getDashboardStatsCached } from "@/lib/request-cache";
import { getChapterSettings, hasPro, isAdmin } from "@/lib/pro-access";
import { getMyTestimonial } from "@/lib/actions/testimonials";
import { claimGuestFromCookie } from "@/lib/guest-claim";
import { GuestClaim } from "@/components/guest-claim";
import { LearningPath } from "@/components/learning-path";
import { COURSES } from "@/data/lessons";
import { Mascot } from "@/components/mascot";
import { ScrollIntoView } from "./scroll-into-view";

/** Lessons finished before we ask for a review. */
const REVIEW_AFTER_LESSONS = 5;

export default async function DashboardPage() {
  // A lesson finished as a guest is saved before anything else, so it shows as done.
  const claimed = await claimGuestFromCookie();
  const [stats, pro, review, chapterAccess, admin] = await Promise.all([
    getDashboardStatsCached(),
    hasPro(),
    getMyTestimonial().catch(() => null),
    getChapterSettings(),
    isAdmin(),
  ]);
  // Chapters the founder has hidden are left out entirely, including from the lesson order.
  const visible = COURSES.filter((c) => !chapterAccess[c.id]?.hidden);
  // Admins also see hidden chapters, so they can try them before publishing.
  const courses = admin ? COURSES : visible;

  const doneIds = new Set(
    (stats?.lessonProgress ?? [])
      .filter((p) => p.status === "completed" || p.status === "mastered")
      .map((p) => p.lessonId)
  );

  // Lessons unlock strictly in order: the first unfinished one is playable,
  // everything after it is locked until the one before is done.
  const currentId = visible.flatMap((c) => c.lessons).find((l) => !doneIds.has(l.id))?.id;

  const currentChapter = courses.find((c) => c.lessons.some((l) => l.id === currentId));
  // Ask for a review once a learner has had a real taste of the course.
  const askForReview = !review && doneIds.size >= REVIEW_AFTER_LESSONS;

  return (
    <div className="space-y-4">
      <GuestClaim claimed={claimed} />
      {askForReview && (
        <Link
          href="/dashboard/review"
          className="group flex items-center gap-4 rounded-2xl border-2 border-b-[5px] border-border bg-card p-4 transition-colors hover:border-amber-500"
        >
          <Mascot mood="cheer" size={56} />
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Enjoying Excelio?</span>
            <span className="block text-[14px] text-muted-foreground">Leave a quick review. It helps other people start learning Excel.</span>
          </span>
          <span className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#b45309]">Write a review</span>
        </Link>
      )}

      {/* Land on the current chapter when a learner is deep into the course. */}
      {currentChapter && currentChapter !== courses[0] && <ScrollIntoView targetId={currentChapter.id} />}

      <LearningPath courses={courses} doneIds={doneIds} currentId={currentId} chapterAccess={chapterAccess} pro={pro} admin={admin} />
    </div>
  );
}
