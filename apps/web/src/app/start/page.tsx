import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@Batman/auth";
import { ExcelDashboardShell } from "@/components/excel-dashboard-shell";
import { LearningPath } from "@/components/learning-path";
import { getGuestLesson } from "@/lib/actions/guest";
import { GUEST_COOKIE } from "@/lib/guest-progress";
import { getChapterSettings, visibleCourses } from "@/lib/pro-access";

export const metadata: Metadata = {
  title: "Start learning Excel free | Excelio",
  description: "See the full Excel path and start your first hands-on lesson right now, no account needed.",
};

const SIGNUP = "/signup?claim=1";

/** The Learn page for visitors without an account. The first lesson is free to play; everything after it asks them to sign up. */
export default async function StartPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (session?.user) redirect("/dashboard");

  const [guest, courses, chapterAccess, cookieStore] = await Promise.all([
    getGuestLesson(),
    visibleCourses(),
    getChapterSettings(),
    cookies(),
  ]);
  if (!guest) notFound();

  // Back after finishing the free lesson: it's done, and the next step is an account.
  const finished = decodeURIComponent(cookieStore.get(GUEST_COOKIE)?.value ?? "").split(":")[0] === guest.lesson.id;
  const doneIds = new Set(finished ? [guest.lesson.id] : []);
  const currentId = courses.flatMap((c) => c.lessons).find((l) => !doneIds.has(l.id))?.id;

  return (
    <ExcelDashboardShell>
      <div className="space-y-4">
        <LearningPath
          courses={courses}
          doneIds={doneIds}
          currentId={currentId}
          chapterAccess={chapterAccess}
          pro={false}
          lessonHref={(_course, lessonId) => (lessonId === guest.lesson.id ? "/try" : SIGNUP)}
          guidebookHref={() => SIGNUP}
          startLabel={finished ? "Create account to continue" : "Start your lesson"}
          bigStart
        />
      </div>
    </ExcelDashboardShell>
  );
}
