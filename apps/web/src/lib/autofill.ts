/**
 * AutoFill: what Excel writes when you drag the fill handle.
 *
 * - One number is copied; two or more numbers continue their step (1, 2 → 3, 4).
 * - Day and month names continue their list (Monday → Tuesday, Jan → Feb).
 * - Text ending in a number counts up (Week 1 → Week 2, Q1 → Q2).
 * - Formulas are copied with relative references moved ($ parts stay put).
 * - Anything else repeats the source cells.
 */
import { cellId } from "@/lib/formula-engine";

export type FillDirection = "down" | "up" | "right" | "left";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Which built-in list a word belongs to, its position, and whether it is the short form. */
function listMatch(text: string): { list: string[]; idx: number; short: boolean } | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  for (const list of [DAYS, MONTHS]) {
    let idx = list.findIndex((w) => w.toLowerCase() === t);
    if (idx >= 0) return { list, idx, short: false };
    idx = list.findIndex((w) => w.slice(0, 3).toLowerCase() === t);
    if (idx >= 0) return { list, idx, short: true };
  }
  return null;
}

/** Copy the capitalisation style of `sample` (UPPER, lower or Title) onto `word`. */
function matchCase(word: string, sample: string): string {
  const s = sample.trim();
  if (s === s.toUpperCase() && s !== s.toLowerCase()) return word.toUpperCase();
  if (s === s.toLowerCase()) return word.toLowerCase();
  return word;
}

const NUMBER_RE = /^[-+]?\d*\.?\d+$/;
const TRAILING_NUM_RE = /^(.*?)(\d+)$/;

function stepOf(nums: number[]): number {
  if (nums.length < 2) return 0;
  return (nums[nums.length - 1]! - nums[0]!) / (nums.length - 1);
}

const clean = (n: number) => parseFloat(n.toPrecision(15));

/**
 * The raw inputs to put in the next `count` cells, continuing `sources`
 * (given in fill order: the cell nearest the new cells comes last).
 * Formulas are returned unchanged here; the caller moves their references.
 */
export function fillSeries(sources: string[], count: number): string[] {
  const n = sources.length;
  if (n === 0 || count <= 0) return [];
  const trimmed = sources.map((s) => s.trim());

  // Numbers: a single one is copied, several continue their average step.
  if (trimmed.every((s) => NUMBER_RE.test(s))) {
    const nums = trimmed.map(Number);
    const step = stepOf(nums);
    const last = nums[n - 1]!;
    return Array.from({ length: count }, (_, i) => String(clean(last + step * (i + 1))));
  }

  // Day and month names.
  const matches = trimmed.map(listMatch);
  if (matches.every((m) => m && m.list === matches[0]!.list)) {
    const ms = matches as NonNullable<ReturnType<typeof listMatch>>[];
    const len = ms[0]!.list.length;
    // Unwrap positions so Saturday, Sunday counts as a step of +1, not -6.
    const positions = [ms[0]!.idx];
    for (let i = 1; i < n; i++) {
      let p = ms[i]!.idx;
      while (p < positions[i - 1]! - len / 2) p += len;
      while (p > positions[i - 1]! + len / 2) p -= len;
      positions.push(p);
    }
    const step = n === 1 ? 1 : Math.round(stepOf(positions)) || 1;
    const last = ms[n - 1]!;
    return Array.from({ length: count }, (_, i) => {
      const idx = (((positions[n - 1]! + step * (i + 1)) % len) + len) % len;
      const word = last.list[idx]!;
      return matchCase(last.short ? word.slice(0, 3) : word, sources[n - 1]!);
    });
  }

  // Text ending in a number, all with the same prefix: Week 1, Week 2 → Week 3.
  const parts = sources.map((s) => (s.startsWith("=") ? null : s.match(TRAILING_NUM_RE)));
  if (parts.every((p) => p && p[1] !== "" && p[1] === parts[0]![1])) {
    const prefix = parts[0]![1]!;
    const nums = parts.map((p) => parseInt(p![2]!, 10));
    const step = n === 1 ? 1 : Math.round(stepOf(nums)) || 1;
    const lastDigits = parts[n - 1]![2]!;
    const width = lastDigits.startsWith("0") ? lastDigits.length : 0;
    return Array.from({ length: count }, (_, i) => {
      const next = Math.abs(nums[n - 1]! + step * (i + 1));
      return prefix + String(next).padStart(width, "0");
    });
  }

  // Anything else (including formulas): repeat the source cells in turn,
  // except text-with-number entries in a mixed pattern still count up.
  return Array.from({ length: count }, (_, i) => {
    const src = sources[i % n]!;
    const m = src.startsWith("=") ? null : src.match(TRAILING_NUM_RE);
    if (m && m[1] !== "") {
      const round = Math.floor(i / n) + 1;
      return m[1]! + String(parseInt(m[2]!, 10) + round).padStart(m[2]!.startsWith("0") ? m[2]!.length : 0, "0");
    }
    return src;
  });
}

function colNumber(letters: string): number {
  let c = 0;
  for (const ch of letters.toUpperCase()) c = c * 26 + (ch.charCodeAt(0) - 64);
  return c - 1;
}

function colLetters(col: number): string {
  return cellId(col, 0).replace(/\d+$/, "");
}

/**
 * Move the relative references in a formula by (dCol, dRow), as Excel does when
 * a formula is copied. `$A$1` stays put, `$A1` only moves rows, `A$1` only columns.
 * Text inside quotes and function names (LOG10, ATAN2…) are left alone.
 */
export function shiftFormula(formula: string, dCol: number, dRow: number): string {
  if (dCol === 0 && dRow === 0) return formula;
  // Split out string literals so references inside "..." are never touched.
  return formula
    .split(/("(?:[^"]|"")*")/)
    .map((chunk, i) => {
      if (i % 2 === 1) return chunk;
      return chunk.replace(
        /(?<![A-Za-z0-9_.])(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?![A-Za-z0-9_(])/g,
        (whole, colAbs: string, col: string, rowAbs: string, row: string) => {
          const c = colAbs ? colNumber(col) : colNumber(col) + dCol;
          const r = rowAbs ? parseInt(row, 10) - 1 : parseInt(row, 10) - 1 + dRow;
          if (c < 0 || r < 0) return "#REF!";
          if (colNumber(col) > 16383) return whole; // not a cell reference
          return `${colAbs}${colLetters(c)}${rowAbs}${r + 1}`;
        }
      );
    })
    .join("");
}

export interface Rect {
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
}

/**
 * Where a fill-handle drag from `src` to the cell under the pointer fills:
 * Excel extends along whichever axis the pointer moved further outside the source.
 * Returns null while the pointer is still inside the source.
 */
export function fillTarget(src: Rect, pointer: { col: number; row: number }): { rect: Rect; dir: FillDirection } | null {
  const down = pointer.row - src.maxRow;
  const up = src.minRow - pointer.row;
  const right = pointer.col - src.maxCol;
  const left = src.minCol - pointer.col;
  const best = Math.max(down, up, right, left);
  if (best <= 0) return null;
  if (best === down) return { dir: "down", rect: { ...src, minRow: src.maxRow + 1, maxRow: pointer.row } };
  if (best === up) return { dir: "up", rect: { ...src, minRow: pointer.row, maxRow: src.minRow - 1 } };
  if (best === right) return { dir: "right", rect: { ...src, minCol: src.maxCol + 1, maxCol: pointer.col } };
  return { dir: "left", rect: { ...src, minCol: pointer.col, maxCol: src.minCol - 1 } };
}

/**
 * The raw inputs AutoFill writes, keyed by cell id. `rawAt` reads a source cell's
 * raw input ("" for blank). Each row (or column) of the source fills on its own.
 */
export function autoFill(
  src: Rect,
  target: { rect: Rect; dir: FillDirection },
  rawAt: (id: string) => string
): Record<string, string> {
  const out: Record<string, string> = {};
  const { rect, dir } = target;
  const vertical = dir === "down" || dir === "up";
  const forward = dir === "down" || dir === "right";

  const lanes = vertical ? range(src.minCol, src.maxCol) : range(src.minRow, src.maxRow);
  const srcSpan = vertical ? range(src.minRow, src.maxRow) : range(src.minCol, src.maxCol);
  const tgtSpan = vertical ? range(rect.minRow, rect.maxRow) : range(rect.minCol, rect.maxCol);
  // Fill order: sources ending next to the new cells, targets moving away from them.
  const srcOrder = forward ? srcSpan : [...srcSpan].reverse();
  const tgtOrder = forward ? tgtSpan : [...tgtSpan].reverse();

  for (const lane of lanes) {
    const at = (pos: number) => (vertical ? { col: lane, row: pos } : { col: pos, row: lane });
    const raws = srcOrder.map((p) => rawAt(cellId(at(p).col, at(p).row)));
    const values = fillSeries(raws, tgtOrder.length);
    tgtOrder.forEach((pos, i) => {
      let raw = values[i] ?? "";
      if (raw.startsWith("=")) {
        // Move references by the distance from the source cell this one copies.
        const from = at(srcOrder[i % srcOrder.length]!);
        const to = at(pos);
        raw = shiftFormula(raw, to.col - from.col, to.row - from.row);
      }
      const { col, row } = at(pos);
      out[cellId(col, row)] = raw;
    });
  }
  return out;
}

/** Cells to fill when the fill handle is double-clicked: down as far as the column beside has data. */
export function doubleClickFillRows(src: Rect, hasValue: (id: string) => boolean, rowCount: number): number | null {
  const neighbours = [src.minCol - 1, src.maxCol + 1].filter((c) => c >= 0);
  let lastRow = src.maxRow;
  for (const c of neighbours) {
    let r = src.maxRow + 1;
    while (r < rowCount && hasValue(cellId(c, r))) r++;
    lastRow = Math.max(lastRow, r - 1);
  }
  return lastRow > src.maxRow ? lastRow : null;
}

function range(a: number, b: number): number[] {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

