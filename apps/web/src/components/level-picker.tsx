import type { CSSProperties } from "react";
import type { LessonDifficulty } from "@/types/excel-learning";
import type { MascotMood } from "@/components/mascot";

export const LEVELS: { id: LessonDifficulty; label: string; blurb: string; mood: MascotMood; base: string; deep: string }[] = [
  { id: "beginner", label: "Beginner", blurb: "Cells, formulas, SUM, AVERAGE and absolute references", mood: "wave", base: "#1d9a52", deep: "#0d6b37" },
  { id: "intermediate", label: "Intermediate", blurb: "IF, lookups, SUMIFS, rounding and sorting", mood: "think", base: "#0284c7", deep: "#075985" },
  { id: "advanced", label: "Advanced", blurb: "FILTER logic, LET, LAMBDA and stacking data", mood: "trophy", base: "#7c3aed", deep: "#5b21b6" },
];

export function parseLevel(value: string | string[] | undefined): LessonDifficulty | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "beginner" || v === "intermediate" || v === "advanced" ? v : null;
}

/** Override the brand colour inside a level's pages so everything there takes its colour. */
export function levelStyle(level: LessonDifficulty): CSSProperties {
  const l = LEVELS.find((x) => x.id === level)!;
  return {
    "--brand": l.base,
    "--brand-deep": l.deep,
    "--brand-soft": `color-mix(in oklab, ${l.base} 16%, var(--background))`,
  } as CSSProperties;
}
