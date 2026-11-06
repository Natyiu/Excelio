import Link from "next/link";
import { LEVELS } from "@/components/level-picker";
import { Mascot } from "@/components/mascot";
import { SectionTitle } from "@/components/game-ui";
import { TEMPLATES, type Template } from "@/data/practice-templates";
import { extractFunctionNames } from "@/lib/formula-engine";
import { cn } from "@/lib/utils";
import type { LessonDifficulty } from "@/types/excel-learning";

/** Functions a template's formulas use, for the "you'll use" chips. */
function functionsIn(t: Template): string[] {
  const names = new Set<string>();
  for (const cell of Object.values(t.workbook.sheets[0]?.cells ?? {})) {
    if (cell.value.formula) extractFunctionNames(cell.value.formula).forEach((n) => names.add(n));
  }
  return [...names];
}

/** Size of a sheet and up to six of its numbers, for the tile's mini chart. */
function sheetStats(t: Template) {
  const cells = Object.values(t.workbook.sheets[0]?.cells ?? {});
  const values = cells
    .filter((c) => !c.value.formula && typeof c.value.computed === "number")
    .map((c) => c.value.computed as number)
    .slice(0, 6);
  const rows = new Set(cells.map((c) => c.id.replace(/^[A-Z]+/, ""))).size;
  return { rows, formulas: cells.filter((c) => c.value.formula).length, values };
}

/** Bars drawn from the sheet's own numbers. */
function MiniChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <span className="flex h-16 w-16 shrink-0 items-end justify-center gap-1 rounded-2xl bg-brand-soft p-2.5">
      {(values.length ? values : [3, 5, 4, 7, 6]).map((v, i) => (
        <span key={i} className="w-1.5 rounded-full bg-brand" style={{ height: `${Math.max(18, (v / max) * 100)}%`, opacity: 0.55 + (i % 3) * 0.2 }} />
      ))}
    </span>
  );
}

/**
 * The practice studio: a banner with a quick start, a stage switch and sheet tiles.
 * Each sheet's formula drills live on the sheet itself.
 */
export function PracticeStudio({ level }: { level: LessonDifficulty }) {
  const sheets = Object.entries(TEMPLATES).filter(([key, t]) => key !== "blank" && t.levels.includes(level));
  const open = (key: string) => `/dashboard/practice/${level}/${key}`;

  return (
    <div className="space-y-8">
      {/* Banner, in the same family as the Learn chapter banners */}
      <section className="relative overflow-hidden rounded-2xl bg-brand px-6 pb-7 pt-8 text-brand-foreground">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_28px] [mask-image:linear-gradient(to_left,black,transparent_80%)]"
        />
        <Mascot mood="teach" size={150} className="absolute -bottom-3 right-4 hidden sm:block" />
        <div className="relative max-w-md">
          <p className="text-[13px] font-bold uppercase tracking-wide opacity-80">Practice studio</p>
          <h1 className="mt-1 text-3xl font-bold">Try anything. Break nothing.</h1>
          <p className="mt-2 text-[15px] opacity-90">A free workbook with no scoring. Open a ready-made sheet or start from a blank grid.</p>
          <Link
            href={open("blank") as never}
            className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-brand-deep px-5 py-2.5 text-sm font-bold uppercase tracking-wide shadow-[0_4px_0_rgb(0_0_0/0.25)] transition-transform hover:brightness-110 active:translate-y-1 active:shadow-none"
          >
            Open blank workbook
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Stage switch, sitting beside the section title */}
      <div>
        <SectionTitle
          action={
            <nav className="flex rounded-full bg-muted p-1" aria-label="Stage">
              {LEVELS.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/practice/${l.id}` as never}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4",
                    l.id === level ? "bg-card text-brand shadow-[0_2px_0_var(--border)]" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          }
        >
          Practice sheets
        </SectionTitle>

      {/* Sheet tiles */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sheets.map(([key, t]) => {
          const fns = functionsIn(t);
          const stats = sheetStats(t);
          return (
            <Link
              key={key}
              href={open(key) as never}
              className="group flex flex-col gap-4 rounded-3xl border-2 border-b-[5px] border-border bg-card p-5 transition-colors hover:border-brand active:translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <MiniChart values={stats.values} />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-snug">{t.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {stats.rows} rows · {stats.formulas} formulas
                  </p>
                </div>
              </div>
              <p className="line-clamp-2 text-[14px] text-muted-foreground">{t.desc}</p>
              <div className="mt-auto flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {fns.map((f) => (
                    <span key={f} className="rounded-full bg-brand-soft px-2.5 py-0.5 font-mono text-[12px] font-semibold text-brand">
                      {f}
                    </span>
                  ))}
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_3px_0_var(--brand-deep)] transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      </div>

    </div>
  );
}
