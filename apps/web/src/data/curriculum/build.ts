/**
 * Lesson authoring helpers.
 *
 * Lessons are written as a sheet (rows from A1) plus a list of steps. Each
 * spreadsheet step carries its reference solution; the builder runs that
 * solution through the formula engine to work out the expected answer, so a
 * lesson's checks can never disagree with what the engine calculates.
 */

import type {
  Cell,
  CellFormat,
  Challenge,
  CourseData,
  LessonData,
  LessonDifficulty,
  ValidationRule,
  Workbook,
  WorksheetData,
} from "@/types/excel-learning";
import { cellId, extractFunctionNames, parseCellInput, parseCellRef, recalcSheet } from "@/lib/formula-engine";

// ─── Sheets ───────────────────────────────────────────────────────────────────

type Raw = string | number | boolean | null;
export type NumberFormat = "currency" | "percentage" | "number" | "date";

export interface SheetSpec {
  /** Rows written from A1 (or `at`). Strings starting with "=" are formulas. */
  rows: Raw[][];
  at?: string;
  /** Bold the first row. Default true. */
  header?: boolean;
  /** Extra cells outside the main block, e.g. { G1: "Tax rate", H1: 0.2 }. */
  cells?: Record<string, Raw>;
  /** Number formats by column letter ("C") or cell ("H1"). */
  fmt?: Record<string, NumberFormat>;
  /** Cells to show in bold (labels outside the header row). */
  bold?: string[];
  /** Named ranges and Table[Column] references. */
  names?: Record<string, string>;
  /** Cells the learner may edit even though they hold data. */
  editable?: string[];
  colWidths?: Record<number, number>;
}

/** Excel date serial for a calendar date (shown with the "date" format). */
export function d(y: number, m: number, day: number): number {
  return Math.round((Date.UTC(y, m - 1, day) - Date.UTC(1899, 11, 30)) / 86400000);
}

function rawCell(id: string, v: Raw, format?: CellFormat, readOnly = true): Cell {
  if (v === null) return { id, value: { raw: "", computed: null, type: "blank" }, format, readOnly };
  if (typeof v === "boolean") return { id, value: { raw: v ? "TRUE" : "FALSE", computed: v, type: "boolean" }, format, readOnly };
  if (typeof v === "number") return { id, value: { raw: String(v), computed: v, type: "number" }, format, readOnly };
  const parsed = parseCellInput(v);
  // Text that looks numeric (e.g. "00125") stays text when authored as a string with a leading apostrophe.
  return { id, value: parsed, format, readOnly };
}

function buildSheetCells(spec: SheetSpec): WorksheetData {
  const cells: WorksheetData = {};
  const origin = parseCellRef(spec.at ?? "A1")!;
  const fmtFor = (id: string): CellFormat | undefined => {
    const p = parseCellRef(id)!;
    const colLetter = cellId(p.col, 0).replace(/\d+$/, "");
    const nf = spec.fmt?.[id] ?? spec.fmt?.[colLetter];
    return nf ? { numberFormat: nf } : undefined;
  };
  spec.rows.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v === null) return;
      const id = cellId(origin.col + c, origin.row + r);
      const isHeader = r === 0 && spec.header !== false;
      const format: CellFormat | undefined = isHeader ? { bold: true } : fmtFor(id);
      cells[id] = rawCell(id, v, format);
    }),
  );
  for (const [id, v] of Object.entries(spec.cells ?? {})) {
    cells[id] = rawCell(id, v, fmtFor(id));
  }
  for (const id of spec.bold ?? []) {
    if (cells[id]) cells[id] = { ...cells[id]!, format: { ...cells[id]!.format, bold: true } };
  }
  for (const id of spec.editable ?? []) {
    if (cells[id]) cells[id] = { ...cells[id]!, readOnly: false };
  }
  return cells;
}

function toWorkbook(cells: WorksheetData, spec: SheetSpec, id: string): Workbook {
  return {
    id: `wb-${id}`,
    activeSheetId: "sheet1",
    sheets: [{
      id: "sheet1",
      name: "Sheet1",
      cells,
      rowCount: 40,
      colCount: 16,
      names: spec.names,
      colWidths: spec.colWidths ?? { 0: 140, 1: 120, 2: 120, 3: 120, 4: 120, 5: 120, 6: 120 },
    }],
  };
}

// ─── Steps ────────────────────────────────────────────────────────────────────

interface FormulaStep {
  kind: "formula";
  cell: string;
  ask: string;
  answer: string;
  why: string;
  detail?: string;
  hint?: string;
  /** Functions the answer must use. Defaults to every function in `answer`. */
  fns?: string[];
  /** Text the formula must contain, e.g. "$" for an absolute reference. */
  contains?: string[];
  /** Also check the cells the answer spills into. */
  spill?: boolean;
  /** The result is random (RANDARRAY etc.): check the functions only. */
  random?: boolean;
  /** Format for the answer cell. */
  fmt?: NumberFormat;
  ok?: string;
}
interface TypeStep {
  kind: "type";
  cell: string;
  ask: string;
  value: string | number;
  why: string;
  detail?: string;
  hint?: string;
  ok?: string;
}
interface PickStep {
  kind: "pick";
  ask: string;
  options: string[];
  correct: number;
  why: string;
  detail?: string;
  hint?: string;
}
export type Step = FormulaStep | TypeStep | PickStep;

/** A formula task: write `answer` (or anything that gives the same result) in `cell`. */
export function task(cell: string, ask: string, answer: string, why: string, opts: Partial<Omit<FormulaStep, "kind" | "cell" | "ask" | "answer" | "why">> = {}): Step {
  return { kind: "formula", cell, ask, answer, why, ...opts };
}
/** Type a plain value into a cell. */
export function enter(cell: string, ask: string, value: string | number, why: string, opts: { detail?: string; hint?: string; ok?: string } = {}): Step {
  return { kind: "type", cell, ask, value, why, ...opts };
}
/** A multiple-choice question. */
export function pick(ask: string, options: string[], correct: number, why: string, opts: { detail?: string; hint?: string } = {}): Step {
  return { kind: "pick", ask, options, correct, why, ...opts };
}

/**
 * Shuffle with a seed derived from `key`, so the order is random across questions
 * but identical on every render (server and browser agree).
 */
function seededShuffle<T>(items: T[], key: string): T[] {
  let seed = 2166136261;
  for (let i = 0; i < key.length; i++) seed = Math.imul(seed ^ key.charCodeAt(i), 16777619) >>> 0;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

export interface LessonSpec {
  title: string;
  desc: string;
  /** Notes shown before the practice. Paragraphs split by a blank line; "- " lists; ``` code blocks; | tables. */
  learn: string;
  sheet?: SheetSpec;
  steps: Step[];
  skills?: string[];
  kind?: "lesson" | "lab" | "capstone";
  done?: string;
  /** Show the whole Excel window around the sheet. Only for lessons that teach ribbon commands. */
  fullExcel?: boolean;
}

export interface ChapterSpec {
  id: string;
  title: string;
  desc: string;
  difficulty: LessonDifficulty;
  formula: string; // shown in the chapter banner illustration
  lessons: LessonSpec[];
}

const EMPTY_SHEET: SheetSpec = { rows: [] };

function buildLesson(spec: LessonSpec, chapter: ChapterSpec, index: number, prevSlug: string | null): LessonData {
  const id = `${chapter.id}-${index + 1}`;
  const sheet = spec.sheet ?? EMPTY_SHEET;
  const names = sheet.names ?? {};
  const base = buildSheetCells(sheet);

  // Target cells start empty and highlighted.
  const targets = spec.steps.flatMap((s) => (s.kind === "pick" ? [] : [s.cell]));
  for (const t of targets) {
    if (!base[t]) base[t] = { id: t, value: { raw: "", computed: null, type: "blank" } };
    base[t] = { ...base[t]!, readOnly: false, highlighted: true };
    const fmt = spec.steps.find((s) => s.kind === "formula" && s.cell === t) as FormulaStep | undefined;
    if (fmt?.fmt) base[t] = { ...base[t]!, format: { ...base[t]!.format, numberFormat: fmt.fmt } };
  }

  // Work through the steps in order on a scratch copy to learn each expected answer.
  let work = recalcSheet(base, names);
  const initial = JSON.parse(JSON.stringify(work)) as WorksheetData;
  const challenges: Challenge[] = [];

  spec.steps.forEach((step, i) => {
    const cid = `${id}-c${i + 1}`;
    if (step.kind === "pick") {
      challenges.push({
        id: cid,
        type: "multiple_choice",
        instruction: step.ask,
        detail: step.detail,
        validationRules: [],
        // Options are authored with the answer often first; shuffle so it lands in any position.
        options: seededShuffle(
          step.options.map((text, j) => ({ id: `o${j + 1}`, text, correct: j === step.correct, explanation: j === step.correct ? undefined : step.why })),
          cid
        ),
        hints: step.hint ? [{ level: 1, text: step.hint }] : [],
        successMessage: "Correct!",
        explanation: step.why,
        xpReward: 5,
      });
      return;
    }

    if (step.kind === "type") {
      work = recalcSheet({ ...work, [step.cell]: { ...work[step.cell]!, value: parseCellInput(String(step.value)) } }, names);
      const numeric = typeof step.value === "number";
      const shown = work[step.cell]!.value.computed;
      challenges.push({
        id: cid,
        type: "cell_edit",
        instruction: step.ask,
        detail: step.detail,
        targetCell: step.cell,
        validationRules: [numeric
          ? { mode: "numeric_value", targetCell: step.cell, expectedValue: step.value }
          : { mode: "exact_text", targetCell: step.cell, expectedValue: String(shown ?? step.value), caseSensitive: false }],
        hints: [
          ...(step.hint ? [{ level: 1 as const, text: step.hint }] : []),
          { level: 3, text: `Click ${step.cell} and type:`, example: String(step.value) },
        ],
        successMessage: step.ok ?? "Correct!",
        explanation: step.why,
        xpReward: 5,
      });
      return;
    }

    // Formula step: run the reference answer.
    work = recalcSheet({ ...work, [step.cell]: { ...work[step.cell]!, value: parseCellInput(step.answer) } }, names);
    const result = work[step.cell]!.value;
    if (result.error && !step.random) {
      throw new Error(`Lesson ${id} step ${i + 1}: reference answer ${step.answer} gives ${result.error}`);
    }
    const fns = step.fns ?? extractFunctionNames(step.answer);
    const rules: ValidationRule[] = [];
    const expected = step.random ? undefined : (result.computed as string | number | boolean);
    rules.push(
      fns.length
        ? { mode: "required_formula", targetCell: step.cell, requiredFormulas: fns, expectedValue: expected, tolerance: 0.0001 }
        : { mode: "formula_result", targetCell: step.cell, expectedValue: expected, tolerance: 0.0001 },
    );
    for (const text of step.contains ?? []) {
      rules.push({ mode: "formula_contains", targetCell: step.cell, requiredFormulas: [text], message: `Your formula should include ${text}` });
    }
    if (step.spill && !step.random) {
      const range = result.spillRange;
      if (!range) throw new Error(`Lesson ${id} step ${i + 1}: ${step.answer} was expected to spill`);
      const [a, b] = range.split(":");
      const s = parseCellRef(a!)!, e = parseCellRef(b!)!;
      for (let r = s.row; r <= e.row; r++) {
        for (let c = s.col; c <= e.col; c++) {
          const sid = cellId(c, r);
          if (sid === step.cell) continue;
          const v = work[sid]?.value.computed;
          if (v === null || v === undefined) continue;
          rules.push({ mode: "cell_value", targetCell: sid, expectedValue: v as string | number, tolerance: 0.0001, message: `${sid} should show ${v}. Check that your formula returns the whole list.` });
        }
      }
      // Reserve the spill area so the lesson grid is large enough to show it.
      for (let r = s.row; r <= e.row; r++) {
        for (let c = s.col; c <= e.col; c++) {
          const sid = cellId(c, r);
          if (!initial[sid]) initial[sid] = { id: sid, value: { raw: "", computed: null, type: "blank" }, format: step.fmt ? { numberFormat: step.fmt } : undefined };
        }
      }
    }
    const funcHint = fns.length ? `Use ${fns.join(" and ")}.` : "Start with = and refer to the cells, not the numbers.";
    challenges.push({
      id: cid,
      type: "formula",
      instruction: step.ask,
      detail: step.detail,
      targetCell: step.cell,
      requiredFormula: fns[0],
      validationRules: rules,
      hints: [
        { level: 1, text: step.hint ?? funcHint },
        { level: 3, text: `Type this in ${step.cell}:`, example: step.answer },
      ],
      successMessage: step.ok ?? "Correct!",
      explanation: step.why,
      xpReward: 5,
    });
  });

  const spreadsheetSteps = spec.steps.filter((s) => s.kind !== "pick").length;
  const xp = spec.kind === "capstone" ? 50 : spec.kind === "lab" ? 30 : 10 + 5 * Math.min(spreadsheetSteps, 3);

  return {
    id,
    courseId: chapter.id,
    slug: id,
    title: spec.title,
    description: spec.desc,
    difficulty: chapter.difficulty,
    estimatedMinutes: Math.max(3, 2 + spec.steps.length * 2),
    xpReward: xp,
    sortOrder: index + 1,
    prerequisites: prevSlug ? [prevSlug] : [],
    published: true,
    skills: spec.skills ?? [],
    kind: spec.kind ?? "lesson",
    fullExcel: spec.fullExcel,
    content: {
      conceptOverview: spec.learn.trim(),
      initialWorkbook: toWorkbook(initial, sheet, id),
      challenges,
      completionMessage: spec.done,
    },
  };
}

export function buildChapters(chapters: ChapterSpec[]): CourseData[] {
  let prev: string | null = null;
  return chapters.map((ch, ci) => {
    const lessons = ch.lessons.map((l, li) => {
      const lesson = buildLesson(l, ch, li, prev);
      prev = lesson.slug;
      return lesson;
    });
    return {
      id: ch.id,
      slug: ch.id,
      title: ch.title,
      description: ch.desc,
      difficulty: ch.difficulty,
      sortOrder: ci + 1,
      published: true,
      icon: "",
      color: "",
      formula: ch.formula,
      lessons,
    };
  });
}
