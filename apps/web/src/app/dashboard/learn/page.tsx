import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import Link from "next/link";
import prisma from "@Batman/db";
import {
  Tick02Icon as Check,
  LockIcon as Lock,
  StarIcon as Star,
  Clock01Icon as Clock,
  FlashIcon as Zap,
} from "@hugeicons/react";
import { COURSES as ALL_COURSES } from "@/data/lessons";
import { visibleCourses } from "@/lib/pro-access";
import { IconTile, PageHeader, Panel, ProgressBar, pressable } from "@/components/game-ui";
import { cn } from "@/lib/utils";

const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export default async function LearnRoadmapPage() {
  // Hidden chapters (Admin → Curriculum) aren't listed.
  const visible = new Set((await visibleCourses()).map((c) => c.id));
  const COURSES = ALL_COURSES.filter((c) => visible.has(c.id));
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Fetch all lesson progress for this user
  const progressList = session?.user
    ? await prisma.lessonProgress.findMany({
        where: { userId: session.user.id },
      })
    : [];

  const progressMap = new Map<string, string>();
  for (const p of progressList) {
    progressMap.set(p.lessonId, p.status);
  }
  const isDone = (lessonId: string) => {
    const s = progressMap.get(lessonId);
    return s === "completed" || s === "mastered";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Guidebook"
        description="Every chapter and lesson in the Excel path, from your first cell to Power Query."
      />

      {COURSES.map((course, cIdx) => {
        const doneCount = course.lessons.filter((l) => isDone(l.id)).length;
        const startsLevel = cIdx === 0 || COURSES[cIdx - 1]!.difficulty !== course.difficulty;
        const levelChapters = COURSES.filter((c) => c.difficulty === course.difficulty);

        return (
          <section key={course.id} id={course.id} className="scroll-mt-6">
            {startsLevel && (
              <div className="mb-4 mt-2">
                <h2 className="text-2xl font-bold">{LEVEL_LABEL[course.difficulty]}</h2>
                <p className="text-[15px] text-muted-foreground">
                  {levelChapters.length} chapters · {levelChapters.reduce((n, c) => n + c.lessons.length, 0)} lessons
                </p>
              </div>
            )}
            <Panel className="overflow-hidden">
              {/* Unit header */}
              <div className="border-b border-border p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Chapter {cIdx + 1} · {LEVEL_LABEL[course.difficulty]}
                </p>
                <h2 className="mt-1 text-xl font-bold">{course.title}</h2>
                <p className="mt-1 text-[15px] text-muted-foreground">{course.description}</p>
                <div className="mt-4 flex items-center gap-3">
                  <ProgressBar value={doneCount} max={course.lessons.length} className="flex-1" />
                  <span className="text-sm font-bold tabular-nums text-muted-foreground">
                    {doneCount}/{course.lessons.length}
                  </span>
                </div>
              </div>

              {/* Lessons */}
              <ul className="divide-y divide-border">
                {course.lessons.map((lesson, lIdx) => {
                  const completed = isDone(lesson.id);
                  const prev = course.lessons[lIdx - 1];
                  const available = lIdx === 0 || completed || (prev ? isDone(prev.id) : false);

                  return (
                    <li key={lesson.id} className="flex items-center gap-4 p-4">
                      <IconTile tone={completed || available ? "brand" : "muted"}>
                        {completed ? (
                          <Check className="h-6 w-6" />
                        ) : available ? (
                          <Star className="h-6 w-6" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </IconTile>

                      <div className="min-w-0 flex-1">
                        <p className={cn("flex items-center gap-2 font-bold", !available && "text-muted-foreground")}>
                          {lesson.title}
                          {lesson.kind && lesson.kind !== "lesson" && (
                            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">
                              {lesson.kind === "lab" ? "Lab" : "Capstone"}
                            </span>
                          )}
                        </p>
                        <p className="line-clamp-1 text-sm text-muted-foreground">{lesson.description}</p>
                        <p className="mt-1 flex items-center gap-3 text-xs font-bold text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {lesson.estimatedMinutes} min
                          </span>
                          <span className="flex items-center gap-1 text-brand">
                            <Zap className="h-3.5 w-3.5" /> +{lesson.xpReward} XP
                          </span>
                        </p>
                      </div>

                      {available && (
                        <Link
                          href={`/dashboard/learn/${course.id}/${lesson.id}`}
                          className={pressable(completed ? "outline" : "brand", "hidden px-4 py-2 sm:inline-flex")}
                        >
                          {completed ? "Review" : "Start"}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </section>
        );
      })}
    </div>
  );
}
