import { describe, expect, it } from "vitest";
import { autoFill, doubleClickFillRows, fillSeries, fillTarget, shiftFormula } from "@/lib/autofill";
import { parseCellInput, recalcSheet } from "@/lib/formula-engine";
import type { WorksheetData } from "@/types/excel-learning";

describe("fillSeries", () => {
  it("copies one number and continues two", () => {
    expect(fillSeries(["5"], 3)).toEqual(["5", "5", "5"]);
    expect(fillSeries(["1", "2"], 3)).toEqual(["3", "4", "5"]);
    expect(fillSeries(["10", "20", "30"], 2)).toEqual(["40", "50"]);
    expect(fillSeries(["0.1", "0.2"], 2)).toEqual(["0.3", "0.4"]);
  });

  it("continues days and months, keeping their style", () => {
    expect(fillSeries(["Monday"], 2)).toEqual(["Tuesday", "Wednesday"]);
    expect(fillSeries(["Monday", "Tuesday"], 1)).toEqual(["Wednesday"]);
    expect(fillSeries(["Saturday"], 2)).toEqual(["Sunday", "Monday"]);
    expect(fillSeries(["Jan", "Feb"], 2)).toEqual(["Mar", "Apr"]);
    expect(fillSeries(["Nov"], 3)).toEqual(["Dec", "Jan", "Feb"]);
    expect(fillSeries(["MON"], 1)).toEqual(["TUE"]);
    expect(fillSeries(["Jan", "Mar"], 2)).toEqual(["May", "Jul"]);
  });

  it("counts up text that ends in a number", () => {
    expect(fillSeries(["Week 1", "Week 2"], 1)).toEqual(["Week 3"]);
    expect(fillSeries(["Q1"], 3)).toEqual(["Q2", "Q3", "Q4"]);
    expect(fillSeries(["ID-009"], 2)).toEqual(["ID-010", "ID-011"]);
  });

  it("repeats plain text", () => {
    expect(fillSeries(["North", "South"], 3)).toEqual(["North", "South", "North"]);
  });
});

describe("shiftFormula", () => {
  it("moves relative references only", () => {
    expect(shiftFormula("=B2*C2", 0, 1)).toBe("=B3*C3");
    expect(shiftFormula("=B2*$C$1", 0, 3)).toBe("=B5*$C$1");
    expect(shiftFormula("=$B2+B$2", 1, 1)).toBe("=$B3+C$2");
    expect(shiftFormula("=SUM(A1:A5)", 1, 0)).toBe("=SUM(B1:B5)");
  });

  it("leaves strings and function names alone", () => {
    expect(shiftFormula('=IF(A1>5,"A1","B2")', 0, 1)).toBe('=IF(A2>5,"A1","B2")');
    expect(shiftFormula("=LOG10(A1)", 0, 1)).toBe("=LOG10(A2)");
  });

  it("gives #REF! when a reference moves off the sheet", () => {
    expect(shiftFormula("=A1", 0, -1)).toBe("=#REF!");
  });
});

describe("autoFill", () => {
  const sheet = (raws: Record<string, string>) => (id: string) => raws[id] ?? "";

  it("fills the lesson's days and weeks down", () => {
    const src = { minCol: 0, maxCol: 1, minRow: 1, maxRow: 2 };
    const target = fillTarget(src, { col: 1, row: 4 })!;
    expect(target.dir).toBe("down");
    const out = autoFill(src, target, sheet({ A2: "Monday", A3: "Tuesday", B2: "Week 1", B3: "Week 2" }));
    expect(out).toEqual({ A4: "Wednesday", A5: "Thursday", B4: "Week 3", B5: "Week 4" });
  });

  it("copies a formula down and it calculates", () => {
    const src = { minCol: 2, maxCol: 2, minRow: 1, maxRow: 1 };
    const out = autoFill(src, fillTarget(src, { col: 2, row: 3 })!, sheet({ C2: "=A2*B2" }));
    expect(out).toEqual({ C3: "=A3*B3", C4: "=A4*B4" });

    let cells: WorksheetData = {};
    const raws: Record<string, string> = { A2: "2", B2: "3", A3: "4", B3: "5", A4: "6", B4: "7", C2: "=A2*B2", ...out };
    for (const [id, raw] of Object.entries(raws)) cells[id] = { id, value: parseCellInput(raw) };
    cells = recalcSheet(cells);
    expect([cells.C2!.value.computed, cells.C3!.value.computed, cells.C4!.value.computed]).toEqual([6, 20, 42]);
  });

  it("fills up and left by continuing backwards", () => {
    const src = { minCol: 0, maxCol: 0, minRow: 3, maxRow: 4 };
    expect(autoFill(src, fillTarget(src, { col: 0, row: 1 })!, sheet({ A4: "3", A5: "4" }))).toEqual({ A3: "2", A2: "1" });
    const row = { minCol: 2, maxCol: 2, minRow: 0, maxRow: 0 };
    expect(autoFill(row, fillTarget(row, { col: 0, row: 0 })!, sheet({ C1: "=C2" }))).toEqual({ B1: "=B2", A1: "=A2" });
  });

  it("does nothing while the pointer is inside the source", () => {
    expect(fillTarget({ minCol: 0, maxCol: 1, minRow: 0, maxRow: 1 }, { col: 1, row: 1 })).toBeNull();
  });

  it("double-click fills down as far as the next column has data", () => {
    const has = (id: string) => ["A2", "A3", "A4", "A5"].includes(id);
    expect(doubleClickFillRows({ minCol: 1, maxCol: 1, minRow: 1, maxRow: 1 }, has, 20)).toBe(4);
  });
});
