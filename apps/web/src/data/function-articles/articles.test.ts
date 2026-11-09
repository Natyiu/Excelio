import { describe, expect, it } from "vitest";
import { cellId, parseCellInput, recalcSheet } from "@/lib/formula-engine";
import { COURSES } from "@/data/lessons";
import { slugify } from "@/lib/excel-guide";
import type { WorksheetData } from "@/types/excel-learning";
import { validateChallenge } from "@/lib/validation-engine";
import { ALL_FUNCTION_ARTICLES as FUNCTION_ARTICLES, type FunctionArticle } from "./index";

function sheet(article: FunctionArticle, formula: string) {
  const cells: WorksheetData = {};
  article.data.forEach((row, r) => row.forEach((v, c) => {
    const id = cellId(c, r);
    cells[id] = { id, value: parseCellInput(String(v)) };
  }));
  const target = cellId(article.data[0]!.length + 1, 1);
  cells[target] = { id: target, value: parseCellInput(formula) };
  return { target, cells: recalcSheet(cells) };
}

function run(article: FunctionArticle, formula: string) {
  const { target, cells } = sheet(article, formula);
  const value = cells[target]!.value;
  return value.error ?? value.computed;
}

const same = (actual: unknown, expected: string | number) =>
  typeof expected === "number" ? expect(actual).toBeCloseTo(expected, 3) : expect(actual).toBe(expected);

describe("function articles", () => {
  it.each(FUNCTION_ARTICLES.map((a) => [a.name, a] as const))("%s gives the published answers", (_, a) => {
    for (const e of a.examples) same(run(a, e.formula), e.expected);
    same(run(a, a.exercise.solution), a.exercise.expected);
    const { target, cells } = sheet(a, a.exercise.solution);
    expect(validateChallenge([{ mode: "formula_result", targetCell: target, expectedValue: a.exercise.expected, tolerance: 0.01 }, { mode: "required_formula", targetCell: target, requiredFormulas: a.exercise.requires }], cells).isCorrect).toBe(true);
  });

  it("are all different from each other", () => {
    for (const key of ["slug", "name", "hook", "answer", "story"] as const) {
      expect(new Set(FUNCTION_ARTICLES.map((a) => a[key])).size).toBe(FUNCTION_ARTICLES.length);
    }
    expect(new Set(FUNCTION_ARTICLES.map((a) => JSON.stringify(a.data))).size).toBe(FUNCTION_ARTICLES.length);
  });

  it("cover all 100 functions", () => expect(FUNCTION_ARTICLES).toHaveLength(100));

  it("link only to real pages", () => {
    const slugs = new Set(FUNCTION_ARTICLES.map((a) => a.slug));
    const chapters = new Set(COURSES.map((c) => slugify(c.title)));
    for (const a of FUNCTION_ARTICLES) {
      expect(a.related.filter((s) => !slugs.has(s))).toEqual([]);
      expect(chapters.has(a.chapter)).toBe(true);
    }
  });
});
