"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { pressable } from "@/components/game-ui";
import { Mascot } from "@/components/mascot";
import { cellId, formatCellValue, parseCellInput, parseCellRef, recalcSheet } from "@/lib/formula-engine";
import { validateChallenge } from "@/lib/validation-engine";
import { cn } from "@/lib/utils";
import type { WorksheetData } from "@/types/excel-learning";

type Props = {
  data: (string | number)[][];
  target: string;
  expected: string | number;
  requires: string[];
  hint: string;
  solution: string;
};

/** A small live sheet: the learner types one formula, sees it calculate, and has it checked. */
export function PracticeSheet({ data, target, expected, requires, hint, solution }: Props) {
  const [formula, setFormula] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [help, setHelp] = useState<"hint" | "solution" | null>(null);

  const cells = useMemo(() => {
    const base: WorksheetData = {};
    data.forEach((row, r) => row.forEach((v, c) => {
      const id = cellId(c, r);
      base[id] = { id, value: parseCellInput(String(v)) };
    }));
    if (formula.trim()) base[target] = { id: target, value: parseCellInput(formula.trim()) };
    return recalcSheet(base);
  }, [data, formula, target]);

  const { rows, cols } = useMemo(() => {
    const refs = Object.keys(cells).flatMap((id) => parseCellRef(id) ?? []);
    return { rows: Math.max(...refs.map((r) => r.row + 1), data.length) + 1, cols: Math.max(...refs.map((r) => r.col + 1), parseCellRef(target)!.col + 1) };
  }, [cells, data.length, target]);

  function check() {
    const outcome = validateChallenge(
      [
        { mode: "formula_result", targetCell: target, expectedValue: expected, tolerance: 0.01 },
        { mode: "required_formula", targetCell: target, requiredFormulas: requires },
      ],
      cells
    );
    setResult({ ok: outcome.isCorrect, message: outcome.isCorrect ? "Correct. That formula works in Excel too." : outcome.message });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 py-2.5">
        <span aria-hidden className="font-serif italic text-muted-foreground">fx</span>
        <label htmlFor="practice-formula" className="shrink-0 font-mono text-sm font-bold text-brand">{target}</label>
        <input
          id="practice-formula"
          value={formula}
          onChange={(e) => { setFormula(e.target.value); setResult(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") check(); }}
          placeholder="Type your formula, starting with ="
          spellCheck={false}
          autoComplete="off"
          className="w-full bg-transparent font-mono text-[16px] outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-border">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="bg-muted/60 text-muted-foreground">
              <th className="w-8" />
              {Array.from({ length: cols }, (_, c) => <th key={c} className="border-l border-border px-2 py-1 font-semibold">{cellId(c, 0).replace(/\d+/, "")}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r} className="border-t border-border">
                <th className="bg-muted/60 px-1 text-center font-semibold text-muted-foreground">{r + 1}</th>
                {Array.from({ length: cols }, (_, c) => {
                  const id = cellId(c, r);
                  const cell = cells[id];
                  return (
                    <td key={id} className={cn("whitespace-nowrap border-l border-border px-2 py-1", r === 0 && "font-semibold", id === target && "bg-brand/15 font-bold ring-2 ring-inset ring-brand")}>
                      {cell ? formatCellValue(cell.value, cell.format) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={check} className={pressable("brand", "px-5 py-2 text-sm")}>Check my answer</button>
        <button type="button" onClick={() => setHelp("hint")} className="px-2 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Show a hint</button>
        <button type="button" onClick={() => setHelp("solution")} className="px-2 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Show the answer</button>
      </div>

      {help && <p className="rounded-xl bg-muted px-3 py-2 text-[15px]">{help === "hint" ? hint : <code className="font-mono font-semibold">{solution}</code>}</p>}

      {result && (
        <div role="status" className={cn("flex items-center gap-3 rounded-2xl border-2 px-3 py-2 text-[15px] font-semibold", result.ok ? "border-brand bg-brand-soft" : "border-border bg-card")}>
          <Mascot mood={result.ok ? "cheer" : "oops"} size={64} className="shrink-0" />
          <span>{result.ok ? "✓ " : "✗ Not yet. "}{result.message}</span>
          {result.ok && <Link href={"/try" as never} className="ml-2 text-brand underline">Try a full lesson</Link>}
        </div>
      )}
    </div>
  );
}
