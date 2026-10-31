"use client";

import type { ReactNode } from "react";
import type { Workbook } from "@/types/excel-learning";
import { cellId, formatCellValue, parseCellRef } from "@/lib/formula-engine";
import { cn } from "@/lib/utils";
import { SheetDemo, demoCaption, demoStepCount } from "@/components/learning/sheet-demo";

/**
 * Lesson notes are written as light markdown: paragraphs split by blank lines,
 * "- " / "1. " lists, ``` code blocks and "| a | b |" tables. They are shown
 * as a short deck of slides before practice, and in full during practice.
 */

type Block =
  | { kind: "p"; text: string }
  | { kind: "code"; lines: string[] }
  | { kind: "demo"; lines: string[] }
  | { kind: "table"; rows: string[][] }
  | { kind: "list"; ordered: boolean; items: string[] };

export function parseNotes(text: string): Block[] {
  const raw = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const blocks: Block[] = [];
  for (let i = 0; i < raw.length; i++) {
    const block = raw[i]!;
    if (block.startsWith("```")) {
      // A code block may contain blank lines; gather until the closing fence.
      let code = block;
      while (!/```\s*$/.test(code.slice(3)) && i + 1 < raw.length) code += "\n\n" + raw[++i];
      const body = code.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
      const lines = body.split("\n").filter((l) => l.trim());
      // ```show blocks are animated spreadsheet demos; other fences are formula examples.
      blocks.push(/^```show/.test(code) ? { kind: "demo", lines } : { kind: "code", lines });
      continue;
    }
    const lines = block.split("\n");
    if (lines.every((l) => l.trim().startsWith("|"))) {
      blocks.push({ kind: "table", rows: lines.map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())) });
      continue;
    }
    if (lines.every((l) => /^(-|\d+\.)\s/.test(l.trim()))) {
      blocks.push({
        kind: "list",
        ordered: /^\d+\./.test(lines[0]!.trim()),
        items: lines.map((l) => l.trim().replace(/^(-|\d+\.)\s+/, "")),
      });
      continue;
    }
    blocks.push({ kind: "p", text: lines.join(" ") });
  }
  return blocks;
}

/**
 * Group blocks into slides: each slide is one idea, a paragraph plus the
 * formula, table or list that illustrates it.
 */
/** How many Continue presses a slide takes: one per step of its demo, or one if it has none. */
export function slideBeats(blocks: Block[]): number {
  const demo = blocks.find((b) => b.kind === "demo");
  return demo && demo.kind === "demo" ? Math.max(1, demoStepCount(demo.lines)) : 1;
}

export function toSlides(blocks: Block[]): Block[][] {
  const slides: Block[][] = [];
  for (const b of blocks) {
    const cur = slides[slides.length - 1];
    const curHasVisual = cur?.some((x) => x.kind !== "p");
    if (!cur || b.kind === "p" || curHasVisual) {
      slides.push([b]);
    } else {
      cur.push(b);
    }
  }
  return slides;
}

// ─── Inline text ──────────────────────────────────────────────────────────────

const CELL_REF = /^\$?[A-Z]{1,3}\$?\d+(:\$?[A-Z]{1,3}\$?\d+)?#?$/;

/** **bold** becomes a highlighted term; `code` becomes a cell, formula or key chip. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-brand">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          const code = part.slice(1, -1);
          if (CELL_REF.test(code)) {
            return (
              <span
                key={i}
                className="mx-0.5 inline-block rounded-md border-2 border-brand bg-brand-soft px-1.5 py-px font-mono text-[0.85em] font-semibold text-brand"
              >
                {code}
              </span>
            );
          }
          if (code.startsWith("=")) {
            return (
              <span key={i} className="mx-0.5 inline-flex items-baseline gap-1 rounded-md bg-muted px-1.5 py-px font-mono text-[0.85em]">
                <span className="font-serif font-bold italic text-brand">fx</span>
                {code}
              </span>
            );
          }
          return (
            <code key={i} className="mx-0.5 rounded-md bg-muted px-1.5 py-px font-mono text-[0.85em]">
              {code}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}

// ─── Visual blocks ────────────────────────────────────────────────────────────

/** A code block drawn as Excel's formula bar; "→ result" shows as a result pill. */
function FormulaBar({ lines }: { lines: string[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
      {lines.map((line, i) => {
        const [formula, result] = line.split(/\s+→\s+/);
        const isComment = !formula!.trim().startsWith("=") && /\s{2,}/.test(formula!);
        const [code, note] = isComment ? formula!.split(/\s{2,}/) : [formula, undefined];
        return (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 animate-in fade-in slide-in-from-left-2"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <span className="shrink-0 font-serif text-lg font-bold italic text-brand">fx</span>
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[15px]">{code}</code>
            {result && (
              <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 font-mono text-sm font-semibold text-brand">
                {result}
              </span>
            )}
            {note && <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">{note}</span>}
          </div>
        );
      })}
    </div>
  );
}

/** A markdown table drawn as a small spreadsheet, with column letters and row numbers. */
function SheetTable({ rows }: { rows: string[][] }) {
  const cols = Math.max(...rows.map((r) => r.length));
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-border bg-card">
      <table className="w-full border-collapse text-left text-[15px]">
        <thead>
          <tr>
            <th className="w-9 border-b border-r border-border bg-muted/60" />
            {Array.from({ length: cols }).map((_, c) => (
              <th key={c} className="border-b border-r border-border bg-muted/60 py-1 text-center text-xs font-medium text-muted-foreground last:border-r-0">
                {String.fromCharCode(65 + c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="animate-in fade-in" style={{ animationDelay: `${r * 60}ms`, animationFillMode: "both" }}>
              <td className="border-b border-r border-border bg-muted/60 text-center text-xs text-muted-foreground">{r + 1}</td>
              {Array.from({ length: cols }).map((_, c) => (
                <td
                  key={c}
                  className={cn(
                    "border-b border-r border-border px-3 py-2 align-top last:border-r-0",
                    r === 0 && "bg-brand-soft font-semibold text-brand"
                  )}
                >
                  <RichText text={row[c] ?? ""} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** List items as stacked cards with a numbered (or bullet) coin. */
function PointList({ items, ordered }: { items: string[]; ordered: boolean }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-2xl bg-muted/50 px-4 py-3 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${i * 90}ms`, animationFillMode: "both" }}
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground shadow-[0_3px_0_var(--brand-deep)]">
            {ordered ? i + 1 : "✓"}
          </span>
          <span className="text-[16px] leading-relaxed">
            <RichText text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function BlockView({ block, lead, workbook, demoStep }: { block: Block; lead?: boolean; workbook?: Workbook; demoStep?: number }) {
  switch (block.kind) {
    case "p":
      return (
        <p className={cn("leading-relaxed", lead ? "text-[21px] font-medium" : "text-[17px] text-muted-foreground")}>
          <RichText text={block.text} />
        </p>
      );
    case "code":
      return <FormulaBar lines={block.lines} />;
    case "table":
      return <SheetTable rows={block.rows} />;
    case "list":
      return <PointList items={block.items} ordered={block.ordered} />;
    case "demo":
      return <SheetDemo lines={block.lines} workbook={workbook} step={demoStep} hideCaption={demoStep !== undefined} />;
  }
}

/**
 * The one-line heading for a slide: the current demo step's explanation, or the
 * slide's opening paragraph. The rest of the slide renders below it.
 */
export function slideHeading(blocks: Block[], demoStep: number): string {
  const demo = blocks.find((b): b is Extract<Block, { kind: "demo" }> => b.kind === "demo");
  if (demo) return demoCaption(demo.lines, demoStep);
  const first = blocks[0];
  return first?.kind === "p" ? first.text : "";
}

/** The body of a slide under its heading: the demo (driven one step at a time) or the slide's other blocks. */
export function NoteSlide({ blocks, workbook, demoStep = 0 }: { blocks: Block[]; workbook?: Workbook; demoStep?: number }) {
  const demo = blocks.find((b): b is Extract<Block, { kind: "demo" }> => b.kind === "demo");
  if (demo) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <SheetDemo lines={demo.lines} workbook={workbook} step={demoStep} hideCaption />
      </div>
    );
  }
  const rest = blocks[0]?.kind === "p" ? blocks.slice(1) : blocks;
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      {rest.map((b, i) => (
        <BlockView key={i} block={b} workbook={workbook} />
      ))}
    </div>
  );
}

/** The full notes, compact, for reference while practising. */
export function LessonNotes({ text, workbook }: { text: string; workbook?: Workbook }) {
  return (
    <div className="space-y-4">
      {parseNotes(text).map((b, i) => (
        <BlockView key={i} block={b} workbook={workbook} />
      ))}
    </div>
  );
}

/** A small preview of the lesson's sheet, with the cells to fill outlined. */
export function SheetPreview({ workbook }: { workbook: Workbook }) {
  const sheet = workbook.sheets[0];
  if (!sheet) return null;
  const ids = Object.keys(sheet.cells);
  if (!ids.length) return null;
  let maxCol = 0;
  let maxRow = 0;
  for (const id of ids) {
    const p = parseCellRef(id);
    if (!p) continue;
    maxCol = Math.max(maxCol, p.col);
    maxRow = Math.max(maxRow, p.row);
  }
  const cols = Math.min(maxCol + 1, 6);
  const rows = Math.min(maxRow + 1, 6);
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-card text-[13px]">
      <div className="grid" style={{ gridTemplateColumns: `28px repeat(${cols}, minmax(0, 1fr))` }}>
        <span className="border-b border-r border-border bg-muted/60" />
        {Array.from({ length: cols }).map((_, c) => (
          <span key={c} className="border-b border-r border-border bg-muted/60 py-1 text-center text-[11px] text-muted-foreground last:border-r-0">
            {String.fromCharCode(65 + c)}
          </span>
        ))}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="contents">
            <span className="border-b border-r border-border bg-muted/60 py-1.5 text-center text-[11px] text-muted-foreground">{r + 1}</span>
            {Array.from({ length: cols }).map((_, c) => {
              const cell = sheet.cells[cellId(c, r)];
              const text = cell ? formatCellValue(cell.value, cell.format) : "";
              return (
                <span
                  key={c}
                  className={cn(
                    "truncate border-b border-r border-border px-2 py-1.5 last:border-r-0",
                    typeof cell?.value.computed === "number" && "text-right tabular-nums",
                    cell?.format?.bold && "font-semibold",
                    cell?.highlighted && "bg-brand-soft outline outline-2 -outline-offset-2 outline-brand"
                  )}
                >
                  {text}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function slideLabel(kind: "lesson" | "lab" | "capstone" | undefined): ReactNode {
  return kind === "lab" ? "Lab brief" : kind === "capstone" ? "Capstone brief" : "Learn";
}
