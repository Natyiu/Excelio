import Link from "next/link";
import { notFound } from "next/navigation";
import { LEVELS, levelStyle, parseLevel } from "@/components/level-picker";
import { Mascot } from "@/components/mascot";
import { pressable } from "@/components/game-ui";
import { CHALLENGES, todaysChallenge } from "@/data/curriculum/challenges";
import { getCompletedChallengeIds } from "@/lib/actions/excel-learning";
import { cn } from "@/lib/utils";

export default async function LevelChallengesPage({ params }: { params: Promise<{ level: string }> }) {
  const level = parseLevel((await params).level);
  if (!level) notFound();
  const info = LEVELS.find((l) => l.id === level)!;
  const list = CHALLENGES[level];
  const today = todaysChallenge(level);
  const done = new Set(await getCompletedChallengeIds().catch(() => []));
  const href = (id: string) => `/dashboard/daily-challenge/${level}/${id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8" style={levelStyle(level)}>
      <div>
        <Link href="/dashboard/daily-challenge" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← All stages
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{info.label} challenges</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">{info.blurb}</p>
      </div>

      {/* Today's pick: a big banner in the stage colour */}
      <div className="relative flex items-center gap-5 overflow-hidden rounded-3xl bg-brand p-6 text-brand-foreground">
        <Mascot mood="cheer" size={110} className="-my-4 hidden sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold uppercase tracking-wide opacity-80">Today&apos;s challenge</p>
          <p className="mt-1 text-2xl font-bold">{today.title}</p>
          <p className="mt-1 text-[15px] opacity-90">{today.description}</p>
        </div>
        <Link
          href={href(today.id) as never}
          className="shrink-0 rounded-full border-2 border-white/25 bg-brand-deep px-6 py-3 text-sm font-bold uppercase tracking-wide shadow-[0_4px_0_rgb(0_0_0/0.25)] transition-transform active:translate-y-1 active:shadow-none"
        >
          {done.has(today.id) ? "Play again" : "Start"}
        </Link>
      </div>

      {/* Every challenge at this stage, as a numbered path */}
      <ol className="relative space-y-3">
        <span aria-hidden className="absolute bottom-8 left-[27px] top-8 w-1 rounded-full bg-border" />
        {list.map((c, i) => {
          const finished = done.has(c.id);
          return (
            <li key={c.id} className="relative">
              <Link href={href(c.id) as never} className="group flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-muted/50">
                <span
                  className={cn(
                    "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                    finished ? "bg-brand text-brand-foreground shadow-[0_5px_0_var(--brand-deep)]" : "border-2 border-border bg-card text-muted-foreground shadow-[0_5px_0_var(--border)]"
                  )}
                >
                  {finished ? "✓" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-lg font-bold">{c.title}</span>
                    <span className={cn("text-sm font-bold", finished ? "text-muted-foreground" : "text-brand")}>
                      {finished ? "Done" : `+${c.xpReward} XP`}
                    </span>
                  </span>
                  <span className="block text-[15px] text-muted-foreground">{c.description}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {c.skills.map((s) => (
                      <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </span>
                </span>
                <span className={pressable(finished ? "outline" : "brand", "hidden shrink-0 px-5 sm:inline-flex")}>{finished ? "Replay" : "Play"}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
