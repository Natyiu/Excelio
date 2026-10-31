/**
 * Spreadsheet Formula Engine
 *
 * A safe, client-side formula evaluator covering the Excel 365 functions taught in
 * the course, including dynamic arrays (results spill into neighbouring cells),
 * absolute references, named ranges, Table[Column] references, LET and LAMBDA.
 * Does NOT use eval() or the Function() constructor.
 */

import type { WorksheetData, CellValue } from "@/types/excel-learning";

// ─── Cell Reference Parsing ────────────────────────────────────────────────────

/** Parse a cell reference like "A1" or "$A$1" into { col: 0, row: 0 } (0-indexed) */
export function parseCellRef(ref: string): { col: number; row: number } | null {
  const match = ref.toUpperCase().match(/^(\$?)([A-Z]+)(\$?)(\d+)$/);
  if (!match || !match[2] || !match[4]) return null;
  const colStr = match[2];
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  const row = parseInt(match[4], 10);
  if (row < 1) return null;
  return { col: col - 1, row: row - 1 };
}

/** Convert 0-indexed col+row to cell ID like "A1" */
export function cellId(col: number, row: number): string {
  let colStr = "";
  let c = col + 1;
  while (c > 0) {
    colStr = String.fromCharCode(64 + (c % 26 || 26)) + colStr;
    c = Math.floor((c - 1) / 26);
  }
  return `${colStr}${row + 1}`;
}

/** Parse a range like "A1:C3" (or "$A$1:$C$3") into an array of cell IDs */
export function parseRange(range: string, _cells?: WorksheetData): string[] {
  const parts = range.replace(/\$/g, "").toUpperCase().split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return [];
  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  if (!start || !end) return [];
  const ids: string[] = [];
  for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
    for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
      ids.push(cellId(c, r));
    }
  }
  return ids;
}

// ─── Values ───────────────────────────────────────────────────────────────────

interface Err { kind: "err"; code: string }
type Scalar = number | string | boolean | null | Err;
interface Mat { kind: "mat"; v: Scalar[][] }
interface Lam { kind: "lam"; params: string[]; body: Node; env: Env }
type Val = Scalar | Mat | Lam;
type Env = Map<string, Val>;

const err = (code: string): Err => ({ kind: "err", code });
const isErr = (v: unknown): v is Err => typeof v === "object" && v !== null && (v as Err).kind === "err";
const isMat = (v: unknown): v is Mat => typeof v === "object" && v !== null && (v as Mat).kind === "mat";
const isLam = (v: unknown): v is Lam => typeof v === "object" && v !== null && (v as Lam).kind === "lam";
const mat = (v: Scalar[][]): Mat => ({ kind: "mat", v });
const E = {
  value: () => err("#VALUE!"),
  na: () => err("#N/A"),
  div0: () => err("#DIV/0!"),
  ref: () => err("#REF!"),
  name: () => err("#NAME?"),
  num: () => err("#NUM!"),
  calc: () => err("#CALC!"),
  spill: () => err("#SPILL!"),
};

class EvalError extends Error {
  constructor(public e: Err) {
    super(e.code);
  }
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type TokType = "num" | "str" | "ident" | "ref" | "op" | "(" | ")" | "," | ";" | "{" | "}" | ":" | "#" | "errlit";
interface Tok { t: TokType; v: string }

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '"') {
      let s = "";
      i++;
      while (i < src.length) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') { s += '"'; i += 2; continue; }
          break;
        }
        s += src[i++];
      }
      i++;
      out.push({ t: "str", v: s });
      continue;
    }
    if (/\d/.test(ch) || (ch === "." && /\d/.test(src[i + 1] ?? ""))) {
      const m = src.slice(i).match(/^\d*\.?\d+(?:[eE][+-]?\d+)?|^\d+\.?/);
      const num = m![0];
      // A digit run followed by ":" and a digit is a row range like 1:1 — not supported, treat as number.
      out.push({ t: "num", v: num });
      i += num.length;
      continue;
    }
    if (ch === "#") {
      const m = src.slice(i).match(/^#(N\/A|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|NULL!|CALC!|SPILL!)/i);
      if (m) { out.push({ t: "errlit", v: m[0].toUpperCase() }); i += m[0].length; continue; }
      out.push({ t: "#", v: "#" });
      i++;
      continue;
    }
    if (ch === "<" && (src[i + 1] === "=" || src[i + 1] === ">")) { out.push({ t: "op", v: ch + src[i + 1] }); i += 2; continue; }
    if (ch === ">" && src[i + 1] === "=") { out.push({ t: "op", v: ">=" }); i += 2; continue; }
    if ("+-*/^&=<>%".includes(ch)) { out.push({ t: "op", v: ch }); i++; continue; }
    if ("(),;{}:".includes(ch)) { out.push({ t: ch as TokType, v: ch }); i++; continue; }
    if (ch === "@") { i++; continue; } // implicit intersection: ignore
    if (/[A-Za-z_$\\]/.test(ch)) {
      const m = src.slice(i).match(/^[A-Za-z_$\\][A-Za-z0-9_.$]*/)!;
      let word = m[0];
      i += word.length;
      // Table[Column] structured reference
      if (src[i] === "[") {
        let depth = 0;
        let j = i;
        for (; j < src.length; j++) {
          if (src[j] === "[") depth++;
          else if (src[j] === "]") { depth--; if (depth === 0) break; }
        }
        word += src.slice(i, j + 1);
        i = j + 1;
        out.push({ t: "ident", v: word });
        continue;
      }
      const callsFn = /^\s*\(/.test(src.slice(i));
      if (!callsFn && /^\$?[A-Za-z]{1,3}\$?\d+$/.test(word)) {
        out.push({ t: "ref", v: word.toUpperCase() });
      } else {
        out.push({ t: "ident", v: word });
      }
      continue;
    }
    i++; // unknown character
  }
  return out;
}

// ─── Parser → AST ─────────────────────────────────────────────────────────────

type Node =
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "bool"; v: boolean }
  | { k: "err"; v: string }
  | { k: "ref"; v: string }
  | { k: "range"; a: string; b: string }
  | { k: "colrange"; a: string; b: string }
  | { k: "spill"; v: string }
  | { k: "name"; v: string }
  | { k: "call"; name: string; args: Node[] }
  | { k: "invoke"; fn: Node; args: Node[] }
  | { k: "un"; op: string; x: Node }
  | { k: "pct"; x: Node }
  | { k: "bin"; op: string; l: Node; r: Node }
  | { k: "arr"; rows: Node[][] }
  | { k: "empty" };

class Parser {
  pos = 0;
  constructor(private toks: Tok[]) {}
  peek(o = 0) { return this.toks[this.pos + o]; }
  next() { return this.toks[this.pos++]!; }
  isOp(...ops: string[]) { const t = this.peek(); return t?.t === "op" && ops.includes(t.v); }

  parseFormula(): Node {
    const n = this.cmp();
    if (this.pos < this.toks.length) throw new EvalError(E.value());
    return n;
  }
  cmp(): Node {
    let l = this.concat();
    while (this.isOp("=", "<>", "<", ">", "<=", ">=")) {
      const op = this.next().v;
      l = { k: "bin", op, l, r: this.concat() };
    }
    return l;
  }
  concat(): Node {
    let l = this.add();
    while (this.isOp("&")) { this.next(); l = { k: "bin", op: "&", l, r: this.add() }; }
    return l;
  }
  add(): Node {
    let l = this.mul();
    while (this.isOp("+", "-")) { const op = this.next().v; l = { k: "bin", op, l, r: this.mul() }; }
    return l;
  }
  mul(): Node {
    let l = this.pow();
    while (this.isOp("*", "/")) { const op = this.next().v; l = { k: "bin", op, l, r: this.pow() }; }
    return l;
  }
  pow(): Node {
    let l = this.unary();
    while (this.isOp("^")) { this.next(); l = { k: "bin", op: "^", l, r: this.unary() }; }
    return l;
  }
  unary(): Node {
    if (this.isOp("-")) { this.next(); return { k: "un", op: "-", x: this.unary() }; }
    if (this.isOp("+")) { this.next(); return this.unary(); }
    return this.postfix();
  }
  postfix(): Node {
    let n = this.primary();
    for (;;) {
      if (this.isOp("%")) { this.next(); n = { k: "pct", x: n }; continue; }
      if (this.peek()?.t === "(" && (n.k === "call" || n.k === "invoke" || n.k === "name")) {
        n = { k: "invoke", fn: n, args: this.args() };
        continue;
      }
      return n;
    }
  }
  args(): Node[] {
    this.next(); // (
    const args: Node[] = [];
    if (this.peek()?.t === ")") { this.next(); return args; }
    for (;;) {
      const t = this.peek();
      if (t?.t === "," || t?.t === ")") args.push({ k: "empty" });
      else args.push(this.cmp());
      const sep = this.next();
      if (!sep) throw new EvalError(E.value());
      if (sep.t === ")") return args;
      if (sep.t !== ",") throw new EvalError(E.value());
    }
  }
  primary(): Node {
    const t = this.next();
    if (!t) throw new EvalError(E.value());
    switch (t.t) {
      case "num": return { k: "num", v: parseFloat(t.v) };
      case "str": return { k: "str", v: t.v };
      case "errlit": return { k: "err", v: t.v };
      case "(": {
        const n = this.cmp();
        if (this.next()?.t !== ")") throw new EvalError(E.value());
        return n;
      }
      case "{": return this.arrayConst();
      case "ref": {
        if (this.peek()?.t === ":" && this.peek(1)?.t === "ref") {
          this.next();
          return { k: "range", a: t.v, b: this.next().v };
        }
        if (this.peek()?.t === "#") { this.next(); return { k: "spill", v: t.v }; }
        return { k: "ref", v: t.v };
      }
      case "ident": {
        const up = t.v.toUpperCase();
        if (this.peek()?.t === "(") return { k: "call", name: up, args: this.args() };
        if (up === "TRUE" || up === "FALSE") return { k: "bool", v: up === "TRUE" };
        // Whole-column range like B:B or $B:$D
        if (this.peek()?.t === ":" && /^\$?[A-Z]{1,3}$/.test(up)) {
          const nx = this.peek(1);
          if (nx?.t === "ident" && /^\$?[A-Z]{1,3}$/i.test(nx.v)) {
            this.next();
            this.next();
            return { k: "colrange", a: up.replace(/\$/g, ""), b: nx.v.toUpperCase().replace(/\$/g, "") };
          }
        }
        return { k: "name", v: t.v };
      }
      case "op":
        if (t.v === "-") return { k: "un", op: "-", x: this.unary() };
        break;
    }
    throw new EvalError(E.value());
  }
  arrayConst(): Node {
    const rows: Node[][] = [[]];
    for (;;) {
      const t = this.peek();
      if (!t) throw new EvalError(E.value());
      if (t.t === "}") { this.next(); break; }
      if (t.t === ",") { this.next(); continue; }
      if (t.t === ";") { this.next(); rows.push([]); continue; }
      rows[rows.length - 1]!.push(this.unary());
    }
    return { k: "arr", rows };
  }
}

// ─── Coercion helpers ─────────────────────────────────────────────────────────

function toNum(v: Scalar): number | Err {
  if (isErr(v)) return v;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === null || v === "") return 0;
  const s = v.trim().replace(/,/g, "");
  if (/^[-+]?\$?\d*\.?\d+(e[-+]?\d+)?%?$/i.test(s)) {
    const n = parseFloat(s.replace("$", ""));
    return s.endsWith("%") ? n / 100 : n;
  }
  const d = parseDateText(v);
  if (d !== null) return d;
  return E.value();
}
function num(v: Scalar): number {
  const n = toNum(v);
  if (isErr(n)) throw new EvalError(n);
  return n;
}
function toStr(v: Scalar): string {
  if (isErr(v)) throw new EvalError(v);
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return numToText(v);
  return v;
}
function numToText(n: number): string {
  return String(parseFloat(n.toPrecision(15)));
}
function toBool(v: Scalar): boolean {
  if (isErr(v)) throw new EvalError(v);
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (v === null || v === "") return false;
  const u = v.toUpperCase();
  if (u === "TRUE") return true;
  if (u === "FALSE") return false;
  throw new EvalError(E.value());
}
/** Excel-style comparison: numbers < text < booleans; text is case-insensitive. */
function compare(a: Scalar, b: Scalar): number {
  if (isErr(a)) throw new EvalError(a);
  if (isErr(b)) throw new EvalError(b);
  if (a === null) a = typeof b === "string" ? "" : typeof b === "boolean" ? false : 0;
  if (b === null) b = typeof a === "string" ? "" : typeof a === "boolean" ? false : 0;
  const rank = (x: Scalar) => (typeof x === "number" ? 0 : typeof x === "string" ? 1 : 2);
  const ra = rank(a), rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (typeof a === "string") {
    const x = a.toLowerCase(), y = (b as string).toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }
  const x = Number(a), y = Number(b);
  return x < y ? -1 : x > y ? 1 : 0;
}
function eq(a: Scalar, b: Scalar): boolean {
  if (isErr(a) || isErr(b)) return false;
  return compare(a, b) === 0;
}
function wildcardRe(pattern: string): RegExp {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === "~" && i + 1 < pattern.length) { re += pattern[++i]!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); continue; }
    if (c === "*") re += ".*";
    else if (c === "?") re += ".";
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "i");
}

// ─── Dates (Excel serial numbers) ─────────────────────────────────────────────

const DAY_MS = 86400000;
const EPOCH = Date.UTC(1899, 11, 30);
function serialFromParts(y: number, m: number, d: number): number {
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY_MS);
}
function partsFromSerial(serial: number): { y: number; m: number; d: number; wd: number } {
  const dt = new Date(EPOCH + Math.floor(serial) * DAY_MS);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), wd: dt.getUTCDay() };
}
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function parseDateText(s: string): number | null {
  const t = s.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return serialFromParts(+m[1]!, +m[2]!, +m[3]!);
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return serialFromParts(+m[3]!, +m[1]!, +m[2]!);
  m = t.match(/^(\d{1,2})[- ]([A-Za-z]{3})[A-Za-z]*[- ](\d{4})$/);
  if (m) {
    const mi = MONTHS.indexOf(m[2]!.toLowerCase());
    if (mi >= 0) return serialFromParts(+m[3]!, mi + 1, +m[1]!);
  }
  return null;
}
function dateArg(v: Scalar): number {
  if (typeof v === "string") {
    const d = parseDateText(v);
    if (d !== null) return d;
  }
  return num(v);
}
export function formatDateSerial(serial: number): string {
  const { y, m, d } = partsFromSerial(serial);
  return `${m}/${d}/${y}`;
}

// ─── Number formatting (TEXT function) ────────────────────────────────────────

function formatNumberPattern(n: number, fmt: string): string {
  const f = fmt.trim();
  if (/[dmy]/i.test(f) && !/[0#]/.test(f)) {
    const { y, m, d, wd } = partsFromSerial(n);
    return f.replace(/yyyy|yy|mmmm|mmm|mm|m|dddd|ddd|dd|d/gi, (tok) => {
      switch (tok.toLowerCase()) {
        case "yyyy": return String(y);
        case "yy": return String(y).slice(-2);
        case "mmmm": return MONTH_NAMES[m - 1]!;
        case "mmm": return MONTH_NAMES[m - 1]!.slice(0, 3);
        case "mm": return String(m).padStart(2, "0");
        case "m": return String(m);
        case "dddd": return DAY_NAMES[wd]!;
        case "ddd": return DAY_NAMES[wd]!.slice(0, 3);
        case "dd": return String(d).padStart(2, "0");
        default: return String(d);
      }
    });
  }
  // Up to four sections: positive;negative;zero;text. Colour codes like [Red] only affect cell colour.
  const sections = splitSections(f.replace(/\[[A-Za-z]+\d*\]/g, ""));
  if (sections.length > 1) {
    const sec = n < 0 ? sections[1] ?? sections[0]! : n === 0 && sections[2] !== undefined ? sections[2] : sections[0]!;
    const value = n < 0 && sections[1] !== undefined ? -n : n;
    if (!/[0#]/.test(sec)) return sec.replace(/"/g, "");
    return formatNumberPattern(value, sec);
  }
  const pct = f.includes("%");
  const v = pct ? n * 100 : n;
  const dec = (f.split(".")[1] ?? "").replace(/[^0#]/g, "").length;
  const grouped = f.includes(",");
  const abs = Math.abs(v);
  const intZeros = ((f.replace(/"[^"]*"/g, "").split(".")[0] ?? "").match(/0/g) ?? []).length;
  let body = abs.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, minimumIntegerDigits: Math.max(1, intZeros), useGrouping: grouped });
  const prefix = f.match(/^[^0#.,]*/)?.[0]?.replace(/"/g, "").replace(/[\\]/g, "") ?? "";
  const suffix = (f.match(/[^0#.,%]*$/)?.[0] ?? "").replace(/"/g, "");
  if (pct) body += "%";
  return (v < 0 ? "-" : "") + prefix + body + suffix;
}

function splitSections(f: string): string[] {
  const out: string[] = [];
  let cur = "", quoted = false;
  for (const ch of f) {
    if (ch === '"') quoted = !quoted;
    if (ch === ";" && !quoted) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

// ─── Evaluation context ───────────────────────────────────────────────────────

interface Ctx {
  cells: WorksheetData;
  names: Record<string, string>;
  env: Env;
  maxRow: number;
  depth: number;
}

function scalarOfCell(cells: WorksheetData, id: string): Scalar {
  const c = cells[id];
  if (!c) return null;
  if (c.value.error) return err(c.value.error);
  const v = c.value.computed;
  if (v === undefined || v === "") return v === "" && c.value.formula ? "" : null;
  return v;
}

function rangeMat(ctx: Ctx, a: string, b: string): Mat {
  const s = parseCellRef(a), e = parseCellRef(b);
  if (!s || !e) throw new EvalError(E.ref());
  const r0 = Math.min(s.row, e.row), r1 = Math.max(s.row, e.row);
  const c0 = Math.min(s.col, e.col), c1 = Math.max(s.col, e.col);
  const rows: Scalar[][] = [];
  for (let r = r0; r <= r1; r++) {
    const row: Scalar[] = [];
    for (let c = c0; c <= c1; c++) row.push(scalarOfCell(ctx.cells, cellId(c, r)));
    rows.push(row);
  }
  return mat(rows);
}

/** Expand an argument to a 2-D grid. */
function grid(v: Val): Scalar[][] {
  if (isMat(v)) return v.v;
  if (isLam(v)) throw new EvalError(E.value());
  return [[v]];
}
function flat(v: Val): Scalar[] {
  return grid(v).flat();
}
function shape(v: Scalar[][]): [number, number] {
  return [v.length, v[0]?.length ?? 0];
}
/** Unwrap a 1×1 array to a scalar. */
function simplify(v: Val): Val {
  if (isMat(v) && v.v.length === 1 && v.v[0]!.length === 1) return v.v[0]![0]!;
  return v;
}
function scalarOf(v: Val): Scalar {
  if (isLam(v)) throw new EvalError(E.value());
  if (isMat(v)) return v.v[0]?.[0] ?? null;
  return v;
}

/** Element-wise broadcast across any array arguments. */
function broadcast(vals: Val[], fn: (...xs: Scalar[]) => Scalar): Val {
  const grids = vals.map((v) => (isMat(v) ? v.v : null));
  if (grids.every((g) => g === null)) {
    try { return fn(...(vals as Scalar[])); } catch (e) { if (e instanceof EvalError) return e.e; throw e; }
  }
  let rows = 1, cols = 1;
  for (const g of grids) if (g) { rows = Math.max(rows, g.length); cols = Math.max(cols, g[0]?.length ?? 0); }
  const out: Scalar[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Scalar[] = [];
    for (let c = 0; c < cols; c++) {
      const xs = vals.map((v, i) => {
        const g = grids[i];
        if (!g) return v as Scalar;
        const gr = g.length === 1 ? 0 : r, gc = (g[0]?.length ?? 0) === 1 ? 0 : c;
        return g[gr]?.[gc] ?? E.na();
      });
      try { row.push(fn(...xs)); } catch (e) { if (e instanceof EvalError) row.push(e.e); else throw e; }
    }
    out.push(row);
  }
  return mat(out);
}

// ─── Evaluator ────────────────────────────────────────────────────────────────

function evalNode(n: Node, ctx: Ctx): Val {
  switch (n.k) {
    case "num": return n.v;
    case "str": return n.v;
    case "bool": return n.v;
    case "err": return err(n.v);
    case "empty": return null;
    case "ref": {
      if (!parseCellRef(n.v)) throw new EvalError(E.ref());
      return scalarOfCell(ctx.cells, n.v.replace(/\$/g, ""));
    }
    case "range": return rangeMat(ctx, n.a.replace(/\$/g, ""), n.b.replace(/\$/g, ""));
    case "colrange": return rangeMat(ctx, `${n.a}1`, `${n.b}${Math.max(1, ctx.maxRow)}`);
    case "spill": {
      const id = n.v.replace(/\$/g, "");
      const anchor = ctx.cells[id];
      const sr = anchor?.value.spillRange;
      if (!sr) return anchor ? scalarOfCell(ctx.cells, id) : E.ref();
      const [a, b] = sr.split(":");
      return rangeMat(ctx, a!, b!);
    }
    case "name": return resolveName(n.v, ctx);
    case "arr": return mat(n.rows.map((row) => row.map((x) => scalarOf(evalNode(x, ctx)))));
    case "un": return broadcast([evalNode(n.x, ctx)], (x) => -num(x));
    case "pct": return broadcast([evalNode(n.x, ctx)], (x) => num(x) / 100);
    case "bin": return binary(n.op, evalNode(n.l, ctx), evalNode(n.r, ctx));
    case "call": return callFn(n.name, n.args, ctx);
    case "invoke": {
      const fn = evalNode(n.fn, ctx);
      if (!isLam(fn)) throw new EvalError(E.value());
      return applyLambda(fn, n.args.map((a) => evalNode(a, ctx)), ctx);
    }
  }
}

function resolveName(raw: string, ctx: Ctx): Val {
  const key = raw.toUpperCase();
  if (ctx.env.has(key)) return ctx.env.get(key)!;
  for (const [name, ref] of Object.entries(ctx.names)) {
    if (name.toUpperCase() === key) {
      const r = ref.replace(/^=/, "").replace(/\$/g, "");
      if (r.includes(":")) {
        const [a, b] = r.split(":");
        return rangeMat(ctx, a!, b!);
      }
      if (parseCellRef(r)) return scalarOfCell(ctx.cells, r) ?? 0;
      const n = Number(r);
      return isNaN(n) ? r : n;
    }
  }
  throw new EvalError(E.name());
}

function binary(op: string, l: Val, r: Val): Val {
  return broadcast([l, r], (a, b) => {
    if (isErr(a)) return a;
    if (isErr(b)) return b;
    switch (op) {
      case "+": return num(a) + num(b);
      case "-": return num(a) - num(b);
      case "*": return num(a) * num(b);
      case "/": { const d = num(b); if (d === 0) return E.div0(); return num(a) / d; }
      case "^": return Math.pow(num(a), num(b));
      case "&": return toStr(a) + toStr(b);
      case "=": return compare(a, b) === 0;
      case "<>": return compare(a, b) !== 0;
      case "<": return compare(a, b) < 0;
      case ">": return compare(a, b) > 0;
      case "<=": return compare(a, b) <= 0;
      case ">=": return compare(a, b) >= 0;
    }
    return E.value();
  });
}

function applyLambda(fn: Lam, args: Val[], ctx: Ctx): Val {
  if (args.length > fn.params.length) throw new EvalError(E.value());
  const env: Env = new Map(fn.env);
  fn.params.forEach((p, i) => env.set(p, args[i] ?? null));
  if (ctx.depth > 200) throw new EvalError(E.num());
  return evalNode(fn.body, { ...ctx, env, depth: ctx.depth + 1 });
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

/** Numbers from arguments, Excel style: in arrays only real numbers count; typed args are coerced. */
function numbersOf(vals: Val[], opts: { skipErrors?: boolean } = {}): number[] {
  const out: number[] = [];
  for (const v of vals) {
    if (isMat(v)) {
      for (const x of v.v.flat()) {
        if (isErr(x)) { if (opts.skipErrors) continue; throw new EvalError(x); }
        if (typeof x === "number") out.push(x);
      }
    } else if (isLam(v)) {
      throw new EvalError(E.value());
    } else if (v !== null) {
      if (isErr(v)) { if (opts.skipErrors) continue; throw new EvalError(v); }
      out.push(num(v));
    }
  }
  return out;
}
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]) => { if (!xs.length) throw new EvalError(E.div0()); return sum(xs) / xs.length; };
function median(xs: number[]): number {
  if (!xs.length) throw new EvalError(E.num());
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
function stdev(xs: number[], sample: boolean): number {
  if (xs.length < (sample ? 2 : 1)) throw new EvalError(E.div0());
  const m = mean(xs);
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - (sample ? 1 : 0)));
}
function modes(xs: number[]): number[] {
  const counts = new Map<number, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best = 1;
  for (const c of counts.values()) best = Math.max(best, c);
  if (best < 2) throw new EvalError(E.na());
  const out: number[] = [];
  for (const x of xs) if (counts.get(x) === best && !out.includes(x)) out.push(x);
  return out;
}
function kth(xs: number[], k: number, largest: boolean): number {
  const s = [...xs].sort((a, b) => (largest ? b - a : a - b));
  if (k < 1 || k > s.length) throw new EvalError(E.num());
  return s[Math.floor(k) - 1]!;
}

function matchCriteria(cell: Scalar, criteria: Scalar): boolean {
  if (isErr(cell)) return false;
  if (criteria === null) return cell === null || cell === "";
  if (typeof criteria === "number" || typeof criteria === "boolean") return cell !== null && eq(cell, criteria);
  if (isErr(criteria)) throw new EvalError(criteria);
  const m = criteria.match(/^(>=|<=|<>|>|<|=)?([\s\S]*)$/)!;
  const op = m[1] ?? "=";
  const rhs = m[2] ?? "";
  if (rhs === "" && (op === "=" || op === "<>")) {
    const blank = cell === null || cell === "";
    return op === "=" ? blank : !blank;
  }
  let target: Scalar = rhs;
  const n = toNum(rhs);
  if (!isErr(n) && rhs.trim() !== "") target = n;
  else if (rhs.toUpperCase() === "TRUE" || rhs.toUpperCase() === "FALSE") target = rhs.toUpperCase() === "TRUE";
  if (cell === null && op !== "<>") return false;
  if (typeof target === "string" && (op === "=" || op === "<>")) {
    const hit = /[*?]/.test(target) ? wildcardRe(target).test(toStr(cell)) : toStr(cell).toLowerCase() === target.toLowerCase();
    return op === "=" ? hit : !hit;
  }
  if (typeof target === "number" && typeof cell !== "number") return op === "<>";
  const c = compare(cell, target);
  switch (op) {
    case "=": return c === 0;
    case "<>": return c !== 0;
    case ">": return c > 0;
    case "<": return c < 0;
    case ">=": return c >= 0;
    default: return c <= 0;
  }
}

/** Rows (indexes into the flattened range) passing every criteria pair. */
function criteriaMask(pairs: Array<[Val, Val]>): boolean[] {
  const ranges = pairs.map(([r]) => flat(r));
  const len = ranges[0]?.length ?? 0;
  if (ranges.some((r) => r.length !== len)) throw new EvalError(E.value());
  const mask: boolean[] = [];
  for (let i = 0; i < len; i++) mask.push(pairs.every(([, c], j) => matchCriteria(ranges[j]![i]!, scalarOf(c))));
  return mask;
}
function pairsFrom(vals: Val[], start: number): Array<[Val, Val]> {
  const pairs: Array<[Val, Val]> = [];
  for (let i = start; i + 1 < vals.length; i += 2) pairs.push([vals[i]!, vals[i + 1]!]);
  return pairs;
}

/** Vectorise a criteria function over an array of criteria (e.g. COUNTIF(range, B2:B9)). */
function overCriteria(crit: Val, fn: (c: Scalar) => Scalar): Val {
  if (isMat(crit)) return mat(crit.v.map((row) => row.map((c) => { try { return fn(c); } catch (e) { if (e instanceof EvalError) return e.e; throw e; } })));
  return fn(scalarOf(crit));
}

/** Run a *IFS function once per criteria value when any criteria argument is an array. */
function overCriteriaPairs(args: Val[], start: number, fn: (pairs: Array<[Val, Val]>) => Scalar): Val {
  const pairs = pairsFrom(args, start);
  if (!pairs.some(([, c]) => isMat(c))) return fn(pairs);
  return broadcast(pairs.map(([, c]) => c), (...cs) => fn(pairs.map(([r], i) => [r, cs[i] ?? null])));
}

// ─── Rounding ─────────────────────────────────────────────────────────────────

const clean = (n: number) => parseFloat(n.toPrecision(15));
function roundTo(n: number, digits: number, mode: "half" | "up" | "down"): number {
  const f = Math.pow(10, Math.trunc(digits));
  const x = clean(Math.abs(n) * f);
  const r = mode === "half" ? Math.floor(x + 0.5) : mode === "up" ? Math.ceil(x) : Math.floor(x);
  return clean((Math.sign(n) * r) / f);
}
function roundToMultiple(n: number, m: number, mode: "nearest" | "up" | "down"): number {
  if (m === 0) return 0;
  const q = clean(n / m);
  const r = mode === "nearest" ? Math.sign(q) * Math.floor(Math.abs(q) + 0.5) : mode === "up" ? Math.ceil(q) : Math.floor(q);
  return clean(r * m);
}

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Position of a value in a 1-D list. matchMode: 0 exact, -1 exact/next smaller, 1 exact/next larger, 2 wildcard. */
function findIndex(list: Scalar[], value: Scalar, matchMode: number, searchMode: number): number {
  const order = list.map((_, i) => i);
  if (searchMode === -1 || searchMode === -2) order.reverse();
  if (matchMode === 2 && typeof value === "string") {
    const re = wildcardRe(value);
    return order.find((i) => !isErr(list[i]!) && re.test(toStr(list[i]!))) ?? -1;
  }
  for (const i of order) if (!isErr(list[i]!) && list[i] !== null && eq(list[i]!, value)) return i;
  if (matchMode === 0 || matchMode === 2) return -1;
  let best = -1;
  for (const i of order) {
    const x = list[i]!;
    if (isErr(x) || x === null) continue;
    if (typeof x !== typeof value) continue;
    const c = compare(x, value);
    if (matchMode === -1 && c < 0 && (best < 0 || compare(x, list[best]!) > 0)) best = i;
    if (matchMode === 1 && c > 0 && (best < 0 || compare(x, list[best]!) < 0)) best = i;
  }
  return best;
}
/** Approximate match on sorted data (VLOOKUP TRUE / MATCH 1): last item ≤ value. */
function approxSorted(list: Scalar[], value: Scalar, descending = false): number {
  let best = -1;
  for (let i = 0; i < list.length; i++) {
    const x = list[i]!;
    if (x === null || isErr(x) || typeof x !== typeof value) continue;
    const c = compare(x, value);
    if (descending ? c >= 0 : c <= 0) best = i;
    else break;
  }
  return best;
}
function isVector(g: Scalar[][]) { return g.length === 1 || (g[0]?.length ?? 0) === 1; }
function rowsOf(g: Scalar[][]) { return g; }
function colsOf(g: Scalar[][]) { return (g[0] ?? []).map((_, c) => g.map((row) => row[c]!)); }
function transpose(g: Scalar[][]) { return colsOf(g); }

function sortRows(rows: Scalar[][], keys: Array<{ get: (row: Scalar[], i: number) => Scalar; order: number }>): Scalar[][] {
  const idx = rows.map((_, i) => i);
  idx.sort((a, b) => {
    for (const k of keys) {
      const c = compare(k.get(rows[a]!, a) ?? null, k.get(rows[b]!, b) ?? null);
      if (c !== 0) return c * k.order;
    }
    return a - b;
  });
  return idx.map((i) => rows[i]!);
}
function uniqueRows(rows: Scalar[][], exactlyOnce: boolean): Scalar[][] {
  const keyOf = (r: Scalar[]) => r.map((x) => (isErr(x) ? x.code : typeof x === "string" ? "s:" + x.toLowerCase() : typeof x + ":" + String(x))).join("\u0001");
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(keyOf(r), (counts.get(keyOf(r)) ?? 0) + 1);
  const seen = new Set<string>();
  const out: Scalar[][] = [];
  for (const r of rows) {
    const k = keyOf(r);
    if (seen.has(k)) continue;
    seen.add(k);
    if (!exactlyOnce || counts.get(k) === 1) out.push(r);
  }
  return out;
}

// ─── Functions ────────────────────────────────────────────────────────────────

const LAZY = new Set(["IF", "IFS", "IFERROR", "IFNA", "LET", "LAMBDA", "SWITCH", "CHOOSE", "AND", "OR"]);

function callFn(name: string, argNodes: Node[], ctx: Ctx): Val {
  if (LAZY.has(name)) return lazyFn(name, argNodes, ctx);
  // A LET/LAMBDA variable holding a lambda can be called by name.
  if (ctx.env.has(name)) {
    const f = ctx.env.get(name)!;
    if (isLam(f)) return applyLambda(f, argNodes.map((a) => evalNode(a, ctx)), ctx);
  }
  const named = Object.entries(ctx.names).find(([k]) => k.toUpperCase() === name);
  if (named && /^=?\s*LAMBDA\s*\(/i.test(named[1])) {
    const f = evalNode(new Parser(tokenize(named[1].replace(/^=/, ""))).parseFormula(), ctx);
    if (isLam(f)) return applyLambda(f, argNodes.map((a) => evalNode(a, ctx)), ctx);
  }
  const args = argNodes.map((a) => evalNode(a, ctx));
  const a = (i: number): Val => args[i] ?? null;
  const s = (i: number): Scalar => scalarOf(a(i));
  const has = (i: number) => i < argNodes.length && argNodes[i]!.k !== "empty";
  const n = (i: number, d?: number): number => (has(i) ? num(s(i)) : d ?? 0);
  // Optional arguments the caller left out arrive as null.
  const vec = (fn: (...xs: Scalar[]) => Scalar) =>
    broadcast([...args, ...Array<Val>(Math.max(0, fn.length - args.length)).fill(null)], fn);

  switch (name) {
    // ── Aggregates ──
    case "SUM": return sum(numbersOf(args));
    case "AVERAGE": return mean(numbersOf(args));
    case "MIN": { const xs = numbersOf(args); return xs.length ? Math.min(...xs) : 0; }
    case "MAX": { const xs = numbersOf(args); return xs.length ? Math.max(...xs) : 0; }
    case "PRODUCT": return numbersOf(args).reduce((p, x) => p * x, 1);
    case "COUNT": {
      let c = 0;
      for (const v of args) {
        if (isMat(v)) c += v.v.flat().filter((x) => typeof x === "number").length;
        else if (typeof v === "number" || typeof v === "boolean" || (typeof v === "string" && !isErr(toNum(v)) && v.trim() !== "")) c++;
      }
      return c;
    }
    case "COUNTA": {
      let c = 0;
      args.forEach((v, i) => {
        if (isMat(v)) c += v.v.flat().filter((x) => x !== null).length;
        else if (has(i) && !(v === null && argNodes[i]!.k === "ref")) c++;
      });
      return c;
    }
    case "COUNTBLANK": return flat(a(0)).filter((x) => x === null || x === "").length;
    case "MEDIAN": return median(numbersOf(args));
    case "MODE":
    case "MODE.SNGL": return modes(numbersOf(args))[0]!;
    case "MODE.MULT": return simplify(mat(modes(numbersOf(args)).map((x) => [x])));
    case "STDEV":
    case "STDEV.S": return stdev(numbersOf(args), true);
    case "STDEV.P": return stdev(numbersOf(args), false);
    case "VAR":
    case "VAR.S": return stdev(numbersOf(args), true) ** 2;
    case "LARGE":
    case "SMALL": {
      const xs = numbersOf([a(0)]);
      return broadcast([a(1)], (k) => kth(xs, num(k), name === "LARGE"));
    }
    case "RANK":
    case "RANK.EQ":
    case "RANK.AVG": {
      const xs = numbersOf([a(1)]);
      const asc = has(2) && n(2) !== 0;
      return broadcast([a(0)], (v) => {
        const x = num(v);
        if (!xs.includes(x)) throw new EvalError(E.na());
        const better = xs.filter((y) => (asc ? y < x : y > x)).length;
        const ties = xs.filter((y) => y === x).length;
        return name === "RANK.AVG" ? better + (ties + 1) / 2 : better + 1;
      });
    }
    case "SUBTOTAL": {
      const code = n(0) % 100;
      const vals = args.slice(1).map((v, i) => withoutNestedTotals(v, argNodes[i + 1]!, ctx));
      return aggregateBy(code, vals, false);
    }
    case "AGGREGATE": {
      const code = n(0);
      const opt = n(1);
      const skipErrors = [2, 3, 6, 7].includes(opt);
      if (code === 14 || code === 15) {
        const xs = numbersOf([a(2)], { skipErrors });
        return broadcast([a(3)], (k) => kth(xs, num(k), code === 14));
      }
      const vals = args.slice(2).map((v, i) => withoutNestedTotals(v, argNodes[i + 2]!, ctx));
      return aggregateBy(code, vals, skipErrors);
    }
    case "SUMPRODUCT": {
      const gs = args.map(grid);
      const [r, c] = shape(gs[0]!);
      if (gs.some((g) => g.length !== r || (g[0]?.length ?? 0) !== c)) return E.value();
      let total = 0;
      for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
        let p = 1;
        for (const g of gs) { const x = g[i]![j]!; if (isErr(x)) throw new EvalError(x); p *= typeof x === "number" ? x : 0; }
        total += p;
      }
      return total;
    }

    // ── Conditional aggregates ──
    case "COUNTIF": return overCriteria(a(1), (c) => criteriaMask([[a(0), c]]).filter(Boolean).length);
    case "COUNTIFS": return overCriteriaPairs(args, 0, (pairs) => criteriaMask(pairs).filter(Boolean).length);
    case "SUMIF":
    case "AVERAGEIF": {
      const target = flat(has(2) ? a(2) : a(0));
      return overCriteria(a(1), (c) => {
        const mask = criteriaMask([[a(0), c]]);
        const xs = mask.flatMap((m, i) => (m && typeof target[i] === "number" ? [target[i] as number] : []));
        return name === "SUMIF" ? sum(xs) : mean(xs);
      });
    }
    case "SUMIFS":
    case "AVERAGEIFS":
    case "MAXIFS":
    case "MINIFS": {
      const target = flat(a(0));
      return overCriteriaPairs(args, 1, (pairs) => {
        const mask = criteriaMask(pairs);
        if (mask.length !== target.length) throw new EvalError(E.value());
        const xs = mask.flatMap((m, i) => (m && typeof target[i] === "number" ? [target[i] as number] : []));
        if (name === "SUMIFS") return sum(xs);
        if (name === "AVERAGEIFS") return mean(xs);
        if (!xs.length) return 0;
        return name === "MAXIFS" ? Math.max(...xs) : Math.min(...xs);
      });
    }

    // ── Logic ──
    case "NOT": return vec((x) => !toBool(x));
    case "XOR": {
      let t = 0;
      for (const v of args) for (const x of flat(v)) if (x !== null && toBool(x)) t++;
      return t % 2 === 1;
    }
    case "TRUE": return true;
    case "FALSE": return false;
    case "NA": return E.na();
    case "ISNUMBER": return vec((x) => typeof x === "number");
    case "ISTEXT": return vec((x) => typeof x === "string");
    case "ISBLANK": return vec((x) => x === null);
    case "ISERROR": return vec((x) => isErr(x));
    case "ISNA": return vec((x) => isErr(x) && x.code === "#N/A");
    case "ISEVEN": return vec((x) => Math.trunc(num(x)) % 2 === 0);
    case "ISODD": return vec((x) => Math.abs(Math.trunc(num(x)) % 2) === 1);

    // ── Math & rounding ──
    case "ABS": return vec((x) => Math.abs(num(x)));
    case "SQRT": return vec((x) => { const v = num(x); if (v < 0) throw new EvalError(E.num()); return Math.sqrt(v); });
    case "POWER": return vec((x, p) => Math.pow(num(x), num(p)));
    case "MOD": return vec((x, d) => { const dv = num(d); if (dv === 0) throw new EvalError(E.div0()); const r = num(x) % dv; return clean(r !== 0 && Math.sign(r) !== Math.sign(dv) ? r + dv : r); });
    case "INT": return vec((x) => Math.floor(num(x)));
    case "TRUNC": return vec((x, d) => roundTo(num(x), d === null ? 0 : num(d), "down"));
    case "ROUND": return vec((x, d) => roundTo(num(x), d === null ? 0 : num(d), "half"));
    case "ROUNDUP": return vec((x, d) => roundTo(num(x), d === null ? 0 : num(d), "up"));
    case "ROUNDDOWN": return vec((x, d) => roundTo(num(x), d === null ? 0 : num(d), "down"));
    case "MROUND": return vec((x, m) => { const v = num(x), mv = num(m); if (v * mv < 0) throw new EvalError(E.num()); return roundToMultiple(v, mv, "nearest"); });
    case "CEILING": return vec((x, m) => roundToMultiple(num(x), m === null ? 1 : num(m), "up"));
    case "FLOOR": return vec((x, m) => roundToMultiple(num(x), m === null ? 1 : num(m), "down"));
    case "CEILING.MATH": return vec((x, m) => roundToMultiple(num(x), m === null ? 1 : Math.abs(num(m)), "up"));
    case "FLOOR.MATH": return vec((x, m) => roundToMultiple(num(x), m === null ? 1 : Math.abs(num(m)), "down"));
    case "PI": return Math.PI;
    case "EXP": return vec((x) => Math.exp(num(x)));
    case "LN": return vec((x) => { const v = num(x); if (v <= 0) throw new EvalError(E.num()); return Math.log(v); });
    case "LOG10": return vec((x) => Math.log10(num(x)));
    case "LOG": return vec((x, b) => Math.log(num(x)) / Math.log(b === null ? 10 : num(b)));
    case "SIGN": return vec((x) => Math.sign(num(x)));
    case "RAND": return Math.random();
    case "RANDBETWEEN": return vec((lo, hi) => { const l = Math.ceil(num(lo)), h = Math.floor(num(hi)); return l + Math.floor(Math.random() * (h - l + 1)); });
    case "RANDARRAY": {
      const rows = n(0, 1), cols = n(1, 1), lo = n(2, 0), hi = n(3, 1);
      const whole = has(4) && toBool(s(4));
      const out: Scalar[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: Scalar[] = [];
        for (let c = 0; c < cols; c++) row.push(whole ? Math.ceil(lo) + Math.floor(Math.random() * (Math.floor(hi) - Math.ceil(lo) + 1)) : lo + Math.random() * (hi - lo));
        out.push(row);
      }
      return simplify(mat(out));
    }
    case "SEQUENCE": {
      const rows = n(0, 1), cols = n(1, 1), start = n(2, 1), step = n(3, 1);
      if (rows < 1 || cols < 1) return E.calc();
      const out: Scalar[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: Scalar[] = [];
        for (let c = 0; c < cols; c++) row.push(clean(start + (r * cols + c) * step));
        out.push(row);
      }
      return simplify(mat(out));
    }

    // ── Text ──
    case "LEN": return vec((x) => toStr(x).length);
    case "LEFT": return vec((x, k) => toStr(x).slice(0, k === null ? 1 : num(k)));
    case "RIGHT": return vec((x, k) => { const t = toStr(x), c = k === null ? 1 : num(k); return c <= 0 ? "" : t.slice(-c); });
    case "MID": return vec((x, st, k) => toStr(x).substr(num(st) - 1, num(k)));
    case "TRIM": return vec((x) => toStr(x).trim().replace(/ +/g, " "));
    case "CLEAN": return vec((x) => toStr(x).replace(/[\x00-\x1f]/g, ""));
    case "UPPER": return vec((x) => toStr(x).toUpperCase());
    case "LOWER": return vec((x) => toStr(x).toLowerCase());
    case "PROPER": return vec((x) => toStr(x).toLowerCase().replace(/(^|[^a-z])([a-z])/g, (_, p, c) => p + c.toUpperCase()));
    case "REPT": return vec((x, k) => toStr(x).repeat(Math.max(0, Math.floor(num(k)))));
    case "EXACT": return vec((x, y) => toStr(x) === toStr(y));
    case "CONCAT": return args.map((v) => flat(v).map(toStr).join("")).join("");
    case "CONCATENATE": return vec((...xs) => xs.map(toStr).join(""));
    case "TEXTJOIN": {
      const delim = toStr(s(0));
      const skip = has(1) ? toBool(s(1)) : true;
      const parts = args.slice(2).flatMap((v) => flat(v).map(toStr)).filter((p) => !skip || p !== "");
      return parts.join(delim);
    }
    case "SUBSTITUTE": return vec((x, o, nw, inst) => {
      const t = toStr(x), old = toStr(o), rep = toStr(nw);
      if (!old) return t;
      if (inst === null) return t.split(old).join(rep);
      let count = 0;
      const want = num(inst);
      return t.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), (mm) => (++count === want ? rep : mm));
    });
    case "FIND":
    case "SEARCH": return vec((f, w, st) => {
      const start = st === null ? 0 : num(st) - 1;
      const hay = toStr(w), needle = toStr(f);
      if (name === "SEARCH") {
        const sub = hay.slice(start).toLowerCase();
        const m = sub.match(new RegExp(wildcardRe(needle).source.slice(1, -1), "i"));
        if (!m || m.index === undefined) throw new EvalError(E.value());
        return m.index + start + 1;
      }
      const idx = hay.indexOf(needle, start);
      if (idx < 0) throw new EvalError(E.value());
      return idx + 1;
    });
    case "TEXTBEFORE":
    case "TEXTAFTER": return vec((x, d, inst) => {
      const t = toStr(x), delim = toStr(d);
      const k = inst === null ? 1 : num(inst);
      let pos = -1;
      if (k > 0) { let from = 0; for (let i = 0; i < k; i++) { pos = t.indexOf(delim, from); if (pos < 0) break; from = pos + delim.length; } }
      else { let from = t.length; for (let i = 0; i < -k; i++) { pos = t.lastIndexOf(delim, from); if (pos < 0) break; from = pos - 1; } }
      if (pos < 0) throw new EvalError(E.na());
      return name === "TEXTBEFORE" ? t.slice(0, pos) : t.slice(pos + delim.length);
    });
    case "TEXTSPLIT": {
      const t = toStr(s(0)), col = toStr(s(1));
      const rowD = has(2) ? toStr(s(2)) : null;
      const rows = rowD ? t.split(rowD) : [t];
      const g = rows.map((r) => r.split(col) as Scalar[]);
      const w = Math.max(...g.map((r) => r.length));
      return simplify(mat(g.map((r) => [...r, ...Array(w - r.length).fill(E.na())])));
    }
    case "VALUE": return vec((x) => { const v = toNum(x); if (isErr(v) || (typeof x === "string" && x.trim() === "")) throw new EvalError(E.value()); return v; });
    case "TEXT": return vec((x, f) => {
      const v = typeof x === "string" ? toNum(x) : x;
      if (isErr(v) || typeof v !== "number") return toStr(x);
      return formatNumberPattern(v, toStr(f));
    });
    case "CHAR": return vec((x) => String.fromCharCode(num(x)));
    case "HYPERLINK": return has(1) ? s(1) : s(0);

    // ── Dates ──
    case "DATE": return vec((y, m, d) => serialFromParts(num(y), num(m), num(d)));
    case "TODAY": { const t = new Date(); return serialFromParts(t.getFullYear(), t.getMonth() + 1, t.getDate()); }
    case "NOW": { const t = new Date(); return serialFromParts(t.getFullYear(), t.getMonth() + 1, t.getDate()) + (t.getHours() * 60 + t.getMinutes()) / 1440; }
    case "YEAR": return vec((x) => partsFromSerial(dateArg(x)).y);
    case "MONTH": return vec((x) => partsFromSerial(dateArg(x)).m);
    case "DAY": return vec((x) => partsFromSerial(dateArg(x)).d);
    case "WEEKDAY": return vec((x, t) => {
      const wd = partsFromSerial(dateArg(x)).wd; // 0 = Sunday
      const type = t === null ? 1 : num(t);
      if (type === 2) return wd === 0 ? 7 : wd;
      if (type === 3) return wd === 0 ? 6 : wd - 1;
      return wd + 1;
    });
    case "EDATE":
    case "EOMONTH": return vec((x, k) => {
      const { y, m, d } = partsFromSerial(dateArg(x));
      const mm = m + num(k);
      if (name === "EOMONTH") return serialFromParts(y, mm + 1, 0);
      const last = partsFromSerial(serialFromParts(y, mm + 1, 0)).d;
      return serialFromParts(y, mm, Math.min(d, last));
    });
    case "DATEDIF": return vec((a1, b1, u) => {
      const x = dateArg(a1), y = dateArg(b1);
      if (y < x) throw new EvalError(E.num());
      const p = partsFromSerial(x), q = partsFromSerial(y);
      switch (toStr(u).toUpperCase()) {
        case "D": return y - x;
        case "M": return (q.y - p.y) * 12 + q.m - p.m - (q.d < p.d ? 1 : 0);
        case "Y": return q.y - p.y - (q.m < p.m || (q.m === p.m && q.d < p.d) ? 1 : 0);
        default: throw new EvalError(E.num());
      }
    });
    case "NETWORKDAYS": {
      const x = dateArg(s(0)), y = dateArg(s(1));
      let c = 0;
      for (let d = Math.min(x, y); d <= Math.max(x, y); d++) { const wd = partsFromSerial(d).wd; if (wd !== 0 && wd !== 6) c++; }
      return y < x ? -c : c;
    }

    // ── Lookup & reference ──
    case "VLOOKUP":
    case "HLOOKUP": {
      const table = grid(a(1));
      const k = n(2, 1);
      const approx = has(3) ? toBool(s(3)) : true;
      const lines = name === "VLOOKUP" ? rowsOf(table) : colsOf(table);
      return broadcast([a(0)], (v) => {
        const keys = lines.map((l) => l[0]!);
        const i = approx ? approxSorted(keys, v) : findIndex(keys, v, typeof v === "string" && /[*?]/.test(v) ? 2 : 0, 1);
        if (i < 0) throw new EvalError(E.na());
        if (k < 1 || k > (lines[i]?.length ?? 0)) throw new EvalError(E.ref());
        return lines[i]![k - 1] ?? 0;
      });
    }
    case "MATCH": {
      const list = flat(a(1));
      const type = has(2) ? n(2) : 1;
      return broadcast([a(0)], (v) => {
        const i = type === 0 ? findIndex(list, v, typeof v === "string" && /[*?]/.test(v) ? 2 : 0, 1) : approxSorted(list, v, type < 0);
        if (i < 0) throw new EvalError(E.na());
        return i + 1;
      });
    }
    case "XMATCH": {
      const list = flat(a(1));
      const mm = n(2, 0), sm = n(3, 1);
      return broadcast([a(0)], (v) => {
        const i = findIndex(list, v, mm, sm);
        if (i < 0) throw new EvalError(E.na());
        return i + 1;
      });
    }
    case "XLOOKUP": {
      const look = grid(a(1));
      const ret = grid(a(2));
      if (!isVector(look)) return E.value();
      const vertical = look.length > 1 || (look[0]?.length ?? 0) === 1 && ret.length > 1;
      const list = look.flat();
      const mm = n(4, 0), sm = n(5, 1);
      const notFound: Val | undefined = has(3) ? a(3) : undefined;
      const pick = (v: Scalar): Val => {
        const i = findIndex(list, v, mm, sm);
        if (i < 0) {
          if (notFound !== undefined) return notFound;
          throw new EvalError(E.na());
        }
        if (vertical) { const row = ret[i]; if (!row) throw new EvalError(E.value()); return simplify(mat([row])); }
        const col = ret.map((r) => r[i]!);
        return simplify(mat(col.map((x) => [x])));
      };
      const key = a(0);
      if (isMat(key)) return broadcast([key], (v) => scalarOf(pick(v)));
      try { return pick(scalarOf(key)); } catch (e) { if (e instanceof EvalError) return e.e; throw e; }
    }
    case "INDEX": {
      const g = grid(a(0));
      let r = n(1, 0), c = has(2) ? n(2) : 0;
      if (!has(2) && isVector(g) && g.length === 1) { c = r; r = 1; }
      if (!has(2) && isVector(g) && g.length > 1) c = 1;
      if (r < 0 || c < 0 || r > g.length || c > (g[0]?.length ?? 0)) return E.ref();
      if (r === 0 && c === 0) return mat(g);
      if (r === 0) return simplify(mat(g.map((row) => [row[c - 1]!])));
      if (c === 0) return simplify(mat([g[r - 1]!]));
      return g[r - 1]![c - 1]! ?? 0;
    }
    case "CHOOSECOLS":
    case "CHOOSEROWS": {
      const g = grid(a(0));
      const lines = name === "CHOOSECOLS" ? colsOf(g) : g;
      const picked = args.slice(1).flatMap((v) => flat(v)).map((x) => {
        const k = num(x);
        const line = lines[k > 0 ? k - 1 : lines.length + k];
        if (!line) throw new EvalError(E.value());
        return line;
      });
      return simplify(mat(name === "CHOOSECOLS" ? transpose(picked) : picked));
    }
    case "TAKE":
    case "DROP": {
      let g = grid(a(0));
      const take = name === "TAKE";
      if (has(1)) { const k = n(1); g = take ? (k >= 0 ? g.slice(0, k) : g.slice(k)) : (k >= 0 ? g.slice(k) : g.slice(0, k)); }
      if (has(2)) { const k = n(2); g = g.map((row) => (take ? (k >= 0 ? row.slice(0, k) : row.slice(k)) : (k >= 0 ? row.slice(k) : row.slice(0, k)))); }
      if (!g.length || !g[0]!.length) return E.calc();
      return simplify(mat(g));
    }
    case "VSTACK":
    case "HSTACK": {
      const gs = args.map(grid);
      if (name === "VSTACK") {
        const w = Math.max(...gs.map((g) => g[0]?.length ?? 0));
        return simplify(mat(gs.flatMap((g) => g.map((row) => [...row, ...Array(w - row.length).fill(E.na())]))));
      }
      const h = Math.max(...gs.map((g) => g.length));
      const out: Scalar[][] = [];
      for (let r = 0; r < h; r++) out.push(gs.flatMap((g) => g[r] ?? Array(g[0]?.length ?? 0).fill(E.na())));
      return simplify(mat(out));
    }
    case "TRANSPOSE": return simplify(mat(transpose(grid(a(0)))));
    case "ROWS": return grid(a(0)).length;
    case "COLUMNS": return grid(a(0))[0]?.length ?? 0;
    case "TOCOL": return simplify(mat(flat(a(0)).filter((x) => x !== null).map((x) => [x])));
    case "UNIQUE": {
      const g = grid(a(0));
      const byCol = has(1) && toBool(s(1));
      const once = has(2) && toBool(s(2));
      const res = byCol ? transpose(uniqueRows(colsOf(g), once)) : uniqueRows(g, once);
      if (!res.length) return E.calc();
      return simplify(mat(res));
    }
    case "SORT": {
      const g = grid(a(0));
      const byCol = has(3) && toBool(s(3));
      const lines = byCol ? colsOf(g) : g;
      const idxs = has(1) ? flat(a(1)).map((x) => num(x)) : [1];
      const ords = has(2) ? flat(a(2)).map((x) => num(x)) : [1];
      const keys = idxs.map((k, i) => ({ get: (row: Scalar[]) => row[k - 1]!, order: (ords[i] ?? ords[0] ?? 1) < 0 ? -1 : 1 }));
      const sorted = sortRows(lines, keys);
      return simplify(mat(byCol ? transpose(sorted) : sorted));
    }
    case "SORTBY": {
      const g = grid(a(0));
      const keysG = [] as Array<{ list: Scalar[]; order: number; byCol: boolean }>;
      for (let i = 1; i < args.length; i += 2) {
        const kg = grid(args[i]!);
        const byCol = kg.length === 1 && (kg[0]?.length ?? 0) > 1;
        keysG.push({ list: kg.flat(), order: has(i + 1) && num(scalarOf(args[i + 1]!)) < 0 ? -1 : 1, byCol });
      }
      const byCol = keysG[0]?.byCol ?? false;
      const lines = byCol ? colsOf(g) : g;
      if (keysG.some((k) => k.list.length !== lines.length)) return E.value();
      const sorted = sortRows(lines, keysG.map((k) => ({ get: (_r: Scalar[], i: number) => k.list[i]!, order: k.order })));
      return simplify(mat(byCol ? transpose(sorted) : sorted));
    }
    case "FILTER": {
      const g = grid(a(0));
      const inc = grid(a(1));
      const vertical = inc.length === g.length && (inc[0]?.length ?? 0) === 1;
      const horizontal = inc.length === 1 && (inc[0]?.length ?? 0) === (g[0]?.length ?? 0);
      const keep = (x: Scalar) => {
        if (isErr(x)) throw new EvalError(x);
        if (typeof x === "number") return x !== 0;
        if (typeof x === "boolean") return x;
        return false;
      };
      let out: Scalar[][];
      if (vertical) out = g.filter((_, i) => keep(inc[i]![0]!));
      else if (horizontal) out = g.map((row) => row.filter((_, j) => keep(inc[0]![j]!)));
      else return E.value();
      if (!out.length || !out[0]!.length) return has(2) ? a(2) : E.calc();
      return simplify(mat(out));
    }
    case "BYROW":
    case "BYCOL": {
      const g = grid(a(0));
      const fn = a(1);
      if (!isLam(fn)) return E.value();
      const lines = name === "BYROW" ? g : colsOf(g);
      const res = lines.map((l) => scalarOf(applyLambda(fn, [mat(name === "BYROW" ? [l] : l.map((x) => [x]))], ctx)));
      return simplify(mat(name === "BYROW" ? res.map((x) => [x]) : [res]));
    }
    case "MAP": {
      const fn = args[args.length - 1];
      if (!isLam(fn)) return E.value();
      return broadcast(args.slice(0, -1), (...xs) => scalarOf(applyLambda(fn, xs, ctx)));
    }
    case "REDUCE":
    case "SCAN": {
      const fn = a(2);
      if (!isLam(fn)) return E.value();
      let acc: Val = a(0);
      const steps: Scalar[] = [];
      for (const x of flat(a(1))) { acc = applyLambda(fn, [acc, x], ctx); steps.push(scalarOf(acc)); }
      return name === "REDUCE" ? acc : simplify(mat(steps.map((x) => [x])));
    }
    case "ROW":
    case "COLUMN": {
      const node = argNodes[0];
      const ref = node?.k === "ref" ? node.v : node?.k === "range" ? node.a : null;
      const p = ref ? parseCellRef(ref) : null;
      if (!p) return E.value();
      return name === "ROW" ? p.row + 1 : p.col + 1;
    }
  }
  return E.name();
}

/** SUBTOTAL/AGGREGATE ignore other SUBTOTAL/AGGREGATE results inside their range. */
function withoutNestedTotals(v: Val, node: Node, ctx: Ctx): Val {
  if (!isMat(v) || node.k !== "range") return v;
  const s = parseCellRef(node.a.replace(/\$/g, ""))!, e = parseCellRef(node.b.replace(/\$/g, ""))!;
  return mat(v.v.map((row, r) => row.map((x, c) => {
    const f = ctx.cells[cellId(Math.min(s.col, e.col) + c, Math.min(s.row, e.row) + r)]?.value.formula ?? "";
    return /\b(SUBTOTAL|AGGREGATE)\s*\(/i.test(f) ? null : x;
  })));
}
function aggregateBy(code: number, vals: Val[], skipErrors: boolean): Val {
  const xs = () => numbersOf(vals, { skipErrors });
  switch (code) {
    case 1: return mean(xs());
    case 2: return xs().length;
    case 3: return vals.reduce<number>((c, v) => c + flat(v).filter((x) => x !== null && !(skipErrors && isErr(x))).length, 0);
    case 4: { const v = xs(); return v.length ? Math.max(...v) : 0; }
    case 5: { const v = xs(); return v.length ? Math.min(...v) : 0; }
    case 6: return xs().reduce((p, x) => p * x, 1);
    case 7: return stdev(xs(), true);
    case 8: return stdev(xs(), false);
    case 9: return sum(xs());
    case 10: return stdev(xs(), true) ** 2;
    case 11: return stdev(xs(), false) ** 2;
    case 12: return median(xs());
    case 13: return modes(xs())[0]!;
  }
  return E.value();
}

function lazyFn(name: string, args: Node[], ctx: Ctx): Val {
  const ev = (i: number): Val => (args[i] && args[i]!.k !== "empty" ? evalNode(args[i]!, ctx) : null);
  switch (name) {
    case "IF": {
      const c = ev(0);
      if (isMat(c)) {
        const t = args.length > 1 ? ev(1) : true;
        const f = args.length > 2 ? ev(2) : false;
        return broadcast([c, t, f], (cc, tt, ff) => (toBool(cc) ? tt : ff));
      }
      const test = toBool(scalarOf(c));
      if (test) return args.length > 1 ? (args[1]!.k === "empty" ? 0 : ev(1)) : true;
      return args.length > 2 ? (args[2]!.k === "empty" ? 0 : ev(2)) : false;
    }
    case "IFS": {
      for (let i = 0; i + 1 < args.length; i += 2) if (toBool(scalarOf(ev(i)))) return ev(i + 1);
      return E.na();
    }
    case "SWITCH": {
      const v = scalarOf(ev(0));
      let i = 1;
      for (; i + 1 < args.length; i += 2) if (eq(v, scalarOf(ev(i)))) return ev(i + 1);
      return i < args.length ? ev(i) : E.na();
    }
    case "CHOOSE": {
      const k = Math.floor(num(scalarOf(ev(0))));
      if (k < 1 || k >= args.length) return E.value();
      return ev(k);
    }
    case "IFERROR":
    case "IFNA": {
      const catches = (e: Err) => name === "IFERROR" || e.code === "#N/A";
      let v: Val;
      try { v = ev(0); } catch (e) {
        if (e instanceof EvalError && catches(e.e)) return ev(1);
        throw e;
      }
      if (isErr(v) && catches(v)) return ev(1);
      if (isMat(v) && v.v.flat().some((x) => isErr(x) && catches(x))) {
        const fb = scalarOf(ev(1));
        return mat(v.v.map((row) => row.map((x) => (isErr(x) && catches(x) ? fb : x))));
      }
      return v;
    }
    case "AND":
    case "OR": {
      const all: boolean[] = [];
      for (let i = 0; i < args.length; i++) for (const x of flat(ev(i))) if (x !== null) all.push(toBool(x));
      if (!all.length) return E.value();
      return name === "AND" ? all.every(Boolean) : all.some(Boolean);
    }
    case "LET": {
      const env: Env = new Map(ctx.env);
      const inner: Ctx = { ...ctx, env };
      let i = 0;
      for (; i + 1 < args.length; i += 2) {
        const nm = args[i]!;
        if (nm.k !== "name") return E.value();
        env.set(nm.v.toUpperCase(), evalNode(args[i + 1]!, inner));
      }
      return evalNode(args[i]!, inner);
    }
    case "LAMBDA": {
      const params = args.slice(0, -1).map((p) => {
        if (p.k !== "name") throw new EvalError(E.value());
        return p.v.toUpperCase();
      });
      return { kind: "lam", params, body: args[args.length - 1]!, env: new Map(ctx.env) };
    }
  }
  return E.name();
}

// ─── Main Evaluation Entry Point ──────────────────────────────────────────────

function maxRowOf(cells: WorksheetData): number {
  let max = 0;
  for (const id of Object.keys(cells)) {
    const p = parseCellRef(id);
    if (p && cells[id]!.value.type !== "blank") max = Math.max(max, p.row + 1);
  }
  return max;
}

/** Evaluate a formula to a raw engine value (arrays included). */
function evaluateRaw(formula: string, cells: WorksheetData, names: Record<string, string> = {}): Val {
  const src = formula.startsWith("=") ? formula.slice(1) : formula;
  try {
    const ast = new Parser(tokenize(src)).parseFormula();
    const v = evalNode(ast, { cells, names, env: new Map(), maxRow: maxRowOf(cells), depth: 0 });
    if (isLam(v)) return E.calc();
    return simplify(v);
  } catch (e) {
    if (e instanceof EvalError) return e.e;
    if (e instanceof RangeError) return E.num();
    return E.value();
  }
}

function scalarToCellValue(formula: string | undefined, raw: string, v: Scalar): CellValue {
  if (isErr(v)) return { raw, computed: v.code, type: "error", formula, error: v.code };
  if (typeof v === "number") return { raw, computed: Number.isFinite(v) ? v : null, type: Number.isFinite(v) ? "number" : "error", formula, ...(Number.isFinite(v) ? {} : { error: "#NUM!" }) };
  if (typeof v === "boolean") return { raw, computed: v, type: "boolean", formula };
  if (v === null || v === "") return { raw, computed: v === null ? (formula ? 0 : null) : "", type: v === null && formula ? "number" : "blank", formula };
  return { raw, computed: v, type: "text", formula };
}

/** Evaluate a formula string against the given cell data. Arrays return their top-left value. */
export function evaluateFormula(formula: string, cells: WorksheetData, names: Record<string, string> = {}): CellValue {
  const src = formula.startsWith("=") ? formula.slice(1).trim() : formula.trim();
  if (!src) return { raw: formula, computed: "", type: "blank" };
  const v = evaluateRaw(formula, cells, names);
  return scalarToCellValue(formula, formula, isMat(v) ? v.v[0]![0]! : (v as Scalar));
}

/** Parse a plain cell value (non-formula) */
export function parseCellInput(input: string): CellValue {
  if (!input || input.trim() === "") {
    return { raw: input, computed: null, type: "blank" };
  }
  if (input.startsWith("=") && input.length > 1) {
    return { raw: input, computed: null, type: "formula", formula: input };
  }
  if (input.startsWith("'")) return { raw: input, computed: input.slice(1), type: "text" };
  const trimmed = input.trim();
  if (/^[-+]?\$?(\d{1,3}(,\d{3})+|\d*)(\.\d+)?%?$/.test(trimmed) && /\d/.test(trimmed)) {
    const n = parseFloat(trimmed.replace(/[$,%]/g, ""));
    return { raw: input, computed: trimmed.endsWith("%") ? n / 100 : n, type: "number" };
  }
  if (trimmed.toUpperCase() === "TRUE") return { raw: input, computed: true, type: "boolean" };
  if (trimmed.toUpperCase() === "FALSE") return { raw: input, computed: false, type: "boolean" };
  return { raw: input, computed: input, type: "text" };
}

/**
 * Recalculate every formula in a sheet. Array results spill into the cells to the
 * right and below; if any of those cells already holds data the formula shows #SPILL!.
 */
export function recalcSheet(cells: WorksheetData, names: Record<string, string> = {}): WorksheetData {
  const updated: WorksheetData = {};
  for (const [id, cell] of Object.entries(cells)) {
    if (cell.value.spillFrom) {
      // Drop old spill output, keeping any lesson styling on the cell.
      if (cell.format || cell.highlighted || cell.note || cell.readOnly) {
        updated[id] = { ...cell, value: { raw: "", computed: null, type: "blank" } };
      }
      continue;
    }
    updated[id] = cell;
  }

  const formulaIds = Object.keys(updated).filter((id) => updated[id]!.value.formula);
  const spillOwner = new Map<string, string[]>();

  const clearSpill = (anchor: string) => {
    for (const child of spillOwner.get(anchor) ?? []) {
      const c = updated[child];
      if (!c || c.value.spillFrom !== anchor) continue;
      if (c.format || c.highlighted || c.note || c.readOnly) updated[child] = { ...c, value: { raw: "", computed: null, type: "blank" } };
      else delete updated[child];
    }
    spillOwner.delete(anchor);
  };

  const signature = () => formulaIds.map((id) => JSON.stringify(updated[id]?.value.computed ?? null)).join("|");
  const maxPasses = Math.min(formulaIds.length + 2, 40);
  for (let pass = 0; pass < maxPasses; pass++) {
    const before = signature() + "#" + [...spillOwner.values()].flat().length;
    for (const id of formulaIds) {
      const cell = updated[id]!;
      const formula = cell.value.formula!;
      clearSpill(id);
      const v = evaluateRaw(formula, updated, names);
      if (!isMat(v)) {
        updated[id] = { ...cell, value: scalarToCellValue(formula, cell.value.raw, v as Scalar) };
        continue;
      }
      const anchor = parseCellRef(id)!;
      const rows = v.v.length, cols = v.v[0]?.length ?? 0;
      const children: string[] = [];
      let blocked = false;
      for (let r = 0; r < rows && !blocked; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 && c === 0) continue;
          const cid = cellId(anchor.col + c, anchor.row + r);
          const existing = updated[cid];
          if (existing && (existing.value.formula || (existing.value.raw ?? "") !== "" || (existing.value.spillFrom && existing.value.spillFrom !== id))) { blocked = true; break; }
          children.push(cid);
        }
      }
      if (blocked) {
        updated[id] = { ...cell, value: { ...scalarToCellValue(formula, cell.value.raw, E.spill()), spillRange: undefined } };
        continue;
      }
      const end = cellId(anchor.col + cols - 1, anchor.row + rows - 1);
      updated[id] = { ...cell, value: { ...scalarToCellValue(formula, cell.value.raw, v.v[0]![0]!), spillRange: `${id}:${end}` } };
      for (const cid of children) {
        const p = parseCellRef(cid)!;
        const val = v.v[p.row - anchor.row]![p.col - anchor.col]!;
        const prev = updated[cid];
        const base = scalarToCellValue(undefined, "", val);
        updated[cid] = {
          id: cid,
          value: { ...base, raw: "", type: base.type === "blank" && val === null ? "number" : base.type, computed: val === null ? 0 : base.computed, spillFrom: id },
          format: prev?.format,
          readOnly: prev?.readOnly,
          highlighted: prev?.highlighted,
          note: prev?.note,
        };
      }
      spillOwner.set(id, children);
    }
    if (signature() + "#" + [...spillOwner.values()].flat().length === before) break;
  }
  return updated;
}

/** Format a computed cell value for display */
export function formatCellValue(value: CellValue, format?: { numberFormat?: string }): string {
  if (value.error) return value.error;
  const computed = value.computed;
  if (computed === null || computed === undefined) return "";
  if (typeof computed === "boolean") return computed ? "TRUE" : "FALSE";

  if (typeof computed === "number") {
    const fmt = format?.numberFormat;
    if (fmt === "currency") {
      const s = `$${Math.abs(computed).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return computed < 0 ? `-${s}` : s;
    }
    if (fmt === "percentage") return `${parseFloat((computed * 100).toFixed(2))}%`;
    if (fmt === "number") return computed.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (fmt === "date") return formatDateSerial(computed);
    return parseFloat(computed.toPrecision(10)).toString();
  }

  return String(computed);
}

/** Extract function names used in a formula */
export function extractFunctionNames(formula: string): string[] {
  const src = formula.startsWith("=") ? formula.slice(1) : formula;
  const noStrings = src.replace(/"[^"]*"/g, '""');
  const matches = noStrings.match(/\b[A-Z][A-Z0-9.]*(?=\s*\()/gi) ?? [];
  return [...new Set(matches.map((m) => m.toUpperCase()))];
}

/** Display text for a formula-bar preview, including the size of an array result. */
export function previewFormula(formula: string, cells: WorksheetData, names: Record<string, string> = {}): string {
  const v = evaluateRaw(formula, cells, names);
  if (isMat(v)) {
    const top = scalarToCellValue(formula, formula, v.v[0]![0]!);
    return `${formatCellValue(top)} … (${v.v.length}×${v.v[0]?.length ?? 0} spill)`;
  }
  return formatCellValue(scalarToCellValue(formula, formula, v as Scalar));
}
