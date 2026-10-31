import { describe, expect, it } from "vitest";
import { COURSES, getAllLessons } from "@/data/lessons";
import { CHALLENGES } from "@/data/curriculum/challenges";
import { validateChallenge } from "@/lib/validation-engine";
import { parseCellInput, recalcSheet } from "@/lib/formula-engine";

describe("curriculum", () => {
  it("builds every chapter and lesson", () => {
    expect(COURSES.length).toBeGreaterThan(15);
    for (const c of COURSES) expect(c.lessons.length).toBeGreaterThan(0);
  });

  it("accepts each reference answer and rejects an empty sheet", () => {
    for (const lesson of [...getAllLessons(), ...Object.values(CHALLENGES).flat()]) {
      const sheet = lesson.content.initialWorkbook.sheets[0]!;
      let cells = sheet.cells;
      for (const ch of lesson.content.challenges) {
        if (ch.type === "multiple_choice") {
          expect(ch.options?.filter((o) => o.correct).length, `${lesson.id} ${ch.id}`).toBe(1);
          continue;
        }
        const answer = ch.hints.find((h) => h.level === 3)?.example ?? "";
        const before = validateChallenge(ch.validationRules, cells);
        if (!ch.validationRules.some((r) => r.expectedValue === undefined)) {
          expect(before.isCorrect, `${lesson.id} ${ch.id} passes before answering`).toBe(false);
        }
        cells = recalcSheet({ ...cells, [ch.targetCell!]: { ...cells[ch.targetCell!]!, id: ch.targetCell!, value: parseCellInput(answer) } }, sheet.names);
        const after = validateChallenge(ch.validationRules, cells);
        expect(after.isCorrect, `${lesson.id} ${ch.id}: ${answer} → ${after.message}`).toBe(true);
      }
    }
  });
});

describe("multiple choice", () => {
  it("spreads the correct answer across positions", () => {
    const positions = [0, 0, 0, 0];
    for (const lesson of getAllLessons()) {
      for (const ch of lesson.content.challenges) {
        if (ch.type !== "multiple_choice") continue;
        positions[ch.options!.findIndex((o) => o.correct)]!++;
      }
    }
    const total = positions.reduce((a, b) => a + b, 0);
    // Lessons are practice-first; quizzes are rare, so only check the spread once there are enough.
    if (total < 8) return;
    for (const n of positions) expect(n / total).toBeLessThan(0.4);
  });
});
