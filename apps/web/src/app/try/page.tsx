import type { Metadata } from "next";
import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { LessonWorkspace } from "@/components/learning/lesson-workspace";
import { getGuestLesson } from "@/lib/actions/guest";

export const metadata: Metadata = {
  title: "Try your first Excel lesson free | Excelio",
  description: "Start learning Excel right now, no account needed. A hands-on lesson in a real spreadsheet.",
};

/** The first lesson, playable without an account. Signing up at the end claims the XP. */
export default async function TryPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (session?.user) redirect("/dashboard");

  const guest = await getGuestLesson();
  if (!guest) notFound();

  return (
    <div className="min-h-screen bg-background font-apple text-foreground">
      <LessonWorkspace lesson={guest.lesson} course={guest.course} guest />
    </div>
  );
}
