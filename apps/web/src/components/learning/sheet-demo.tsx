"use client";

import { useEffect, useMemo, useState } from "react";
import type { Workbook, WorksheetData } from "@/types/excel-learning";
import { cellId, formatCellValue, parseCellInput, parseCellRef, parseRange, recalcSheet } from "@/lib/formula-engine";
import { RichText } from "@/components/learning/lesson-notes";
import { cn } from "@/lib/utils";

/**
 * An animated mini spreadsheet that acts out a concept, written in lesson notes
 * as a ```show block. Each line is one step, "command target: caption":
 *
 *   col B: Columns are lettered across the top
 *   row 3: Rows are numbered down the side
 *   cell C5: Each cell has an address
 *   range A1:C5: A block of cells is a range
 *   type D2 =B2*C2: Formulas start with =      (types it, outlines the cells it uses, shows the result)
 *   fill D2 D5: Copy it down                    (copies D2's formula to D5, references shift)
 *   value E3 Hello: Type a value                (types a plain value into a cell)
 *
 * Optional "| a | b |" table lines before the steps replace the lesson's sheet as the data.
 */

type Step =
  | { kind: "col"; col: number; caption: string }
  | { kind: "row"; row: number; caption: string }
  | { kind: "cell"; id: string; caption: string }
  | { kind: "range"; range: string; caption: string }
  | { kind: "type"; id: string; formula: string; caption: string }
  | { kind: "value"; id: string; value: string; caption: string }
  | { kind: "fill"; from: string; to: string; caption: string };

// Colours for the cells a formula refers to, like Excel's coloured reference borders.
const REF_COLOURS = ["#22a95b", "#a855f7", "#f59e0b", "#ef4444", "#14b8a6"];

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

/** Ranges and cells a formula refers to (named ranges resolved through `names`). */
function referencedRanges(formula: string, names: Record<string, string>): string[] {
  const out: string[] = [];
  const body = formula.replace(/"[^"]*"/g, '""');
  for (const m of body.matchAll(/\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?(?![\d(A-Za-z])/g)) {
    out.push(m[0].replace(/\$/g, ""));
  }
  for (const [name, ref] of Object.entries(names)) {
    if (/LAMBDA/i.test(ref)) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z0-9_])${escaped}(?![A-Za-z0-9_\\[])`, "i").test(body)) out.push(ref.replace(/\$/g, ""));
  }
  return [...new Set(out)];
}

function idsOf(range: string): string[] {
  return range.includes(":") ? parseRange(range) : [range];
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

const STEP_MS = 3000;
const TYPE_MS = 70;

/** Number of steps in a ```show block, so the lesson deck can step through it. */
export function demoStepCount(lines: string[]): number {
  return parseSpec(lines).steps.length;
}

/** The explanation for one step of a ```show block. */
export function demoCaption(lines: string[], step: number): string {
  return parseSpec(lines).steps[step]?.caption ?? "";
}

/**
 * When `step` is given the demo is driven from outside (the lesson's Continue button)
 * and shows one step at a time; otherwise it plays through on its own and loops.
 */
export function SheetDemo({
  lines,
  workbook,
  step: controlledStep,
  hideCaption = false,
}: {
  lines: string[];
  workbook?: Workbook;
  step?: number;
  /** The lesson shows the step's text itself, above the grid. */
  hideCaption?: boolean;
}) {
  const spec = useMemo(() => parseSpec(lines), [lines]);
  const sheet = workbook?.sheets[0];
  const names = useMemo(() => sheet?.names ?? {}, [sheet]);

  const { base, states } = useMemo(() => runDemo(spec, sheet?.cells ?? {}, names), [spec, sheet, names]);

  // Grid size: the data plus every cell a step touches.
  const { cols, rows } = useMemo(() => {
    let maxCol = 2;
    let maxRow = 3;
    const touch = (id: string) => {
      const p = parseCellRef(id);
      if (p) { maxCol = Math.max(maxCol, p.col); maxRow = Math.max(maxRow, p.row); }
    };
    for (const s of states) for (const [id, c] of Object.entries(s)) if (c.value.type !== "blank") touch(id);
    for (const st of spec.steps) {
      if (st.kind === "cell" || st.kind === "type" || st.kind === "value") touch(st.id);
      if (st.kind === "range") idsOf(st.range).forEach(touch);
      if (st.kind === "fill") touch(st.to);
      if (st.kind === "col") maxCol = Math.max(maxCol, st.col);
      if (st.kind === "row") maxRow = Math.max(maxRow, st.row);
    }
    return { cols: Math.min(maxCol + 2, 9), rows: Math.min(maxRow + 2, 12) };
  }, [states, spec.steps]);

  const controlled = controlledStep !== undefined;
  const [ownIndex, setOwnIndex] = useState(0);
  const index = controlled ? Math.min(controlledStep, Math.max(0, spec.steps.length - 1)) : ownIndex;
  // Typing progress belongs to one step; moving to another step starts it from zero.
  const [typing, setTyping] = useState({ index: -1, typed: 0 });
  const typed = typing.index === index ? typing.typed : 0;
  const [playing, setPlaying] = useState(true);
  const step = spec.steps[index];
  const typingText = step?.kind === "type" ? step.formula : step?.kind === "value" ? step.value : "";
  const doneTyping = typed >= typingText.length;

  // Typing animation, then (when playing on its own) advance to the next step.
  useEffect(() => {
    if (!step) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doneTyping) {
      const t = setTimeout(() => setTyping({ index, typed: reduce ? typingText.length : typed + 1 }), TYPE_MS);
      return () => clearTimeout(t);
    }
    if (controlled || !playing) return;
    const t = setTimeout(
      () => setOwnIndex((i) => (i + 1) % spec.steps.length),
      step.kind === "type" || step.kind === "fill" ? STEP_MS + 600 : STEP_MS
    );
    return () => clearTimeout(t);
  }, [step, index, typed, doneTyping, controlled, playing, typingText.length, spec.steps.length]);

  if (!spec.steps.length) return null;

  // What's on screen for this step.
  const shown = (step?.kind === "type" || step?.kind === "value") && !doneTyping ? (index > 0 ? states[index - 1]! : base) : states[index]!;
  const activeId = step?.kind === "cell" || step?.kind === "type" || step?.kind === "value" ? step.id : step?.kind === "fill" ? step.from : null;
  const rangeIds = new Set(step?.kind === "range" ? idsOf(step.range) : step?.kind === "fill" ? parseRange(`${step.from}:${step.to}`) : []);
  const refColour = new Map<string, string>();
  if (step?.kind === "type" && step.formula.startsWith("=")) {
    referencedRanges(step.formula, names).forEach((r, i) => idsOf(r).forEach((id) => refColour.set(id, REF_COLOURS[i % REF_COLOURS.length]!)));
  }
  const spill = activeId ? shown[activeId]?.value.spillRange : undefined;
  const spillIds = new Set(spill && doneTyping ? parseRange(spill) : []);
  const barText =
    step?.kind === "type" || step?.kind === "value"
      ? typingText.slice(0, typed)
      : activeId
        ? shown[activeId]?.value.formula ?? (shown[activeId] ? formatCellValue(shown[activeId]!.value) : "")
        : "";
  const nameBox =
    step?.kind === "range" ? step.range : step?.kind === "col" ? `${cellId(step.col, 0).replace(/\d+$/, "")}:${cellId(step.col, 0).replace(/\d+$/, "")}` : step?.kind === "row" ? `${step.row + 1}:${step.row + 1}` : activeId ?? "A1";

  return (
    <div
      className="overflow-hidden rounded-2xl border-2 border-border bg-card"
      onMouseEnter={controlled ? undefined : () => setPlaying(false)}
      onMouseLeave={controlled ? undefined : () => setPlaying(true)}
    >
      {/* formula bar */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 font-mono text-[13px]">
        {/* Name Box and formula bar each get their own box, like Excel */}
        <span className="inline-flex w-24 shrink-0 items-center justify-between rounded-lg border border-border bg-background px-2.5 py-1 font-semibold text-brand">
          {nameBox}
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="m3 4.5 3 3 3-3" />
          </svg>
        </span>
        <span className="text-muted-foreground/50" aria-hidden>⋮</span>
        <span className="font-serif text-base font-bold italic text-brand">fx</span>
        <span className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-2.5 py-1">
          {barText || "\u00a0"}
          {(step?.kind === "type" || step?.kind === "value") && !doneTyping && <span className="ml-px inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-brand" />}
        </span>
      </div>

      {/* grid */}
      <div className="overflow-x-auto">
        <div className="grid min-w-max text-[13px]" style={{ gridTemplateColumns: `30px repeat(${cols}, minmax(72px, 1fr))` }}>
          <span className="border-b border-r border-border bg-muted/60" />
          {Array.from({ length: cols }).map((_, c) => {
            const on = step?.kind === "col" && step.col === c;
            return (
              <span
                key={c}
                className={cn(
                  "border-b border-r border-border py-1 text-center text-[11px] font-semibold transition-colors duration-300 last:border-r-0",
                  on ? "bg-brand text-brand-foreground" : "bg-muted/60 text-muted-foreground"
                )}
              >
                {cellId(c, 0).replace(/\d+$/, "")}
              </span>
            );
          })}
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="contents">
              <span
                className={cn(
                  "border-b border-r border-border py-1.5 text-center text-[11px] font-semibold transition-colors duration-300",
                  step?.kind === "row" && step.row === r ? "bg-brand text-brand-foreground" : "bg-muted/60 text-muted-foreground"
                )}
              >
                {r + 1}
              </span>
              {Array.from({ length: cols }).map((_, c) => {
                const id = cellId(c, r);
                const cell = shown[id];
                const inCol = step?.kind === "col" && step.col === c;
                const inRow = step?.kind === "row" && step.row === r;
                const active = id === activeId;
                const ref = refColour.get(id);
                const justFilled = step?.kind === "fill" && rangeIds.has(id) && id !== step.from;
                const isNewResult = active && (step?.kind === "type" || step?.kind === "value") && doneTyping;
                return (
                  <span
                    key={c}
                    className={cn(
                      "relative truncate border-b border-r border-border px-2 py-1.5 transition-colors duration-300 last:border-r-0",
                      typeof cell?.value.computed === "number" && "text-right tabular-nums",
                      cell?.format?.bold && "font-semibold",
                      (inCol || inRow || rangeIds.has(id) || spillIds.has(id)) && "bg-brand-soft",
                      active && "z-10 outline outline-[3px] -outline-offset-2 outline-brand"
                    )}
                    style={ref ? { boxShadow: `inset 0 0 0 2px ${ref}`, backgroundColor: `${ref}22` } : undefined}
                  >
                    <span
                      key={`${index}-${isNewResult || justFilled}`}
                      className={cn("block truncate", (isNewResult || justFilled) && "animate-in zoom-in-50 fade-in duration-300 font-semibold text-brand")}
                    >
                      {cell ? formatCellValue(cell.value, cell.format) : ""}
                    </span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* caption + step dots */}
      {!hideCaption && (
      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground shadow-[0_3px_0_var(--brand-deep)]">
          {index + 1}
        </span>
        <p key={index} className="min-w-0 flex-1 text-[15px] leading-snug animate-in fade-in slide-in-from-bottom-1 duration-300">
          <RichText text={step?.caption ?? ""} />
        </p>
        <div className="flex shrink-0 gap-1.5" aria-label={`Step ${index + 1} of ${spec.steps.length}`}>
          {spec.steps.map((_, i) =>
            controlled ? (
              <span key={i} className={cn("h-2.5 rounded-full transition-all", i === index ? "w-6 bg-brand" : i < index ? "w-2.5 bg-brand/50" : "w-2.5 bg-muted")} />
            ) : (
              <button
                key={i}
                type="button"
                aria-label={`Show step ${i + 1}`}
                onClick={() => setOwnIndex(i)}
                className={cn("h-2.5 rounded-full transition-all", i === index ? "w-6 bg-brand" : "w-2.5 bg-muted hover:bg-muted-foreground/40")}
              />
            )
          )}
        </div>
      </div>
      )}
    </div>
  );
}
