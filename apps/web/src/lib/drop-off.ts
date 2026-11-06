/** No learning activity for this many days counts as having dropped off. */
export const ACTIVE_DAYS = 7;

const DAY = 86_400_000;

export type DropOffStage = "never_started" | "mid_lesson" | "next_lesson" | "paywall" | "finished";
/** The stages, plus "active" for anyone not finished who has been around recently. */
export type DropOffBucket = DropOffStage | "active";

/** A visible lesson, in course order. */
export type DropOffLesson = {
  id: string;
  title: string;
  chapter: number;
  chapterTitle: string;
  pro: boolean;
  stepIds: string[];
};

export type DropOffAttempt = { lessonId: string; challengeId: string; isCorrect: boolean; createdAt: Date };

export type DropOffResult = {
  stage: DropOffStage;
  bucket: DropOffBucket;
  /** The lesson they stopped in, or the one waiting for them. Null once finished. */
  lesson: { title: string; chapter: number; chapterTitle: string } | null;
  /** 1-based step they stopped on. Only set when they left mid-lesson. */
  step: number | null;
  steps: number | null;
  /** Wrong answers on the step they stopped on. */
  wrongOnStep: number;
  lessonsDone: number;
  lessonsTotal: number;
  lastActive: Date | null;
  /** Whole days since lastActive. Null if they've never done anything. */
  daysSinceActive: number | null;
};

/**
 * Where one learner stopped, from what's recorded: answer checks and finished lessons.
 * Opening a lesson isn't recorded, so someone who leaves before checking an answer shows
 * as not having started that lesson.
 */
export function computeDropOff(input: {
  lessons: DropOffLesson[];
  completedLessonIds: Set<string>;
  /** This learner's attempts, oldest first. */
  attempts: DropOffAttempt[];
  isPro: boolean;
  signedUpAt: Date;
  /** Latest learning activity of any kind, including chapter-independent challenges. */
  lastActive: Date | null;
  now: Date;
}): DropOffResult {
  const { lessons, completedLessonIds, attempts, isPro, signedUpAt, lastActive, now } = input;
  const unfinished = lessons.filter((l) => !completedLessonIds.has(l.id));
  const lessonsDone = lessons.length - unfinished.length;
  const unfinishedById = new Map(unfinished.map((l) => [l.id, l]));
  const lastOpenAttempt = attempts.findLast((a) => unfinishedById.has(a.lessonId));

  let stage: DropOffStage;
  let target: DropOffLesson | undefined;
  let step: number | null = null;
  let steps: number | null = null;
  let wrongOnStep = 0;

  if (!unfinished.length) {
    stage = "finished";
  } else if (lastOpenAttempt) {
    stage = "mid_lesson";
    target = unfinishedById.get(lastOpenAttempt.lessonId)!;
    steps = target.stepIds.length;
    const index = target.stepIds.indexOf(lastOpenAttempt.challengeId);
    if (index >= 0) {
      // A right answer moves them on to the next step; a wrong one leaves them on this one.
      step = lastOpenAttempt.isCorrect ? Math.min(index + 2, steps) : index + 1;
    }
    if (!lastOpenAttempt.isCorrect) {
      wrongOnStep = attempts.filter(
        (a) => a.lessonId === lastOpenAttempt.lessonId && a.challengeId === lastOpenAttempt.challengeId && !a.isCorrect
      ).length;
    }
  } else {
    target = unfinished[0]!;
    stage = lessonsDone === 0 ? "never_started" : target.pro && !isPro ? "paywall" : "next_lesson";
  }

  const recent = now.getTime() - (lastActive ?? signedUpAt).getTime() < ACTIVE_DAYS * DAY;

  return {
    stage,
    bucket: stage !== "finished" && recent ? "active" : stage,
    lesson: target ? { title: target.title, chapter: target.chapter, chapterTitle: target.chapterTitle } : null,
    step,
    steps,
    wrongOnStep,
    lessonsDone,
    lessonsTotal: lessons.length,
    lastActive,
    daysSinceActive: lastActive ? Math.floor((now.getTime() - lastActive.getTime()) / DAY) : null,
  };
}
