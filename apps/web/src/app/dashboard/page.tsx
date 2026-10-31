import type { CSSProperties } from "react";
import Link from "next/link";
import {
  Tick02Icon as Check,
  LockIcon as Lock,
  StarIcon as Star,
  Clock01Icon as Clock,
  FlashIcon as Zap,
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
  Book02Icon as Guidebook,
  CrownIcon as Crown,
} from "@hugeicons/react";
import { getDashboardStats } from "@/lib/actions/excel-learning";
import { getChapterSettings, hasPro } from "@/lib/pro-access";
import { getMyTestimonial } from "@/lib/actions/testimonials";
import { claimGuestFromCookie } from "@/lib/guest-claim";
import { GuestClaim } from "@/components/guest-claim";
import { COURSES } from "@/data/lessons";
import { pressable } from "@/components/game-ui";
import { Mascot } from "@/components/mascot";
import { cn } from "@/lib/utils";
import type { CourseData } from "@/types/excel-learning";
import { ScrollIntoView } from "./scroll-into-view";

type LessonState = "done" | "current" | "locked";
type ChapterState = "done" | "current" | "locked";

/** Lessons finished before we ask for a review. */
const REVIEW_AFTER_LESSONS = 5;

const DIFFICULTY_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export default async function DashboardPage() {
  // A lesson finished as a guest is saved before anything else, so it shows as done.
  const claimed = await claimGuestFromCookie();
  const [stats, pro, review, chapterAccess] = await Promise.all([
    getDashboardStats(),
    hasPro(),
    getMyTestimonial().catch(() => null),
    getChapterSettings(),
  ]);
  // Chapters the founder has hidden are left out entirely, including from the lesson order.
  const courses = COURSES.filter((c) => !chapterAccess[c.id]?.hidden);

  const doneIds = new Set(
    (stats?.lessonProgress ?? [])
      .filter((p) => p.status === "completed" || p.status === "mastered")
      .map((p) => p.lessonId)
  );

  // Lessons unlock strictly in order: the first unfinished one is playable,
  // everything after it is locked until the one before is done.
  const currentId = courses.flatMap((c) => c.lessons).find((l) => !doneIds.has(l.id))?.id;
  const lessonState = (lessonId: string): LessonState =>
    doneIds.has(lessonId) ? "done" : lessonId === currentId ? "current" : "locked";

  const chapterState = (course: CourseData): ChapterState => {
    if (course.lessons.every((l) => doneIds.has(l.id))) return "done";
    return course.lessons.some((l) => l.id === currentId) ? "current" : "locked";
  };

  const currentChapter = courses.find((c) => chapterState(c) === "current");
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

      {courses.map((course, i) => {
        const state = chapterState(course);

        if (state === "current") {
          return (
            <section key={course.id} id={course.id} className="scroll-mt-6 pb-6" style={chapterColour(i)}>
              <ChapterBanner course={course} index={i} state={state} pro={!pro && chapterAccess[course.id]?.access === "pro"} />
              <LessonList course={course} lessonState={lessonState} className="mt-8 px-2" />
            </section>
          );
        }

        if (state === "done") {
          // Finished chapters fold away; open one to review its lessons.
          return (
            <details key={course.id} id={course.id} className="group" style={chapterColour(i)}>
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <ChapterBanner course={course} index={i} state={state} pro={!pro && chapterAccess[course.id]?.access === "pro"} />
              </summary>
              <LessonList course={course} lessonState={lessonState} className="mt-6 px-2 pb-4" />
            </details>
          );
        }

        // Locked chapters are shown so learners see what's ahead, but can't be opened.
        return <ChapterBanner key={course.id} course={course} index={i} state={state} pro={!pro && chapterAccess[course.id]?.access === "pro"} />;
      })}
    </div>
  );
}

/** `pro`: the chapter needs Pro and the learner doesn't have it, so it gets a Pro chip. */
function ChapterBanner({ course, index, state, pro }: { course: CourseData; index: number; state: ChapterState; pro: boolean }) {
  const locked = state === "locked";
  return (
    <div
      id={locked ? course.id : undefined}
      className={cn(
        "relative flex justify-between gap-4 overflow-hidden rounded-2xl px-6",
        state === "current" ? "min-h-52 items-end pb-8 pt-16" : "items-center py-5",
        locked
          ? "bg-muted text-muted-foreground"
          : // The outline keeps the banner's edge visible where the white sheet art reaches the corner.
              "bg-brand text-brand-foreground after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-2xl after:border-2 after:border-brand dark:after:hidden"
      )}
    >
      {state === "current" && (
        <>
          {/* faint spreadsheet grid across the banner */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_28px] [mask-image:linear-gradient(to_left,black,transparent_75%)]"
          />
          <SheetArt formula={course.formula ?? "=SUM(B2:B4)"} />
        </>
      )}
      <div className="relative min-w-0">
        <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide opacity-80">
          {locked ? <Lock className="h-4 w-4" /> : state === "done" ? <Check className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          Chapter {index + 1}, {state === "done" ? "Completed" : DIFFICULTY_LABEL[course.difficulty]}
          {pro && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#7c3aed] px-2 py-0.5 text-[11px] font-bold normal-case tracking-normal text-white opacity-100">
              <Crown className="h-3 w-3" /> Pro
            </span>
          )}
        </p>
        <h2 className={cn("mt-1 truncate font-bold", state === "current" ? "text-2xl" : "text-xl")}>{course.title}</h2>
      </div>
      <Link
        href={`/dashboard/learn#${course.id}` as never}
        className={cn(
          "relative flex shrink-0 items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all active:scale-[0.97]",
          locked
            ? "border-border bg-card/70 hover:bg-card"
            : "border-white/25 bg-brand-deep text-white shadow-[0_8px_20px_-6px_rgb(0_0_0/0.35)] hover:brightness-110"
        )}
      >
        <Guidebook className="h-5 w-5" />
        <span className="hidden sm:inline">Guidebook</span>
      </Link>
    </div>
  );
}

/**
 * Layered spreadsheet illustration for the current chapter's banner: a sheet in
 * 3D perspective with a faded sheet behind it and two floating cards, all
 * fading into the banner colour so it reads as backdrop, not content.
 */
function SheetArt({ formula }: { formula: string }) {
  const rows = [
    ["Product", "Sales", "Region"],
    ["Laptop", "1,200", "North"],
    ["Mouse", "45", "South"],
    ["Keyboard", "89", "East"],
    ["Monitor", "310", "West"],
  ];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] sm:block [mask-image:linear-gradient(to_left,black_55%,transparent),linear-gradient(to_top,transparent,black_35%)] [mask-composite:intersect] [-webkit-mask-composite:source-in]"
    >
      <div className="absolute -right-6 -top-6 [perspective:1000px]">
        {/* faded sheet behind, for depth */}
        <div className="absolute -right-10 -top-6 h-44 w-72 rounded-2xl bg-white/25 shadow-[0_20px_40px_-12px_rgb(0_0_0/0.25)] [transform:rotateY(-22deg)_rotateX(10deg)_rotate(-8deg)]" />

        {/* main sheet */}
        <div className="relative w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white text-[11px] text-slate-700 shadow-[0_30px_60px_-15px_rgb(0_0_0/0.45),0_8px_20px_-8px_rgb(0_0_0/0.25)] [transform:rotateY(-20deg)_rotateX(8deg)_rotate(-4deg)]">
          <div className="grid grid-cols-[22px_1fr_1fr_1fr]">
            {["", "A", "B", "C"].map((h) => (
              <span
                key={h}
                className="border-b border-r border-slate-100 bg-slate-50 py-1 text-center text-[10px] font-medium text-slate-400"
              >
                {h}
              </span>
            ))}
            {rows.map((row, r) => (
              <div key={r} className="contents">
                <span className="border-b border-r border-slate-100 bg-slate-50 py-1.5 text-center text-[10px] text-slate-400">
                  {r + 1}
                </span>
                {row.map((cell, c) => (
                  <span
                    key={c}
                    className={cn(
                      "truncate border-b border-r border-slate-100 px-2 py-1.5",
                      c === 1 && "text-right tabular-nums",
                      r === 0 && "font-semibold text-slate-800",
                      // the cell being worked on, selected like in Excel
                      r === 2 && c === 1 && "relative bg-brand-soft font-semibold text-brand outline outline-2 -outline-offset-2 outline-brand"
                    )}
                  >
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* floating formula pill */}
        <div className="absolute -bottom-5 -left-16 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] shadow-[0_16px_32px_-10px_rgb(0_0_0/0.4)] [transform:rotate(-4deg)]">
          <span className="font-serif font-bold italic text-brand">fx</span>
          <span className="max-w-40 truncate font-mono text-slate-700">{formula}</span>
        </div>

        {/* floating mini chart */}
        <div className="absolute -top-4 left-[-3.5rem] flex h-14 items-end gap-1 rounded-xl bg-white px-2.5 pb-2 pt-3 shadow-[0_16px_32px_-10px_rgb(0_0_0/0.4)] [transform:rotate(6deg)]">
          {[40, 70, 30, 90, 55].map((h, i) => (
            <span key={i} className="w-2 rounded-sm bg-brand" style={{ height: `${h}%`, opacity: 0.45 + i * 0.12 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Each chapter has its own colour. It's applied by overriding the brand tokens on
 * the chapter's wrapper, so the banner, lesson coins, connector and Start button
 * inside all pick it up.
 */
const CHAPTER_COLOURS = [
  { base: "#1d9a52", deep: "#0d6b37" }, // green
  { base: "#0d9488", deep: "#0b625b" }, // teal
  { base: "#0284c7", deep: "#075985" }, // blue
  { base: "#7c3aed", deep: "#5b21b6" }, // purple
  { base: "#ea580c", deep: "#9a3412" }, // orange
  { base: "#db2777", deep: "#9d174d" }, // pink
  { base: "#d97706", deep: "#92400e" }, // amber
];

function chapterColour(index: number): CSSProperties {
  const c = CHAPTER_COLOURS[index % CHAPTER_COLOURS.length]!;
  return {
    "--brand": c.base,
    "--brand-deep": c.deep,
    "--brand-soft": `color-mix(in oklab, ${c.base} 16%, var(--background))`,
  } as CSSProperties;
}

// 3D lesson coin: a solid face sitting on a darker base.
const COIN = 56;
const COIN_DEPTH = 6;

function LessonCoin({ state }: { state: LessonState }) {
  return (
    <span
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center rounded-full transition-transform",
        state === "locked"
          ? "bg-muted text-muted-foreground/60 shadow-[0_6px_0_var(--border)]"
          : "bg-brand text-brand-foreground shadow-[0_6px_0_var(--brand-deep)]",
        state !== "locked" && "group-hover/coin:-translate-y-0.5 group-active/coin:translate-y-1 group-active/coin:shadow-[0_2px_0_var(--brand-deep)]",
        // Current lesson gets a soft halo around the coin.
        state === "current" && "outline outline-[6px] outline-offset-[6px] outline-muted"
      )}
      style={{ width: COIN, height: COIN }}
    >
      {/* glossy highlight on the face */}
      {state !== "locked" && <span className="absolute inset-x-3 top-1.5 h-2 rounded-full bg-white/25" />}
      {state === "done" && <Check className="h-7 w-7" />}
      {state === "current" && <Star className="h-7 w-7" />}
      {state === "locked" && <Lock className="h-6 w-6" />}
    </span>
  );
}

function LessonList({
  course,
  lessonState,
  className,
}: {
  course: CourseData;
  lessonState: (lessonId: string) => LessonState;
  className?: string;
}) {
  return (
    <ol className={cn("relative", className)}>
      {course.lessons.map((lesson, i) => {
        const state = lessonState(lesson.id);
        const isLast = i === course.lessons.length - 1;
        const href = `/dashboard/learn/${course.id}/${lesson.id}`;
        return (
          <li key={lesson.id} className={cn("relative flex gap-5 pb-7 last:pb-0", state === "current" && "pt-10")}>
            {/* connector line to the next step */}
            {!isLast && (
              <span
                className={cn(
                  "absolute bottom-0 w-1 rounded-full",
                  state === "done" ? "bg-brand" : "bg-border"
                )}
                style={{ left: COIN / 2 - 2, top: (state === "current" ? 40 : 0) + COIN + COIN_DEPTH + 4 }}
              />
            )}

            {/* coin (+ START tag on the current lesson) */}
            <div className="relative shrink-0">
              {state === "current" && (
                <span className="absolute -top-11 left-1/2 flex -translate-x-1/2 flex-col items-center">
                  <span className="rounded-xl border-2 border-border bg-card px-3 py-1 text-sm font-bold uppercase tracking-wide text-brand">
                    Start
                  </span>
                  <span className="-mt-[6px] h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-border bg-card" />
                </span>
              )}
              {state === "locked" ? (
                <LessonCoin state={state} />
              ) : (
                <Link href={href as never} aria-label={lesson.title} className="group/coin block">
                  <LessonCoin state={state} />
                </Link>
              )}
            </div>

            {/* step content — only finished and current lessons can be opened */}
            {state === "current" ? (
              <div className="relative -mt-2 min-w-0 flex-1 rounded-2xl border-2 border-border bg-card p-5">
                {/* Gridley waves from the corner of the next lesson */}
                <Mascot mood={lesson.kind === "lesson" || !lesson.kind ? "wave" : "teach"} size={118} className="absolute -top-14 right-3 hidden sm:block" />
                <p className="text-xs font-semibold uppercase tracking-wide text-brand sm:pr-32">Up next</p>
                <p className="mt-1 text-lg font-semibold sm:pr-32">{lesson.title}</p>
                <p className="mt-1 text-[15px] text-muted-foreground sm:pr-32">{lesson.description}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {lesson.estimatedMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-4 w-4" /> +{lesson.xpReward} XP
                    </span>
                  </span>
                  <Link href={href as never} className={pressable("brand", "px-6")}>
                    Start
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : state === "done" ? (
              <Link
                href={href as never}
                className="group/row flex h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-3 transition-colors hover:bg-muted/60"
              >
                <span className="truncate text-[15px] font-medium">{lesson.title}</span>
                <span className="shrink-0 text-sm font-medium text-brand opacity-0 transition-opacity group-hover/row:opacity-100">
                  Review
                </span>
              </Link>
            ) : (
              <div aria-disabled className="flex h-14 min-w-0 flex-1 cursor-not-allowed items-center justify-between gap-3 px-3">
                <span className="truncate text-[15px] text-muted-foreground">{lesson.title}</span>
                <span className="shrink-0 text-sm text-muted-foreground/40">{lesson.estimatedMinutes} min</span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
