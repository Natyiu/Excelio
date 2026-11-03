import { describe, expect, it } from "vitest";
import { estimateRival, type EstimateChapter } from "./rival-estimate";
import { COURSES } from "@/data/lessons";

const chapters: EstimateChapter[] = [
  { id: "b1", level: "beginner", lessonXp: [20, 20, 30] },
  { id: "b2", level: "beginner", lessonXp: [25, 20, 30] },
  { id: "i1", level: "intermediate", lessonXp: [20, 25, 20, 30] },
];
const fixed = (r: number) => () => r;

describe("estimateRival", () => {
  it("counts every earlier chapter as done", () => {
    const e = estimateRival(chapters, "intermediate", "i1", fixed(0))!;
    // b1 + b2 = 6 lessons, 145 XP; 0 lessons into i1
    expect(e.currentChapter).toBe("i1");
    expect(e.lessonsCompleted).toBe(6);
    expect(e.totalXp).toBe(150); // 145 × 1.05 = 152.25, rounded to 5
  });

  it("picks the first chapter of the level when no chapter is chosen", () => {
    expect(estimateRival(chapters, "intermediate", "", fixed(0))!.currentChapter).toBe("i1");
  });

  it("always has at least one lesson done", () => {
    const e = estimateRival(chapters, "beginner", "b1", fixed(0))!;
    expect(e.lessonsCompleted).toBe(1);
    expect(e.totalXp).toBeGreaterThan(0);
    expect(e.currentStreak).toBe(1);
  });

  it("keeps weekly XP within total and the streak within lessons done", () => {
    for (const r of [0, 0.3, 0.6, 0.99]) {
      for (const c of chapters) {
        const e = estimateRival(chapters, c.level, c.id, fixed(r))!;
        expect(e.weeklyXp).toBeLessThanOrEqual(e.totalXp);
        expect(e.currentStreak).toBeLessThanOrEqual(e.lessonsCompleted);
        expect(e.totalXp % 5).toBe(0);
      }
    }
  });

  it("returns null for an unknown chapter", () => {
    expect(estimateRival(chapters, "beginner", "zz")).toBeNull();
  });

  it("works on the real curriculum", () => {
    const real = COURSES.map((c) => ({ id: c.id, level: c.difficulty, lessonXp: c.lessons.map((l) => l.xpReward) }));
    const last = real[real.length - 1]!;
    const e = estimateRival(real, last.level, last.id, fixed(0.5))!;
    expect(e.lessonsCompleted).toBeGreaterThan(80);
    expect(e.totalXp).toBeGreaterThan(2000);
  });
});
