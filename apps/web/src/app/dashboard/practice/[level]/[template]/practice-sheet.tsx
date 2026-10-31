"use client";

import { useState } from "react";
import Link from "next/link";
import type { LessonDifficulty, Workbook } from "@/types/excel-learning";
import { Spreadsheet } from "@/components/spreadsheet/spreadsheet";
import { Mascot } from "@/components/mascot";
import { pressable } from "@/components/game-ui";
import { DRILLS, TEMPLATES } from "@/data/practice-templates";

/** A full-screen practice sheet: the Excel window on the left, ideas to try on the right. */
export function PracticeSheet({ level, templateKey }: { level: LessonDifficulty; templateKey: string }) {
  const template = TEMPLATES[templateKey]!;
  const fresh = () => JSON.parse(JSON.stringify(template.workbook)) as Workbook;
  const [workbook, setWorkbook] = useState<Workbook>(fresh);
  const [version, setVersion] = useState(0);

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-4 border-b border-border px-4 py-3 lg:px-6">
        <Link href={`/dashboard/practice/${level}` as never} aria-label="Back to practice sheets" className="text-muted-foreground transition-colors hover:text-foreground">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold uppercase tracking-wide text-brand">Practice · {level}</p>
          <p className="truncate text-lg font-bold">{template.title}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setWorkbook(fresh());
            setVersion((v) => v + 1);
          }}
          className={pressable("outline", "shrink-0")}
        >
          Reset sheet
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:flex-row lg:p-6">
        <div className="min-w-0 flex-1">
          <Spreadsheet
            key={version}
            workbook={workbook}
            onChange={setWorkbook}
            showToolbar={false}
            compact
            excelChrome
            className="w-full"
          />
        </div>

        {/* Ideas panel */}
        <aside className="shrink-0 space-y-3 lg:w-72">
          <div className="flex items-end gap-2">
            <Mascot mood="teach" size={64} />
            <p className="mb-2 rounded-2xl border-2 border-border bg-card px-3 py-2 text-[14px] font-medium">
              Formula drills for this sheet. Type one into an empty cell.
            </p>
          </div>
          {(DRILLS[templateKey] ?? []).map((idea) => (
            <div key={idea.code} className="rounded-2xl border-2 border-b-4 border-border bg-card p-3">
              <code className="block break-all font-mono text-[13px] font-semibold text-brand">{idea.code}</code>
              <span className="mt-1 block text-[13px] text-muted-foreground">{idea.hint}</span>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
