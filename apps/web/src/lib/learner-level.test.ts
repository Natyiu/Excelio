import { describe, expect, it } from "vitest";
import { levelFromCompleted, liveStreak } from "./learner-level";
import { COURSES } from "@/data/lessons";

describe("levelFromCompleted", () => {
  const beginnerLessons = COURSES.filter((c) => c.difficulty === "beginner").reduce((n, c) => n + c.lessons.length, 0);
  const total = COURSES.reduce((n, c) => n + c.lessons.length, 0);

  it("is beginner at the start", () => {
    expect(levelFromCompleted(0)).toBe("beginner");
  });
  it("becomes intermediate once every beginner lesson is done", () => {
    expect(levelFromCompleted(beginnerLessons - 1)).toBe("beginner");
    expect(levelFromCompleted(beginnerLessons)).toBe("intermediate");
  });
  it("is advanced at the end and after finishing everything", () => {
    expect(levelFromCompleted(total - 1)).toBe("advanced");
    expect(levelFromCompleted(total + 5)).toBe("advanced");
  });
});

describe("liveStreak", () => {
  const now = new Date(2026, 10, 3, 15, 0);
  const daysAgo = (n: number) => new Date(2026, 10, 3 - n, 9, 0);
  it("keeps a streak active today or yesterday", () => {
    expect(liveStreak(5, daysAgo(0), now)).toBe(5);
    expect(liveStreak(5, daysAgo(1), now)).toBe(5);
  });
  it("ends a streak whose last day was before yesterday", () => {
    expect(liveStreak(5, daysAgo(2), now)).toBe(0);
  });
  it("is 0 with no activity", () => {
    expect(liveStreak(3, null, now)).toBe(0);
  });
});
