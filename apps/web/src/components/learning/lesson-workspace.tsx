"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  LessonData,
  CourseData,
  Workbook,
  Challenge,
  WorksheetData,
} from "@/types/excel-learning";
import { GridTableIcon as GridIcon, Book02Icon as BookIcon } from "@hugeicons/react";
import { Spreadsheet } from "@/components/spreadsheet/spreadsheet";
import { parseCellRef } from "@/lib/formula-engine";
import { Confetti } from "@/components/ui/confetti";
import { Mascot, type MascotMood } from "@/components/mascot";
import { LessonNotes, NoteSlide, RichText, SheetPreview, parseNotes, slideBeats, slideHeading, slideLabel, toSlides } from "@/components/learning/lesson-notes";
import { validateChallenge } from "@/lib/validation-engine";
import {
  completeLessonWithXP,
  recordChallengeAttempt,
} from "@/lib/actions/excel-learning";
import { lessonXp, saveGuestLesson } from "@/lib/guest-progress";
import { Panel, ProgressBar, pressable } from "@/components/game-ui";
import { cn } from "@/lib/utils";

/**
 * Lessons only use a handful of cells, so show just those: shrink each sheet to
 * the data plus every cell the challenges point at, with one spare row and
 * column so it still reads as a spreadsheet rather than a table.
 */
function fitWorkbook(source: Workbook, challenges: Challenge[]): Workbook {
  const wb: Workbook = JSON.parse(JSON.stringify(source));
  const refs = challenges.flatMap((c) => [
    c.targetCell,
    ...(c.targetRange?.split(":") ?? []),
    ...c.validationRules.map((r) => r.targetCell),
  ]);
  for (const sheet of wb.sheets) {
    let maxCol = 2;
    let maxRow = 3;
    for (const id of [...Object.keys(sheet.cells), ...refs]) {
      const ref = id ? parseCellRef(id) : null;
      if (!ref) continue;
      maxCol = Math.max(maxCol, ref.col);
      maxRow = Math.max(maxRow, ref.row);
    }
    sheet.colCount = Math.min(sheet.colCount || 26, maxCol + 2);
    sheet.rowCount = Math.min(sheet.rowCount || 100, maxRow + 2);
  }
  return wb;
}

/** Render the light markdown used in lesson copy: **bold** and `code`. */
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

const CORRECT_TITLES = ["Nicely done!", "Nailed it!", "Spot on!", "You're a natural!", "Formula wizard!"];
const WRONG_TITLES = ["Not quite", "So close!", "Almost there", "Let's try that again"];

interface LessonWorkspaceProps {
  lesson: LessonData;
  course: CourseData;
  initialChallengeIndex?: number;
  /** The learner has finished this lesson before: replays don't earn XP again. */
  alreadyCompleted?: boolean;
  /** Play a challenge instead of a course lesson: its own completion, exits and wording. */
  challenge?: ChallengeMode;
  /** Not signed in: nothing is saved to the server; the finish screen asks them to sign up to claim the XP. */
  guest?: boolean;
}

export interface ChallengeMode {
  /** Award the challenge's XP (a bound server action). */
  complete: () => Promise<{ xpAwarded: number; alreadyCompleted: boolean }>;
  exitHref: string;
  nextHref?: string;
}

export function LessonWorkspace({
  lesson,
  course,
  initialChallengeIndex = 0,
  alreadyCompleted = false,
  challenge,
  guest = false,
}: LessonWorkspaceProps) {
  const router = useRouter();
  const exitHref = guest ? "/" : challenge?.exitHref ?? "/dashboard";

  // Lessons open on their notes; returning learners mid-lesson go straight to practice.
  const notes = lesson.content.conceptOverview;
  const [showNotes, setShowNotes] = useState(Boolean(notes) && initialChallengeIndex === 0);
  const slides = useMemo(() => toSlides(parseNotes(notes ?? "")), [notes]);
  // One slide per idea, then a final "ready" slide previewing the practice sheet.
  const slideCount = slides.length + 1;
  // A slide with a demo takes one Continue per demo step ("beat") before moving on.
  const [pos, setPos] = useState({ slide: 0, beat: 0 });
  const slide = pos.slide;
  const beatsOf = useCallback((i: number) => (i < slides.length ? slideBeats(slides[i]!) : 1), [slides]);
  const onLastSlide = slide >= slideCount - 1;
  // Every step of every slide, in order, for the segmented progress bar.
  const beatList = useMemo(
    () => Array.from({ length: slideCount }).flatMap((_, si) => Array.from({ length: beatsOf(si) }, (_, bi) => ({ slide: si, beat: bi }))),
    [slideCount, beatsOf]
  );
  const currentBeat = beatList.findIndex((b) => b.slide === pos.slide && b.beat === pos.beat);
  const nextSlide = useCallback(() => {
    if (pos.beat < beatsOf(pos.slide) - 1) setPos({ slide: pos.slide, beat: pos.beat + 1 });
    else if (pos.slide >= slideCount - 1) setShowNotes(false);
    else setPos({ slide: pos.slide + 1, beat: 0 });
  }, [pos, beatsOf, slideCount]);
  const prevSlide = useCallback(() => {
    if (pos.beat > 0) setPos({ slide: pos.slide, beat: pos.beat - 1 });
    else if (pos.slide > 0) setPos({ slide: pos.slide - 1, beat: beatsOf(pos.slide - 1) - 1 });
  }, [pos, beatsOf]);

  // Challenge navigation
  const [currentIdx, setCurrentIdx] = useState(
    Math.min(initialChallengeIndex, lesson.content.challenges.length - 1)
  );

  const currentChallenge: Challenge =
    lesson.content.challenges[currentIdx] ?? lesson.content.challenges[0]!;

  // Working workbook state (deep clone from lesson content)
  const [workbook, setWorkbook] = useState<Workbook>(() =>
    fitWorkbook(lesson.content.initialWorkbook, lesson.content.challenges)
  );
  // Latest workbook, updated synchronously. A cell edit is saved in the same
  // event that triggers a check (blur before Check, Enter before ⌘+Enter), so
  // checkAnswer must not read a workbook captured from an earlier render.
  const workbookRef = useRef(workbook);

  // Hints state
  const [unlockedHints, setUnlockedHints] = useState<number>(0);

  // Multiple choice selection state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Validation feedback state
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: "idle" | "correct" | "incorrect";
    message: string;
    details?: string;
  }>({ status: "idle", message: "" });

  // Celebration state
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  // What the server actually awarded; XP is only given the first time a lesson is finished.
  const [earnedXp, setEarnedXp] = useState(0);
  const [xpClaimed, setXpClaimed] = useState(alreadyCompleted);

  // Reset workbook to original initialWorkbook for this challenge
  const resetWorkbook = useCallback(() => {
    const fresh = fitWorkbook(lesson.content.initialWorkbook, lesson.content.challenges);
    workbookRef.current = fresh;
    setWorkbook(fresh);
    setFeedback({ status: "idle", message: "" });
  }, [lesson.content.initialWorkbook, lesson.content.challenges]);

  // Handle spreadsheet changes
  const handleWorkbookChange = useCallback((updated: Workbook) => {
    workbookRef.current = updated;
    setWorkbook(updated);
    if (feedback.status !== "idle") {
      setFeedback({ status: "idle", message: "" });
    }
  }, [feedback.status]);

  // Unlock next hint
  const unlockNextHint = useCallback(() => {
    if (unlockedHints < currentChallenge.hints.length) {
      setUnlockedHints((prev) => prev + 1);
    }
  }, [currentChallenge.hints.length, unlockedHints]);

  // Validate current challenge
  const checkAnswer = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);

    const latest = workbookRef.current;
    const activeSheet =
      latest.sheets.find((s) => s.id === latest.activeSheetId) || latest.sheets[0];
    const cells: WorksheetData = activeSheet?.cells || {};

    let isCorrect = false;
    let message = "";
    let details = "";

    // 1. Multiple Choice Question
    if (currentChallenge.type === "multiple_choice") {
      if (!selectedOptionId) {
        setFeedback({
          status: "incorrect",
          message: "Please choose an answer first.",
        });
        setIsChecking(false);
        return;
      }
      const option = currentChallenge.options?.find((o) => o.id === selectedOptionId);
      isCorrect = Boolean(option?.correct);
      message = isCorrect
        ? currentChallenge.successMessage || "Spot on! That's correct."
        : option?.explanation || "Not quite right. Review the explanation and try again.";
    }
    // 2. Spreadsheet-based Challenge (formula, cell_edit, etc.)
    else {
      const result = validateChallenge(currentChallenge.validationRules, cells);
      isCorrect = result.isCorrect;
      message = result.isCorrect
        ? currentChallenge.successMessage || "Excellent! Formula evaluated correctly."
        : result.message;
      details = result.details || "";
    }

    // Record attempt on server (course lessons only, and only for signed-in learners)
    if (!challenge && !guest) try {
      await recordChallengeAttempt({
        lessonId: lesson.id,
        challengeId: currentChallenge.id,
        isCorrect,
        hintCount: unlockedHints,
        userAnswer: currentChallenge.type === "multiple_choice" ? selectedOptionId || "" : undefined,
      });
    } catch (err) {
      // Non-blocking telemetry
      console.error("Could not record attempt", err);
    }

    if (isCorrect) {
      setFeedback({
        status: "correct",
        message,
        details,
      });
      setShowConfetti(true);

      // If last challenge in lesson, mark lesson complete!
      const isLastChallenge = currentIdx === lesson.content.challenges.length - 1;
      if (isLastChallenge) {
        if (guest) {
          // Keep it in the browser until they sign up and claim it.
          saveGuestLesson(lesson.id, unlockedHints);
          setEarnedXp(lessonXp(lesson.xpReward, unlockedHints));
        } else try {
          const res = challenge
            ? await challenge.complete()
            : await completeLessonWithXP(lesson.id, lesson.courseId, lesson.xpReward, unlockedHints);
          setEarnedXp(res?.xpAwarded ?? 0);
          setXpClaimed(Boolean(res?.alreadyCompleted));
        } catch (err) {
          // Keep the celebration, but don't hide why progress wasn't saved.
          console.error("Could not save lesson progress", err);
        }
      }
    } else {
      setFeedback({
        status: "incorrect",
        message,
        details,
      });
    }

    setIsChecking(false);
  }, [
    challenge,
    currentChallenge,
    currentIdx,
    isChecking,
    lesson,
    selectedOptionId,
    unlockedHints,
  ]);

  // After a wrong answer: clear the feedback and go back to the question as it was.
  // A wrong choice is unselected; a spreadsheet keeps the learner's work to fix.
  const tryAgain = useCallback(() => {
    setFeedback({ status: "idle", message: "" });
    if (currentChallenge.type === "multiple_choice") setSelectedOptionId(null);
  }, [currentChallenge.type]);

  // Proceed to next challenge
  const nextChallenge = useCallback(() => {
    if (currentIdx < lesson.content.challenges.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setUnlockedHints(0);
      setSelectedOptionId(null);
      setFeedback({ status: "idle", message: "" });
    }
  }, [currentIdx, lesson.content.challenges.length]);

  // Keyboard shortcut: Cmd+Enter / Ctrl+Enter to check answer
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (showNotes) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          setShowNotes(false);
        } else if (e.key === "ArrowRight" || e.key === "Enter") {
          e.preventDefault();
          nextSlide();
        } else if (e.key === "ArrowLeft") {
          prevSlide();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        // After a correct answer the shortcut moves on, same as the Continue button.
        if (feedback.status === "incorrect") tryAgain();
        else if (feedback.status !== "correct") checkAnswer();
        else if (currentIdx < lesson.content.challenges.length - 1) nextChallenge();
        else setIsLessonCompleted(true);
        return;
      }
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
      const option = currentChallenge.options?.[Number(e.key) - 1];
      if (!typing && currentChallenge.type === "multiple_choice" && option && feedback.status !== "correct") {
        setSelectedOptionId(option.id);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [checkAnswer, currentChallenge, currentIdx, feedback.status, lesson.content.challenges.length, nextChallenge, nextSlide, prevSlide, showNotes, tryAgain]);

  const totalSteps = lesson.content.challenges.length;
  const answered = feedback.status === "correct";

  // What Gridley does at each moment of the lesson.
  const taskMood: MascotMood =
    feedback.status === "correct" ? "cheer" : feedback.status === "incorrect" ? "oops" : unlockedHints > 0 ? "teach" : "think";
  const feedbackTitle =
    feedback.status === "correct"
      ? CORRECT_TITLES[currentIdx % CORRECT_TITLES.length]!
      : WRONG_TITLES[(currentIdx + unlockedHints) % WRONG_TITLES.length]!;
  const stepsDone = currentIdx + (feedback.status === "correct" ? 1 : 0);
  const hasNext = feedback.status === "correct" && currentIdx < totalSteps - 1;
  const lessonDone = feedback.status === "correct" && currentIdx === totalSteps - 1;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ─── Top bar: close, progress, reward ───────────────────── */}
      <header className="shrink-0 bg-background">
        <div className="mx-auto flex max-w-5xl items-center gap-5 px-4 py-5 lg:px-6">
          <Link
            href={exitHref as never}
            aria-label={`Exit ${course.title}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Link>

          {showNotes ? (
            <div className="flex flex-1 items-center gap-1" aria-label={`Step ${currentBeat + 1} of ${beatList.length}`}>
              {/* one small segment per step of the notes; click one to jump there */}
              {beatList.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to step ${i + 1}`}
                  onClick={() => setPos(b)}
                  className={cn("h-2.5 flex-1 rounded-full transition-colors duration-300", i <= currentBeat ? "bg-brand" : "bg-muted")}
                />
              ))}
            </div>
          ) : (
            <ProgressBar value={stepsDone} max={totalSteps} className="flex-1" />
          )}

          {alreadyCompleted ? (
            <span className="shrink-0 text-[15px] font-bold text-muted-foreground" title="XP for this lesson is already claimed">
              Review
            </span>
          ) : (
            <span className="shrink-0 text-[15px] font-bold text-brand">+{lesson.xpReward} XP</span>
          )}
        </div>
      </header>

      {/* ─── Main: a narrow column, vertically centred — label, question, answer ─── */}
      <main className="flex min-h-0 w-full flex-1 overflow-y-auto px-4">
        {showNotes && notes ? (
          <div className="m-auto w-full max-w-[600px] py-8">
            {/* Same layout as a question: Gridley, a small label, one line of explanation, then the sheet */}
            <div className="flex items-start gap-4">
              <Mascot key={onLastSlide ? "wave" : "teach"} mood={onLastSlide ? "wave" : "teach"} size={84} className="-ml-2 hidden sm:block" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-brand">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
                    <BookIcon className="h-3.5 w-3.5" />
                  </span>
                  {challenge ? "Challenge brief" : slideLabel(lesson.kind)}
                  <span className="truncate font-semibold normal-case tracking-normal text-muted-foreground">· {lesson.title}</span>
                </p>
                <h1
                  key={`${slide}-${pos.beat}`}
                  className="mt-3 text-[24px] font-bold leading-snug tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-300"
                >
                  {slide < slides.length ? (
                    <RichText text={slideHeading(slides[slide]!, pos.beat)} />
                  ) : (
                    <>Your turn! {totalSteps} {totalSteps === 1 ? "task" : "tasks"} in a live spreadsheet.</>
                  )}
                </h1>
              </div>
            </div>
            <div className="mt-8" key={slide}>
              {slide < slides.length ? (
                <NoteSlide blocks={slides[slide]!} workbook={lesson.content.initialWorkbook} demoStep={pos.beat} />
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <SheetPreview workbook={lesson.content.initialWorkbook} />
                  <p className="text-[15px] text-muted-foreground">Fill in the outlined cells. Stuck? Ask for a hint any time.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
        <div
          className={cn(
            "m-auto w-full py-8",
            // lessons that show the full Excel window get room for the ribbon
            lesson.fullExcel && currentChallenge.type !== "multiple_choice" ? "max-w-[880px]" : "max-w-[600px]"
          )}
        >
          <div className="flex items-start gap-4">
          <Mascot key={taskMood} mood={taskMood} size={96} className="-ml-2 hidden sm:block" />
          <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-brand">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <GridIcon className="h-3.5 w-3.5" />
            </span>
            {currentChallenge.type === "multiple_choice" ? "Choose the answer" : "Spreadsheet task"}
          </p>
          <h1 className="mt-3 text-[26px] font-bold leading-snug tracking-tight">
            {renderInline(currentChallenge.instruction)}
          </h1>
          {currentChallenge.detail && (
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {renderInline(currentChallenge.detail)}
            </p>
          )}
          </div>
          </div>

          <div className="mt-8 space-y-6">
            {/* Multiple choice — picture cards, keys 1–9 select */}
            {currentChallenge.type === "multiple_choice" && currentChallenge.options ? (
              <div
                className={cn(
                  "grid gap-3",
                  // Short answers sit in one row (2×2 on phones); long answers go 2×2 so they can wrap.
                  currentChallenge.options.some((o) => o.text.length > 18)
                    ? "grid-cols-1 sm:grid-cols-2"
                    : currentChallenge.options.length === 4
                      ? "grid-cols-2 sm:grid-cols-4"
                      : "grid-cols-2 sm:grid-cols-3"
                )}
              >
                {currentChallenge.options.map((opt, i) => {
                  const selected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOptionId(opt.id)}
                      // Once answered correctly the question is locked; only Continue is left.
                      disabled={answered}
                      className={cn(
                        "flex flex-col justify-between rounded-2xl border-2 border-b-4 p-4 text-left transition-[colors,opacity]",
                        currentChallenge.options!.some((o) => o.text.length > 18) ? "min-h-28" : "min-h-36",
                        selected ? "border-brand bg-brand-soft" : "border-border",
                        answered ? "cursor-default" : !selected && "hover:bg-muted/50",
                        answered && !selected && "opacity-40"
                      )}
                    >
                      {/* the answer, drawn as a selected spreadsheet cell */}
                      <span className="flex flex-1 items-center justify-center py-3">
                        <span
                          className={cn(
                            "max-w-full whitespace-normal break-words rounded-md border-2 bg-background px-3 py-2 text-center font-mono text-[15px] font-semibold",
                            selected ? "border-brand text-brand" : "border-border"
                          )}
                        >
                          {opt.text}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm", selected ? "font-semibold text-brand" : "text-muted-foreground")}>
                          Option {String.fromCharCode(65 + i)}
                        </span>
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-semibold",
                            selected ? "border-brand text-brand" : "border-border text-muted-foreground"
                          )}
                        >
                          {i + 1}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Spreadsheet task — the sheet, sized to the data */
              <Spreadsheet
                workbook={workbook}
                onChange={handleWorkbookChange}
                readOnly={answered}
                targetCellId={currentChallenge.targetCell}
                highlightRanges={currentChallenge.targetRange ? [currentChallenge.targetRange] : []}
                showToolbar={false}
                showStatusBar={false}
                excelChrome={lesson.fullExcel}
                showSheetTabs={workbook.sheets.length > 1}
                compact
                className="w-full"
              />
            )}

            {/* Hints appear only once asked for */}
            {currentChallenge.hints.slice(0, unlockedHints).map((h, i) => (
              <div key={i} className="rounded-2xl bg-muted/60 px-5 py-4">
                <p className="text-sm font-bold text-muted-foreground">
                  {h.level === 3 ? "Solution" : `Hint ${i + 1}`}
                </p>
                <p className="mt-1 text-[15px]">{renderInline(h.text)}</p>
                {h.example && (
                  <code className="mt-2 block overflow-x-auto font-mono text-sm text-brand">{h.example}</code>
                )}
              </div>
            ))}

            {/* Lesson notes stay one click away while practising */}
            {notes && (
              <details className="rounded-2xl border border-border px-5 py-4">
                <summary className="cursor-pointer text-sm font-bold text-muted-foreground">Lesson notes</summary>
                <div className="mt-4">
                  <LessonNotes text={notes} workbook={lesson.content.initialWorkbook} />
                </div>
              </details>
            )}
          </div>
        </div>
        )}
      </main>

      {/* ─── Footer: feedback + check / continue ────────────────── */}
      <footer
        className={cn(
          "shrink-0 border-t",
          feedback.status === "correct" && "border-transparent bg-brand-soft",
          feedback.status === "incorrect" && "border-transparent bg-rose-100 dark:bg-rose-950",
          feedback.status === "idle" && "border-border bg-background"
        )}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-5 lg:px-6">
          {showNotes ? (
            <>
              <div className="flex gap-2">
                {slide > 0 || pos.beat > 0 ? (
                  <button type="button" onClick={prevSlide} className={pressable("outline", "min-w-28")}>
                    Back
                  </button>
                ) : (
                  <button type="button" onClick={() => setShowNotes(false)} className={pressable("ghost")}>
                    Skip to practice
                  </button>
                )}
              </div>
              <button type="button" onClick={nextSlide} className={pressable("brand", "min-w-40 py-3")}>
                {onLastSlide ? "Start practice" : "Continue"}
              </button>
            </>
          ) : (
          <>
          {feedback.status === "idle" ? (
            <div className="flex gap-2">
              {unlockedHints < currentChallenge.hints.length && (
                <button
                  type="button"
                  onClick={unlockNextHint}
                  className={pressable("outline", "min-w-32")}
                >
                  Hint
                </button>
              )}
              <button type="button" onClick={resetWorkbook} className={pressable("ghost")}>
                Reset
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3",
                feedback.status === "correct" ? "text-brand-deep dark:text-brand" : "text-rose-700 dark:text-rose-300"
              )}
            >
              <Mascot key={feedback.status} mood={feedback.status === "correct" ? "cheer" : "oops"} size={80} className="-my-6 sm:hidden" />
              <div className="min-w-0">
              <p className="text-xl font-bold animate-in fade-in slide-in-from-bottom-1">{feedbackTitle}</p>
              <p className="mt-0.5 text-[15px]">{renderInline(feedback.message)}</p>
              {feedback.details && <p className="mt-0.5 text-sm opacity-80">{feedback.details}</p>}
              {feedback.status === "correct" && currentChallenge.explanation && currentChallenge.explanation !== feedback.message && (
                <p className="mt-1 text-sm opacity-90">{renderInline(currentChallenge.explanation)}</p>
              )}
              {feedback.status === "incorrect" && unlockedHints < currentChallenge.hints.length && (
                <button type="button" onClick={unlockNextHint} className="mt-1 text-sm font-bold underline underline-offset-2">
                  Need a clue? Ask Gridley for a hint
                </button>
              )}
              </div>
            </div>
          )}

          {hasNext || lessonDone ? (
            <button
              type="button"
              onClick={hasNext ? nextChallenge : () => setIsLessonCompleted(true)}
              className={pressable("brand", "min-w-40 py-3")}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={feedback.status === "incorrect" ? tryAgain : checkAnswer}
              disabled={isChecking || (feedback.status !== "incorrect" && currentChallenge.type === "multiple_choice" && !selectedOptionId)}
              className={pressable(feedback.status === "incorrect" ? "danger" : "brand", "min-w-40 py-3")}
            >
              {isChecking ? "Checking…" : feedback.status === "incorrect" ? "Try again" : "Check"}
            </button>
          )}
          </>
          )}
        </div>
      </footer>

      {/* ─── Lesson complete ────────────────────────────────────── */}
      {isLessonCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm space-y-6 rounded-3xl border border-border bg-card p-8 text-center animate-in zoom-in-95 duration-300">
            <Mascot mood={earnedXp > 0 ? "trophy" : "cheer"} size={150} className="mx-auto -mt-20" />

            <div>
              <h2 className="text-2xl font-bold text-brand">{earnedXp > 0 ? (challenge ? "Challenge complete!" : "Lesson complete!") : "Nice review!"}</h2>
              <p className="mt-1 text-[15px] text-muted-foreground">{lesson.title}</p>
            </div>

            {guest ? (
              <>
                <Panel className="border-transparent p-4">
                  <p className="text-sm font-semibold text-muted-foreground">XP waiting for you</p>
                  <p className="mt-1 text-3xl font-bold text-brand">+{earnedXp}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Create a free account to claim it and keep your progress.</p>
                </Panel>
                <div className="space-y-3">
                  <button type="button" onClick={() => router.push("/signup?claim=1" as never)} className={pressable("brand", "w-full py-3")}>
                    Claim my XP
                  </button>
                  <button type="button" onClick={() => router.push("/login?claim=1" as never)} className={pressable("outline", "w-full py-3")}>
                    I already have an account
                  </button>
                </div>
              </>
            ) : earnedXp > 0 ? (
              <Panel className="border-transparent p-4">
                <p className="text-sm font-semibold text-muted-foreground">XP earned</p>
                <p className="mt-1 text-3xl font-bold text-brand">+{earnedXp}</p>
                {earnedXp < lesson.xpReward && (
                  <p className="mt-1 text-sm text-muted-foreground">Hints used, so {lesson.xpReward - earnedXp} XP less. Try it without hints next time!</p>
                )}
              </Panel>
            ) : (
              <Panel className="border-transparent p-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  {xpClaimed ? "You already claimed the XP for this lesson." : "Your progress couldn't be saved this time."}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {xpClaimed ? "Practising again still makes you faster." : "Check your connection and try the lesson again."}
                </p>
              </Panel>
            )}

            {!guest && <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  router.push((challenge ? challenge.nextHref ?? challenge.exitHref : "/dashboard") as never);
                  router.refresh();
                }}
                className={pressable("brand", "w-full py-3")}
              >
                {challenge?.nextHref ? "Next challenge" : "Continue"}
              </button>
              <button
                type="button"
                onClick={() => router.push((challenge ? challenge.exitHref : "/dashboard/learn") as never)}
                className={pressable("outline", "w-full py-3")}
              >
                {challenge ? "All challenges" : "Open guidebook"}
              </button>
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}
