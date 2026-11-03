import { COURSES } from "@/data/lessons";
import { listRivals } from "@/lib/actions/rivals";
import { RivalBadge } from "@/components/rival-badge";
import { DeleteAllRivals, RivalEditor, RivalRowActions } from "./rival-editor";

export const dynamic = "force-dynamic";

const LEVEL_LABEL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

/** Admin: rival learners that fill out the leaderboard while the app is new. */
export default async function AdminRivalsPage() {
  const rivals = await listRivals().catch(() => null);
  const chapters = COURSES.map((c, i) => ({
    id: c.id,
    label: `Ch ${i + 1}: ${c.title}`,
    level: c.difficulty,
    lessonXp: c.lessons.map((l) => l.xpReward),
  }));
  const chapterLabel = new Map(chapters.map((c) => [c.id, c.label]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Rivals</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            Practice rivals keep the leaderboard lively while Excelio is new. Learners see them with a{" "}
            <RivalBadge /> badge. They can&apos;t sign in, pay or post reviews, and aren&apos;t counted in your stats. Delete
            them once enough real learners have joined.
          </p>
        </div>
        <div className="flex gap-2">
          {rivals && rivals.length > 0 && <DeleteAllRivals count={rivals.length} />}
          <RivalEditor chapters={chapters} />
        </div>
      </div>

      {!rivals ? (
        <div className="rounded-2xl bg-muted/50 p-6 text-sm">
          <p className="font-semibold">The rivals table isn&apos;t in the database yet.</p>
          <p className="mt-1 text-muted-foreground">
            Run <code className="rounded bg-muted px-1.5 py-0.5">pnpm db:push</code> once from the project folder, then reload this page.
          </p>
        </div>
      ) : rivals.length === 0 ? (
        <div className="rounded-2xl bg-muted/50 py-16 text-center">
          <p className="text-sm text-muted-foreground">No rivals yet.</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Add a few with different XP so the leaderboard has someone to chase.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-muted/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                <th className="px-4 py-3">Rival</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Chapter</th>
                <th className="px-4 py-3 text-right">Lessons</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Week XP</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Total XP</th>
                <th className="px-4 py-3 text-right">Streak</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rivals.map((r) => (
                <tr key={r.id} className={r.active ? "" : "text-muted-foreground"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-bold">
                          {r.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span>
                        <span className="font-medium">{r.name}</span>
                        {!r.active && <span className="ml-2 text-[12px]">(hidden)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{LEVEL_LABEL[r.level] ?? r.level}</td>
                  <td className="max-w-48 truncate px-4 py-3">{r.currentChapter ? chapterLabel.get(r.currentChapter) ?? r.currentChapter : "–"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.lessonsCompleted}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.weeklyXp.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.totalXp.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.currentStreak}🔥</td>
                  <td className="px-4 py-3">
                    <RivalRowActions
                      chapters={chapters}
                      rival={{
                        id: r.id,
                        name: r.name,
                        avatarUrl: r.avatarUrl ?? "",
                        level: r.level as "beginner" | "intermediate" | "advanced",
                        currentChapter: r.currentChapter ?? "",
                        lessonsCompleted: r.lessonsCompleted,
                        totalXp: r.totalXp,
                        weeklyXp: r.weeklyXp,
                        currentStreak: r.currentStreak,
                        active: r.active,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
