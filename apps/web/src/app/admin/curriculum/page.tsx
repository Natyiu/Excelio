import prisma from "@Batman/db";
import { COURSES } from "@/data/lessons";
import { getChapterSettings } from "@/lib/pro-access";
import { requireAdmin } from "@/lib/auth-guards";
import { ChapterControls, FreeCountControl } from "./chapter-controls";

const STAGES = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
] as const;

/** Founder controls for the course: which chapters are free or Pro, and which are shown. */
export default async function AdminCurriculumPage() {
  await requireAdmin();
  const settings = await getChapterSettings();

  // Learners who started / finished each chapter.
  const progress = await prisma.lessonProgress
    .groupBy({ by: ["courseId", "userId", "status"], _count: { _all: true } })
    .catch(() => []);
  const stats = new Map<string, { started: Set<string>; done: Map<string, number> }>();
  for (const p of progress) {
    const s = stats.get(p.courseId) ?? { started: new Set(), done: new Map() };
    s.started.add(p.userId);
    if (p.status === "completed" || p.status === "mastered") s.done.set(p.userId, (s.done.get(p.userId) ?? 0) + p._count._all);
    stats.set(p.courseId, s);
  }

  const freeCount = COURSES.filter((c) => settings[c.id]?.access === "free").length;
  const freeLessons = COURSES.filter((c) => settings[c.id]?.access === "free").reduce((n, c) => n + c.lessons.length, 0);
  const hiddenCount = COURSES.filter((c) => settings[c.id]?.hidden).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">Curriculum</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Choose which chapters are free or Pro, and hide chapters from learners. Changes apply immediately.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Free chapters", value: `${freeCount} (${freeLessons} lessons)` },
          { label: "Pro chapters", value: COURSES.length - freeCount },
          { label: "Hidden chapters", value: hiddenCount },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-4 bg-muted/50">
            <p className="text-[13px] uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-xl font-semibold">{k.value}</p>
          </div>
        ))}
      </div>

      <FreeCountControl current={freeCount} total={COURSES.length} />

      {STAGES.map((stage) => (
        <section key={stage.id} className="overflow-hidden rounded-xl border border-border">
          <p className="border-b border-border/60 bg-muted/40 px-4 py-2 text-sm font-semibold">{stage.label}</p>
          <ul className="divide-y divide-border/60">
            {COURSES.filter((c) => c.difficulty === stage.id).map((c) => {
              const i = COURSES.indexOf(c);
              const s = stats.get(c.id);
              const started = s?.started.size ?? 0;
              const finished = s ? [...s.done.values()].filter((n) => n >= c.lessons.length).length : 0;
              const setting = settings[c.id]!;
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                  <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
                  <div className="min-w-48 flex-1">
                    <p className={setting.hidden ? "text-sm font-medium text-muted-foreground line-through" : "text-sm font-medium"}>{c.title}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {c.lessons.length} lessons · {started} started · {finished} finished
                      {started > 0 && ` · ${Math.round((finished / started) * 100)}% completion`}
                    </p>
                  </div>
                  <ChapterControls courseId={c.id} access={setting.access} hidden={setting.hidden} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
