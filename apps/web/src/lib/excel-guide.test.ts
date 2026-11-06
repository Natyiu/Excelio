import { describe, expect, it } from "vitest";
import { COURSES } from "@/data/lessons";
import { buildGuide, jsonLd, readDemo, slugify } from "./excel-guide";
import { parseNotes } from "./lesson-notes-parse";
import type { ChapterAccess } from "./pro-access";

// Same default as the app: the first three chapters are free.
const defaults: Record<string, ChapterAccess> = Object.fromEntries(
  COURSES.map((c, i) => [c.id, { access: i < 3 ? "free" : "pro", hidden: false } as ChapterAccess])
);

describe("buildGuide", () => {
  const guide = buildGuide(defaults);

  it("gives every chapter a unique address", () => {
    expect(new Set(guide.map((c) => c.slug)).size).toBe(COURSES.length);
    expect(guide.every((c) => c.slug.length > 0)).toBe(true);
  });
  it("gives every lesson a unique address inside its chapter", () => {
    for (const c of guide) expect(new Set(c.lessons.map((l) => l.slug)).size).toBe(c.lessons.length);
  });
  it("keeps Pro notes off public pages", () => {
    const pro = guide.filter((c) => c.pro);
    expect(pro.length).toBeGreaterThan(0);
    expect(pro.flatMap((c) => c.lessons).every((l) => l.href === null)).toBe(true);
  });
  it("gives free lessons with real notes their own page", () => {
    expect(guide[0]!.lessons[0]!.href).toBe("/learn-excel/excel-fundamentals/meet-the-spreadsheet");
    expect(guide.filter((c) => !c.pro).flatMap((c) => c.lessons).filter((l) => l.href).length).toBeGreaterThan(5);
  });
  it("follows the admin's settings", () => {
    const first = COURSES[0]!.id;
    expect(buildGuide({ ...defaults, [first]: { access: "free", hidden: true } }).some((c) => c.course.id === first)).toBe(false);
    expect(buildGuide({ ...defaults, [first]: { access: "pro", hidden: false } })[0]!.lessons.every((l) => l.href === null)).toBe(true);
    // Numbers count what readers can see.
    expect(buildGuide({ ...defaults, [first]: { access: "free", hidden: true } })[0]!.number).toBe(1);
  });
});

describe("readDemo", () => {
  it("reads the table and steps, keeping colons inside formulas", () => {
    const { rows, steps } = readDemo(["| Item | Qty |", "| Coffee | 3 |", "cell C3: Every cell has an address", "type D5 =SUM(D2:D4): SUM adds up a range"]);
    expect(rows.slice(0, 2).map((r) => r.slice(0, 2))).toEqual([["Item", "Qty"], ["Coffee", "3"]]);
    expect(steps).toEqual([
      { cell: null, formula: null, caption: "Every cell has an address" },
      { cell: "D5", formula: "=SUM(D2:D4)", caption: "SUM adds up a range" },
    ]);
  });
  it("fills in the results the demo works out", () => {
    const { rows } = readDemo(["| Formula | Result |", "| No brackets | |", "| Brackets | |", "type B2 =2+3*4: Multiply first", "type B3 =(2+3)*4: Brackets first"]);
    expect(rows).toEqual([["Formula", "Result"], ["No brackets", "14"], ["Brackets", "20"]]);
  });
  it("adds a row for a total typed under the table", () => {
    const { rows } = readDemo(["| Day | Visitors |", "| Mon | 120 |", "| Tue | 95 |", "type B4 =SUM(B2:B3): SUM adds them up"]);
    expect(rows).toEqual([["Day", "Visitors"], ["Mon", "120"], ["Tue", "95"], ["", "215"]]);
  });
  it("follows a formula filled down", () => {
    const { rows } = readDemo(["| Qty | Price | Total |", "| 3 | 4 | |", "| 2 | 3 | |", "type C2 =A2*B2: Multiply", "fill C2 C3: Copy it down"]);
    expect(rows[1]![2]).toBe("12");
    expect(rows[2]![2]).toBe("6");
  });
  it("leaves no blank results in any free lesson", () => {
    const demos = COURSES.slice(0, 3).flatMap((c) => c.lessons).flatMap((l) => parseNotes(l.content.conceptOverview ?? "")).flatMap((b) => (b.kind === "demo" ? [b.lines] : []));
    expect(demos.length).toBeGreaterThan(3);
    for (const lines of demos) for (const row of readDemo(lines).rows) expect(row.every((c) => !c.startsWith("#"))).toBe(true);
  });
  it("skips a step with no caption", () => {
    expect(readDemo(["fill D2 D4"]).steps).toEqual([]);
  });
});

describe("helpers", () => {
  it("makes readable addresses", () => {
    expect(slugify("SORT, SORTBY and SEQUENCE")).toBe("sort-sortby-and-sequence");
    expect(slugify("Lab: Interface Workout")).toBe("lab-interface-workout");
    expect(slugify("Rock & Roll")).toBe("rock-and-roll");
  });
  it("can't break out of a script tag", () => {
    expect(jsonLd({ a: "</script><script>x" })).not.toContain("</script>");
  });
});
