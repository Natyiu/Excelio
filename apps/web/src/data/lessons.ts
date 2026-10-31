/**
 * Excel Learning Platform — Course Data
 *
 * The Excel 365 path from beginner to advanced: three levels split into chapters,
 * each chapter a run of practice lessons ending in a lab. Lessons are authored in
 * `data/curriculum/*` and built (with their answers checked against the formula
 * engine) by `data/curriculum/build.ts`.
 */

import type { CourseData, LessonData, Workbook, WorksheetData, Cell } from "@/types/excel-learning";
import { buildChapters } from "@/data/curriculum/build";
import { BEGINNER } from "@/data/curriculum/beginner";
import { INTERMEDIATE } from "@/data/curriculum/intermediate";
import { ADVANCED } from "@/data/curriculum/advanced";

export const COURSES: CourseData[] = buildChapters([...BEGINNER, ...INTERMEDIATE, ...ADVANCED]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getAllLessons(): LessonData[] {
  return COURSES.flatMap(c => c.lessons);
}

export function getLessonById(id: string): LessonData | undefined {
  return getAllLessons().find(l => l.id === id);
}

export function getLessonBySlug(slug: string): LessonData | undefined {
  return getAllLessons().find(l => l.slug === slug);
}

export function getCourseById(id: string): CourseData | undefined {
  return COURSES.find(c => c.id === id);
}

export function getCourseBySlug(slug: string): CourseData | undefined {
  return COURSES.find(c => c.slug === slug);
}

export function getTotalLessons(): number {
  return getAllLessons().length;
}

export function getNextLesson(currentSlug: string): LessonData | undefined {
  const all = getAllLessons();
  const idx = all.findIndex(l => l.slug === currentSlug);
  return all[idx + 1];
}

// ─── Daily Challenges ─────────────────────────────────────────────────────────

function textCell(value: string): Cell["value"] {
  return { raw: value, computed: value, type: "text" as const };
}

function numCell(value: number): Cell["value"] {
  return { raw: String(value), computed: value, type: "number" as const };
}

function buildWorkbook(data: Record<string, Partial<Cell>>, rows = 25, cols = 10): Workbook {
  const cells: WorksheetData = {};
  for (const [id, cell] of Object.entries(data)) {
    cells[id] = {
      id,
      value: cell.value ?? { raw: "", computed: null, type: "blank" },
      format: cell.format,
      readOnly: cell.readOnly ?? false,
      highlighted: cell.highlighted,
      note: cell.note,
    };
  }
  return {
    id: "wb-" + Math.random().toString(36).slice(2),
    activeSheetId: "sheet1",
    sheets: [{
      id: "sheet1",
      name: "Sheet1",
      cells,
      rowCount: rows,
      colCount: cols,
      colWidths: { 0: 150, 1: 120, 2: 120, 3: 120, 4: 120 },
    }],
  };
}

export const DAILY_CHALLENGES = [
  {
    id: "dc-1",
    title: "Sum Today's Sales",
    description: "A store just closed for the day. Calculate total revenue from 5 transactions.",
    content: {
      initialWorkbook: buildWorkbook({
        A1: { value: textCell("Transaction"), format: { bold: true }, readOnly: true },
        B1: { value: textCell("Amount ($)"), format: { bold: true }, readOnly: true },
        A2: { value: textCell("Sale 1"), readOnly: true },
        B2: { value: numCell(89.99), readOnly: true },
        A3: { value: textCell("Sale 2"), readOnly: true },
        B3: { value: numCell(245.00), readOnly: true },
        A4: { value: textCell("Sale 3"), readOnly: true },
        B4: { value: numCell(12.50), readOnly: true },
        A5: { value: textCell("Sale 4"), readOnly: true },
        B5: { value: numCell(178.25), readOnly: true },
        A6: { value: textCell("Sale 5"), readOnly: true },
        B6: { value: numCell(55.00), readOnly: true },
        A8: { value: textCell("Total Revenue"), readOnly: true, format: { bold: true } },
        B8: { value: { raw: "", computed: null, type: "blank" }, highlighted: true },
      }),
      challenges: [{
        id: "dc1-c1",
        type: "formula" as const,
        instruction: "In **B8**, use SUM to calculate the total revenue for the day.",
        targetCell: "B8",
        validationRules: [{ mode: "required_formula" as const, targetCell: "B8", expectedValue: 580.74, requiredFormulas: ["SUM"], tolerance: 0.1 }],
        hints: [
          { level: 1 as const, text: "Use SUM to add up B2:B6." },
          { level: 3 as const, text: "=SUM(B2:B6)", example: "=SUM(B2:B6)" },
        ],
        successMessage: "Total revenue: $580.74!",
        explanation: "SUM adds all the transaction amounts.",
      }],
    },
    xpReward: 20,
  },
  {
    id: "dc-2",
    title: "Identify Top Product",
    description: "Find which product generated the highest sales using MAX.",
    content: {
      initialWorkbook: buildWorkbook({
        A1: { value: textCell("Product"), format: { bold: true }, readOnly: true },
        B1: { value: textCell("Sales"), format: { bold: true }, readOnly: true },
        A2: { value: textCell("Alpha"), readOnly: true },
        B2: { value: numCell(4200), readOnly: true },
        A3: { value: textCell("Beta"), readOnly: true },
        B3: { value: numCell(7800), readOnly: true },
        A4: { value: textCell("Gamma"), readOnly: true },
        B4: { value: numCell(3100), readOnly: true },
        A5: { value: textCell("Delta"), readOnly: true },
        B5: { value: numCell(6500), readOnly: true },
        A7: { value: textCell("Top Sales"), readOnly: true, format: { bold: true } },
        B7: { value: { raw: "", computed: null, type: "blank" }, highlighted: true },
      }),
      challenges: [{
        id: "dc2-c1",
        type: "formula" as const,
        instruction: "In **B7**, find the highest sales figure using MAX.",
        targetCell: "B7",
        validationRules: [{ mode: "required_formula" as const, targetCell: "B7", expectedValue: 7800, requiredFormulas: ["MAX"], tolerance: 0 }],
        hints: [
          { level: 1 as const, text: "Use MAX to find the largest value." },
          { level: 3 as const, text: "=MAX(B2:B5)", example: "=MAX(B2:B5)" },
        ],
        successMessage: "Beta tops at $7,800!",
        explanation: "MAX scans the range and returns the largest value.",
      }],
    },
    xpReward: 20,
  },
];

/** Get daily challenge based on date (deterministic) */
export function getDailyChallenge(date: Date = new Date()) {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
}
