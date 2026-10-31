/**
 * Practice sandbox templates, grouped by learning stage, and formula ideas for
 * each stage that point at the templates' real cells.
 */

import type { Workbook, Cell, LessonDifficulty } from "@/types/excel-learning";

function makeText(v: string): Cell["value"] {
  return { raw: v, computed: v, type: "text" };
}
function makeNum(v: number): Cell["value"] {
  return { raw: String(v), computed: v, type: "number" };
}
function makeFormula(f: string, initialComputed?: string | number): Cell["value"] {
  return { raw: f, formula: f, computed: initialComputed ?? null, type: "formula" };
}

export type Template = { title: string; desc: string; icon: string; levels: LessonDifficulty[]; workbook: Workbook };

/** Builds a sheet from rows starting at A1 (bold header row), for the Advanced template. */
function sheetFromRows(name: string, rows: (string | number)[][], currencyCols: number[] = []): Workbook {
  const cells: Record<string, Cell> = {};
  rows.forEach((row, r) =>
    row.forEach((v, c) => {
      const id = String.fromCharCode(65 + c) + (r + 1);
      cells[id] = {
        id,
        value: typeof v === "number" ? makeNum(v) : makeText(v),
        format: r === 0 ? { bold: true, bgColor: "#1D9A52", textColor: "#ffffff" } : currencyCols.includes(c) ? { numberFormat: "currency" } : undefined,
      };
    })
  );
  return { id: `wb-${name}`, activeSheetId: "sheet1", sheets: [{ id: "sheet1", name, rowCount: 25, colCount: 12, cells }] };
}

export const TEMPLATES: Record<string, Template> = {
  blank: {
    levels: ["beginner", "intermediate", "advanced"],
    title: "Blank Grid",
    desc: "Start with an empty canvas to write formulas and model calculations from scratch.",
    icon: "📄",
    workbook: {
      id: "wb-blank",
      activeSheetId: "sheet1",
      sheets: [
        {
          id: "sheet1",
          name: "Sheet1",
          rowCount: 25,
          colCount: 12,
          cells: {},
        },
      ],
    },
  },
  financial: {
    levels: ["beginner"],
    title: "SaaS Financial Model",
    desc: "Calculate Monthly Recurring Revenue (MRR), ARR, Gross Margin, and Net Runway.",
    icon: "📈",
    workbook: {
      id: "wb-saas",
      activeSheetId: "sheet1",
      sheets: [
        {
          id: "sheet1",
          name: "SaaS Model",
          rowCount: 20,
          colCount: 8,
          cells: {
            A1: { id: "A1", value: makeText("Acme SaaS Financial Projections"), format: { bold: true, fontSize: 14 } },
            A3: { id: "A3", value: makeText("Metric"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff" } },
            B3: { id: "B3", value: makeText("Q1"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff", align: "right" } },
            C3: { id: "C3", value: makeText("Q2"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff", align: "right" } },
            D3: { id: "D3", value: makeText("Q3"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff", align: "right" } },
            E3: { id: "E3", value: makeText("Q4"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff", align: "right" } },
            F3: { id: "F3", value: makeText("Full Year Total"), format: { bold: true, bgColor: "#0D6B37", textColor: "#ffffff", align: "right" } },

            A4: { id: "A4", value: makeText("Subscription Revenue") },
            B4: { id: "B4", value: makeNum(120000), format: { numberFormat: "currency" } },
            C4: { id: "C4", value: makeNum(145000), format: { numberFormat: "currency" } },
            D4: { id: "D4", value: makeNum(180000), format: { numberFormat: "currency" } },
            E4: { id: "E4", value: makeNum(220000), format: { numberFormat: "currency" } },
            F4: { id: "F4", value: makeFormula("=SUM(B4:E4)", 665000), format: { bold: true, numberFormat: "currency" } },

            A5: { id: "A5", value: makeText("Hosting & Infrastructure") },
            B5: { id: "B5", value: makeNum(18000), format: { numberFormat: "currency" } },
            C5: { id: "C5", value: makeNum(21000), format: { numberFormat: "currency" } },
            D5: { id: "D5", value: makeNum(25000), format: { numberFormat: "currency" } },
            E5: { id: "E5", value: makeNum(29000), format: { numberFormat: "currency" } },
            F5: { id: "F5", value: makeFormula("=SUM(B5:E5)", 93000), format: { bold: true, numberFormat: "currency" } },

            A6: { id: "A6", value: makeText("Gross Profit"), format: { bold: true } },
            B6: { id: "B6", value: makeFormula("=B4-B5", 102000), format: { bold: true, numberFormat: "currency" } },
            C6: { id: "C6", value: makeFormula("=C4-C5", 124000), format: { bold: true, numberFormat: "currency" } },
            D6: { id: "D6", value: makeFormula("=D4-D5", 155000), format: { bold: true, numberFormat: "currency" } },
            E6: { id: "E6", value: makeFormula("=E4-E5", 191000), format: { bold: true, numberFormat: "currency" } },
            F6: { id: "F6", value: makeFormula("=F4-F5", 572000), format: { bold: true, numberFormat: "currency", bgColor: "#0D6B37", textColor: "#ffffff" } },

            A8: { id: "A8", value: makeText("Average Quarter Revenue"), format: { italic: true } },
            B8: { id: "B8", value: makeFormula("=AVERAGE(B4:E4)", 166250), format: { numberFormat: "currency" } },
          },
        },
      ],
    },
  },
  sales: {
    levels: ["intermediate"],
    title: "Sales Pipeline & Commission",
    desc: "Calculate weighted forecast deals using probability multipliers and tiered bonuses.",
    icon: "💼",
    workbook: {
      id: "wb-sales",
      activeSheetId: "sheet1",
      sheets: [
        {
          id: "sheet1",
          name: "Sales Pipeline",
          rowCount: 20,
          colCount: 8,
          cells: {
            A1: { id: "A1", value: makeText("Opportunity Pipeline Tracker"), format: { bold: true, fontSize: 14 } },
            A3: { id: "A3", value: makeText("Client"), format: { bold: true, bgColor: "#0D6B37", textColor: "#ffffff" } },
            B3: { id: "B3", value: makeText("Deal Value"), format: { bold: true, bgColor: "#0D6B37", textColor: "#ffffff", align: "right" } },
            C3: { id: "C3", value: makeText("Probability"), format: { bold: true, bgColor: "#0D6B37", textColor: "#ffffff", align: "right" } },
            D3: { id: "D3", value: makeText("Weighted Value"), format: { bold: true, bgColor: "#0D6B37", textColor: "#ffffff", align: "right" } },
            E3: { id: "E3", value: makeText("Status"), format: { bold: true, bgColor: "#0D6B37", textColor: "#ffffff", align: "center" } },

            A4: { id: "A4", value: makeText("Alpha Corp") },
            B4: { id: "B4", value: makeNum(50000), format: { numberFormat: "currency" } },
            C4: { id: "C4", value: makeNum(0.8), format: { numberFormat: "percentage" } },
            D4: { id: "D4", value: makeFormula("=B4*C4", 40000), format: { numberFormat: "currency" } },
            E4: { id: "E4", value: makeFormula("=IF(C4>=0.7,\"High\",\"Standard\")", "High"), format: { align: "center" } },

            A5: { id: "A5", value: makeText("Beta Industries") },
            B5: { id: "B5", value: makeNum(120000), format: { numberFormat: "currency" } },
            C5: { id: "C5", value: makeNum(0.4), format: { numberFormat: "percentage" } },
            D5: { id: "D5", value: makeFormula("=B5*C5", 48000), format: { numberFormat: "currency" } },
            E5: { id: "E5", value: makeFormula("=IF(C5>=0.7,\"High\",\"Standard\")", "Standard"), format: { align: "center" } },

            A6: { id: "A6", value: makeText("Gamma Global") },
            B6: { id: "B6", value: makeNum(85000), format: { numberFormat: "currency" } },
            C6: { id: "C6", value: makeNum(0.9), format: { numberFormat: "percentage" } },
            D6: { id: "D6", value: makeFormula("=B6*C6", 76500), format: { numberFormat: "currency" } },
            E6: { id: "E6", value: makeFormula("=IF(C6>=0.7,\"High\",\"Standard\")", "High"), format: { align: "center" } },

            A8: { id: "A8", value: makeText("Total Pipeline"), format: { bold: true } },
            B8: { id: "B8", value: makeFormula("=SUM(B4:B6)", 255000), format: { bold: true, numberFormat: "currency" } },
            D8: { id: "D8", value: makeFormula("=SUM(D4:D6)", 164500), format: { bold: true, numberFormat: "currency", bgColor: "#0D6B37", textColor: "#ffffff" } },
          },
        },
      ],
    },
  },
  gradebook: {
    levels: ["beginner", "intermediate"],
    title: "Student Gradebook & Logic",
    desc: "Calculate student averages, pass/fail thresholds, and letter grade classifications.",
    icon: "🎓",
    workbook: {
      id: "wb-gradebook",
      activeSheetId: "sheet1",
      sheets: [
        {
          id: "sheet1",
          name: "Gradebook",
          rowCount: 20,
          colCount: 8,
          cells: {
            A1: { id: "A1", value: makeText("Advanced Analytics - Gradebook"), format: { bold: true, fontSize: 14 } },
            A3: { id: "A3", value: makeText("Student"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff" } },
            B3: { id: "B3", value: makeText("Exam 1"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff", align: "right" } },
            C3: { id: "C3", value: makeText("Exam 2"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff", align: "right" } },
            D3: { id: "D3", value: makeText("Final Project"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff", align: "right" } },
            E3: { id: "E3", value: makeText("Final Grade"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff", align: "right" } },
            F3: { id: "F3", value: makeText("Status"), format: { bold: true, bgColor: "#1D9A52", textColor: "#ffffff", align: "center" } },

            A4: { id: "A4", value: makeText("Alice Walker") },
            B4: { id: "B4", value: makeNum(92), format: { align: "right" } },
            C4: { id: "C4", value: makeNum(88), format: { align: "right" } },
            D4: { id: "D4", value: makeNum(95), format: { align: "right" } },
            E4: { id: "E4", value: makeFormula("=AVERAGE(B4:D4)", 91.67), format: { bold: true, align: "right" } },
            F4: { id: "F4", value: makeFormula("=IF(E4>=70,\"PASS\",\"FAIL\")", "PASS"), format: { align: "center", bold: true } },

            A5: { id: "A5", value: makeText("Bob Martinez") },
            B5: { id: "B5", value: makeNum(65), format: { align: "right" } },
            C5: { id: "C5", value: makeNum(68), format: { align: "right" } },
            D5: { id: "D5", value: makeNum(72), format: { align: "right" } },
            E5: { id: "E5", value: makeFormula("=AVERAGE(B5:D5)", 68.33), format: { bold: true, align: "right" } },
            F5: { id: "F5", value: makeFormula("=IF(E5>=70,\"PASS\",\"FAIL\")", "FAIL"), format: { align: "center", bold: true } },

            A6: { id: "A6", value: makeText("Claire Davis") },
            B6: { id: "B6", value: makeNum(84), format: { align: "right" } },
            C6: { id: "C6", value: makeNum(91), format: { align: "right" } },
            D6: { id: "D6", value: makeNum(89), format: { align: "right" } },
            E6: { id: "E6", value: makeFormula("=AVERAGE(B6:D6)", 88), format: { bold: true, align: "right" } },
            F6: { id: "F6", value: makeFormula("=IF(E6>=70,\"PASS\",\"FAIL\")", "PASS"), format: { align: "center", bold: true } },

            A8: { id: "A8", value: makeText("Class Average"), format: { italic: true } },
            E8: { id: "E8", value: makeFormula("=AVERAGE(E4:E6)", 82.67), format: { bold: true, bgColor: "#0D6B37", textColor: "#ffffff" } },
          },
        },
      ],
    },
  },
  explorer: {
    levels: ["advanced"],
    title: "Sales Data Explorer",
    desc: "Raw deal data to slice with FILTER, SORT, UNIQUE, XLOOKUP and LET.",
    icon: "",
    workbook: sheetFromRows(
      "Deals",
      [
        ["Date", "Rep", "Region", "Product", "Units", "Revenue"],
        ["2026-01-04", "Ava", "North", "Laptop", 5, 5250],
        ["2026-01-09", "Ben", "South", "Tablet", 8, 3920],
        ["2026-01-15", "Ava", "North", "Phone", 12, 8280],
        ["2026-01-22", "Cleo", "East", "Laptop", 3, 3150],
        ["2026-02-03", "Dev", "West", "Tablet", 10, 4900],
        ["2026-02-11", "Ben", "South", "Laptop", 4, 4200],
        ["2026-02-19", "Cleo", "East", "Phone", 9, 6210],
        ["2026-02-27", "Ava", "North", "Tablet", 6, 2940],
        ["2026-03-06", "Dev", "West", "Phone", 15, 10350],
        ["2026-03-14", "Ben", "South", "Phone", 7, 4830],
      ],
      [5]
    ),
  },
};

/** Formulas worth trying at each stage, matching what the lessons at that level teach. */
/** Formulas to try in each sheet, written against that sheet's own cells. */
export const DRILLS: Record<string, { code: string; hint: string }[]> = {
  blank: [
    { code: "=SEQUENCE(5)", hint: "Spill the numbers 1 to 5 down a column" },
    { code: "=SUM(A1:A5)", hint: "Then add them up (put this in A7)" },
    { code: "=AVERAGE(A1:A5)", hint: "Their average" },
    { code: "=A1*10", hint: "Use a cell in a calculation" },
  ],
  financial: [
    { code: "=SUM(B4:E4)", hint: "Add up a range" },
    { code: "=AVERAGE(B4:E4)", hint: "Arithmetic mean" },
    { code: "=MAX(B4:E4)-MIN(B4:E4)", hint: "Spread between highest and lowest" },
    { code: "=B4*$H$1", hint: "Lock a rate with $ (type a rate in H1 first)" },
  ],
  gradebook: [
    { code: "=MAX(E4:E6)", hint: "Best final average" },
    { code: '=IF(E4>=90,"Distinction","")', hint: "Flag top marks" },
    { code: '=COUNTIF(F4:F6,"PASS")', hint: "How many passed" },
    { code: "=RANK.EQ(E4,$E$4:$E$6)", hint: "Position in the class" },
  ],
  sales: [
    { code: "=MAX(B4:B6)", hint: "Largest deal" },
    { code: '=COUNTIF(E4:E6,"High")', hint: "How many high-probability deals" },
    { code: '=SUMIFS(D4:D6,E4:E6,"High")', hint: "Weighted value of the high ones" },
    { code: '=XLOOKUP("Beta Industries",A4:A6,B4:B6)', hint: "Look up one client's deal" },
  ],
  explorer: [
    { code: '=FILTER(A2:F11,C2:C11="North")', hint: "Rows for one region" },
    { code: "=SORT(UNIQUE(B2:B11))", hint: "Sorted list of reps" },
    { code: "=TAKE(SORTBY(B2:B11,F2:F11,-1),3)", hint: "Reps behind the top three deals" },
    { code: "=LET(r,F2:F11,SUM(r)/COUNT(r))", hint: "Name a range, then use it" },
  ],
};
