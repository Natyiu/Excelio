import type { WorksheetData } from "@/types/excel-learning";
import { cellId, parseCellInput, parseCellRef, parseRange, recalcSheet } from "@/lib/formula-engine";

/** The steps of a ```show block and the sheet after each, shared by the app's demo and the public guide. */
export type Step =
  | { kind: "col"; col: number; caption: string }
  | { kind: "row"; row: number; caption: string }
  | { kind: "cell"; id: string; caption: string }
  | { kind: "range"; range: string; caption: string }
  | { kind: "type"; id: string; formula: string; caption: string }
  | { kind: "value"; id: string; value: string; caption: string }
  | { kind: "fill"; from: string; to: string; caption: string };

export function parseSpec(lines: string[]): { rows: string[][] | null; steps: Step[] } {
  const rows: string[][] = [];
  const steps: Step[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("|")) {
      rows.push(line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      continue;
    }
    const sep = line.indexOf(": ");
    const head = sep >= 0 ? line.slice(0, sep) : line;
    const caption = sep >= 0 ? line.slice(sep + 2) : "";
    const [cmd, a = "", ...rest] = head.split(/\s+/);
    const b = rest.join(" ");
    switch (cmd) {
      case "col": steps.push({ kind: "col", col: parseCellRef(`${a}1`)?.col ?? 0, caption }); break;
      case "row": steps.push({ kind: "row", row: Number(a) - 1, caption }); break;
      case "cell": steps.push({ kind: "cell", id: a.toUpperCase(), caption }); break;
      case "range": steps.push({ kind: "range", range: a.toUpperCase(), caption }); break;
      case "type": steps.push({ kind: "type", id: a.toUpperCase(), formula: b, caption }); break;
      case "value": steps.push({ kind: "value", id: a.toUpperCase(), value: b, caption }); break;
      case "fill": steps.push({ kind: "fill", from: a.toUpperCase(), to: b.toUpperCase(), caption }); break;
    }
  }
  return { rows: rows.length ? rows : null, steps };
}

/** Shift the relative references in a formula, leaving $-locked parts alone. */
function shiftFormula(formula: string, dRow: number, dCol: number): string {
  return formula.replace(/("[^"]*")|(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\d(A-Za-z])/g, (m, str, cAbs, col, rAbs, row) => {
    if (str) return str;
    const p = parseCellRef(`${col}${row}`);
    if (!p) return m;
    const newCol = cAbs ? p.col : p.col + dCol;
    const newRow = rAbs ? p.row : p.row + dRow;
    return `${cAbs}${cellId(newCol, 0).replace(/\d+$/, "")}${rAbs}${newRow + 1}`;
  });
}

/**
 * Work out the sheet the demo starts from (its own table, or the lesson's sheet
 * without the learner's target highlights) and the sheet after each step.
 */
export function runDemo(spec: ReturnType<typeof parseSpec>, lessonCells: WorksheetData, names: Record<string, string>) {
  let base: WorksheetData;
  if (spec.rows) {
    const cells: WorksheetData = {};
    spec.rows.forEach((r, ri) =>
      r.forEach((v, ci) => {
        if (v === "") return;
        const id = cellId(ci, ri);
        cells[id] = { id, value: parseCellInput(v), format: ri === 0 ? { bold: true } : undefined };
      })
    );
    base = recalcSheet(cells, names);
  } else {
    base = {};
    for (const [id, c] of Object.entries(lessonCells)) base[id] = { ...c, highlighted: false };
  }
  const states: WorksheetData[] = [];
  let cur = base;
  for (const step of spec.steps) {
    if (step.kind === "type" || step.kind === "value") {
      cur = recalcSheet({ ...cur, [step.id]: { ...cur[step.id], id: step.id, value: parseCellInput(step.kind === "type" ? step.formula : step.value) } }, names);
    } else if (step.kind === "fill") {
      const from = parseCellRef(step.from)!;
      const formula = cur[step.from]?.value.formula ?? "";
      const next = { ...cur };
      for (const id of parseRange(`${step.from}:${step.to}`)) {
        if (id === step.from) continue;
        const p = parseCellRef(id)!;
        next[id] = { ...next[id], id, value: parseCellInput(shiftFormula(formula, p.row - from.row, p.col - from.col)) };
      }
      cur = recalcSheet(next, names);
    }
    states.push(cur);
  }
  return { base, states };
}
