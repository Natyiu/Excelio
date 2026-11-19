"use client";

import Link from "next/link";
import { useState } from "react";
import { Panel, pressable } from "@/components/game-ui";
import { PracticeSheet } from "@/components/functions/practice-sheet";

export type TestTask = {
  slug: string;
  name: string;
  level: "Basic" | "Intermediate" | "Advanced";
  task: string;
  data: (string | number)[][];
  target: string;
  expected: string | number;
  requires: string[];
  hint: string;
  solution: string;
  href: string;
};

function verdict(score: number, total: number) {
  const share = score / total;
  if (share >= 0.75) return { label: "Advanced-ready", body: "You handle lookups and conditional formulas well. Most job assessments test exactly this." };
  if (share >= 0.4) return { label: "Intermediate", body: "The basics are solid. Lookups and multi-condition formulas are the next step." };
  return { label: "Beginner", body: "Start with the core formulas. A few short lessons will move your score quickly." };
}

/** Every task is a live sheet. A task counts once it has been checked correct. */
export function TestRunner({ tasks }: { tasks: TestTask[] }) {
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const score = solved.size;
  const result = verdict(score, tasks.length);

  return (
    <div className="space-y-8">
      <div className="sticky top-2 z-10 flex items-center justify-between gap-3 rounded-2xl border-2 border-brand bg-background/95 px-4 py-2.5 backdrop-blur">
        <span className="text-[15px] font-bold">Score: {score} / {tasks.length}</span>
        <span className="text-[15px] font-semibold text-brand">{result.label}</span>
      </div>

      <ol className="space-y-8">
        {tasks.map((t, i) => (
          <li key={t.slug}>
            <h3 className="text-xl font-bold">
              {i + 1}. {t.task} <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{t.level}</span>
            </h3>
            <Panel className={`mt-3 p-4 ${solved.has(t.slug) ? "border-brand" : ""}`}>
              <p className="mb-3 text-[15px] text-muted-foreground">Type your formula in <code className="font-mono font-semibold text-brand">{t.target}</code>.</p>
              <PracticeSheet
                data={t.data}
                target={t.target}
                expected={t.expected}
                requires={t.requires}
                hint={t.hint}
                solution={t.solution}
                onCheck={(ok) => { if (ok) setSolved((s) => new Set(s).add(t.slug)); }}
              />
            </Panel>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Stuck? <Link href={t.href as never} className="font-semibold text-brand hover:underline">Learn {t.name}</Link>
            </p>
          </li>
        ))}
      </ol>

      <Panel className="border-brand p-6 text-center">
        <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Your result</p>
        <p className="mt-1 text-3xl font-extrabold">{score} / {tasks.length}: {result.label}</p>
        <p className="mx-auto mt-2 max-w-md text-[16px] text-muted-foreground">{result.body}</p>
        <Link href={"/try" as never} className={pressable("brand", "mt-4 px-6 py-3")}>Improve it with a free lesson</Link>
      </Panel>
    </div>
  );
}
