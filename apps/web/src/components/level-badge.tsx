import { LEVELS } from "@/components/level-picker";
import type { LessonDifficulty } from "@/types/excel-learning";
import { cn } from "@/lib/utils";

/** Beginner / Intermediate / Advanced pill in that level's colour (green, blue, purple). */
export function LevelBadge({ level, short = false, className }: { level: LessonDifficulty; short?: boolean; className?: string }) {
  const l = LEVELS.find((x) => x.id === level) ?? LEVELS[0]!;
  return (
    <span
      title={`${l.label} level`}
      className={cn("inline-flex shrink-0 items-center rounded-full px-1.5 align-middle text-[10px] font-semibold leading-4", className)}
      style={{ background: `color-mix(in oklab, ${l.base} 14%, transparent)`, color: l.base }}
    >
      {short ? l.label.slice(0, 3) : l.label}
    </span>
  );
}
