import { describe, expect, it } from "vitest";
import { getAllLessons } from "@/data/lessons";
import { parseNotes } from "@/components/learning/lesson-notes";
import { parseSpec, runDemo } from "@/lib/sheet-demo-run";

describe("lesson demos", () => {
  it("every demo step parses and its formulas calculate", () => {
    let count = 0;
    for (const lesson of getAllLessons()) {
      const sheet = lesson.content.initialWorkbook.sheets[0]!;
      for (const block of parseNotes(lesson.content.conceptOverview ?? "")) {
        if (block.kind !== "demo") continue;
        count++;
        const spec = parseSpec(block.lines);
        expect(spec.steps.length, `${lesson.id} demo has steps`).toBe(block.lines.filter((l) => !l.trim().startsWith("|")).length);
        const { states } = runDemo(spec, sheet.cells, sheet.names ?? {});
        spec.steps.forEach((step, i) => {
          if (step.kind !== "type" && step.kind !== "fill") return;
          const id = step.kind === "type" ? step.id : step.to;
          const err = states[i]![id]?.value.error;
          // The IFERROR demo shows a #DIV/0! on purpose before fixing it.
          if (step.kind === "type" && step.formula === "=A2/B2") return;
          expect(err, `${lesson.id} ${step.kind} ${id}: ${step.kind === "type" ? step.formula : ""}`).toBeUndefined();
        });
      }
    }
    expect(count).toBeGreaterThan(40);
  });
});
