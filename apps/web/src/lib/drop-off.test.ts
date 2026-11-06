import { describe, expect, it } from "vitest";
import { computeDropOff, type DropOffAttempt, type DropOffLesson } from "./drop-off";

const lesson = (id: string, chapter: number, pro = false): DropOffLesson => ({
  id,
  title: `Lesson ${id}`,
  chapter,
  chapterTitle: `Chapter ${chapter}`,
  pro,
  stepIds: [`${id}-1`, `${id}-2`, `${id}-3`],
});
const LESSONS = [lesson("a", 1), lesson("b", 1), lesson("c", 2, true)];

const now = new Date("2026-11-06T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const attempt = (lessonId: string, step: number, isCorrect: boolean, age = 30): DropOffAttempt => ({
  lessonId,
  challengeId: `${lessonId}-${step}`,
  isCorrect,
  createdAt: daysAgo(age),
});

function run(over: Partial<Parameters<typeof computeDropOff>[0]> = {}) {
  return computeDropOff({
    lessons: LESSONS,
    completedLessonIds: new Set(),
    attempts: [],
    isPro: false,
    signedUpAt: daysAgo(60),
    lastActive: daysAgo(30),
    now,
    ...over,
  });
}

describe("computeDropOff", () => {
  it("reports a learner who never tried anything, pointing at the first lesson", () => {
    const r = run({ lastActive: null });
    expect(r.stage).toBe("never_started");
    expect(r.lesson?.title).toBe("Lesson a");
    expect(r.step).toBeNull();
  });

  it("puts a wrong answer on that step and counts the wrong tries there", () => {
    const r = run({ attempts: [attempt("a", 1, true), attempt("a", 2, false), attempt("a", 2, false)] });
    expect(r.stage).toBe("mid_lesson");
    expect(r.step).toBe(2);
    expect(r.steps).toBe(3);
    expect(r.wrongOnStep).toBe(2);
  });

  it("moves a right answer on to the next step, with no wrong tries held against it", () => {
    const r = run({ attempts: [attempt("a", 1, false), attempt("a", 1, true)] });
    expect(r.step).toBe(2);
    expect(r.wrongOnStep).toBe(0);
  });

  it("stays on the last step if its right answer never became a finished lesson", () => {
    expect(run({ attempts: [attempt("a", 3, true)] }).step).toBe(3);
  });

  it("leaves the step empty when the challenge has since been removed from the lesson", () => {
    const r = run({ attempts: [{ ...attempt("a", 1, false), challengeId: "gone" }] });
    expect(r.stage).toBe("mid_lesson");
    expect(r.step).toBeNull();
  });

  it("points at the next lesson after finishing one cleanly", () => {
    const r = run({ completedLessonIds: new Set(["a"]), attempts: [attempt("a", 3, true)] });
    expect(r.stage).toBe("next_lesson");
    expect(r.lesson?.title).toBe("Lesson b");
    expect(r.lessonsDone).toBe(1);
  });

  it("ignores replaying a finished lesson", () => {
    const r = run({ completedLessonIds: new Set(["a"]), attempts: [attempt("b", 1, false, 40), attempt("a", 1, false, 30)] });
    expect(r.stage).toBe("mid_lesson");
    expect(r.lesson?.title).toBe("Lesson b");
  });

  it("calls it the paywall when the next lesson is Pro and they aren't", () => {
    expect(run({ completedLessonIds: new Set(["a", "b"]) }).stage).toBe("paywall");
  });

  it("doesn't call it the paywall for a Pro learner", () => {
    expect(run({ completedLessonIds: new Set(["a", "b"]), isPro: true }).stage).toBe("next_lesson");
  });

  it("finishes when every visible lesson is done, even if they were active recently", () => {
    const r = run({ completedLessonIds: new Set(["a", "b", "c"]), lastActive: daysAgo(1) });
    expect(r.stage).toBe("finished");
    expect(r.bucket).toBe("finished");
    expect(r.lesson).toBeNull();
  });

  it("keeps the stage but buckets recent learners as active", () => {
    const r = run({ attempts: [attempt("a", 1, false, 2)], lastActive: daysAgo(2) });
    expect(r.stage).toBe("mid_lesson");
    expect(r.bucket).toBe("active");
  });

  it("treats a new signup with no activity as active, not dropped", () => {
    expect(run({ lastActive: null, signedUpAt: daysAgo(2) }).bucket).toBe("active");
  });

  it("buckets by stage once the seven days are up", () => {
    expect(run({ attempts: [attempt("a", 1, false, 7)], lastActive: daysAgo(7) }).bucket).toBe("mid_lesson");
  });
});
