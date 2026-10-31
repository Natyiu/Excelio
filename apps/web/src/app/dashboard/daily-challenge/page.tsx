import Link from "next/link";
import { LEVELS, levelStyle } from "@/components/level-picker";
import { Mascot } from "@/components/mascot";
import { SectionTitle } from "@/components/game-ui";
import { CHALLENGES } from "@/data/curriculum/challenges";
import { getCompletedChallengeIds } from "@/lib/actions/excel-learning";
import { cn } from "@/lib/utils";

/**
 * The challenge arena: a banner with overall progress and a jump to the next
 * unfinished challenge, then one row per tier with pips for each challenge.
 */
export default async function ChallengesHubPage() {
  const done = new Set(await getCompletedChallengeIds().catch(() => []));
  const all = LEVELS.flatMap((l) => CHALLENGES[l.id].map((c) => ({ level: l.id, challenge: c })));
  const cleared = all.filter((x) => done.has(x.challenge.id)).length;
  const next = all.find((x) => !done.has(x.challenge.id));

  return (
    <div className="space-y-8">
      {/* Arena banner */}
      <section className="relative overflow-hidden rounded-2xl bg-brand px-6 pb-7 pt-8 text-brand-foreground">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(white_1.5px,transparent_1.5px)] [background-size:20px_20px] [mask-image:linear-gradient(to_left,black,transparent_85%)]"
        />
        <Mascot mood="trophy" size={150} className="absolute -bottom-2 right-4 hidden sm:block" />
        <div className="relative max-w-md">
          <p className="text-[13px] font-bold uppercase tracking-wide opacity-80">Challenge arena</p>
          <h1 className="mt-1 text-3xl font-bold">Prove what you know.</h1>
          <p className="mt-2 text-[15px] opacity-90">
            Real-world problems, checked live. {cleared} of {all.length} cleared so far.
          </p>
          {next && (
            <Link
              href={`/dashboard/daily-challenge/${next.level}/${next.challenge.id}` as never}
              className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-brand-deep px-5 py-2.5 text-sm font-bold uppercase tracking-wide shadow-[0_4px_0_rgb(0_0_0/0.25)] transition-transform hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              Next up: {next.challenge.title} <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </section>

      {/* Tiers */}
      <section>
        <SectionTitle>Tiers</SectionTitle>
        <div className="space-y-4">
          {LEVELS.map((l, i) => {
            const list = CHALLENGES[l.id];
            const tierCleared = list.filter((c) => done.has(c.id)).length;
            const complete = tierCleared === list.length;
            return (
              <Link
                key={l.id}
                href={`/dashboard/daily-challenge/${l.id}` as never}
                style={levelStyle(l.id)}
                className="group flex items-center gap-4 rounded-3xl border-2 border-b-[5px] border-border bg-card p-4 transition-colors hover:border-brand active:translate-y-0.5 sm:gap-5 sm:p-5"
              >
                {/* medallion */}
                <span className="relative flex h-20 w-20 shrink-0 items-end justify-center overflow-hidden rounded-2xl bg-brand shadow-[0_4px_0_var(--brand-deep)]">
                  <Mascot mood={l.mood} size={72} className="-mb-1" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="text-[12px] font-bold uppercase tracking-wide text-brand">Tier {i + 1}</span>
                  <span className="block text-xl font-bold leading-tight">{l.label}</span>
                  <span className="mt-0.5 block truncate text-[14px] text-muted-foreground">{l.blurb}</span>
                  {/* one pip per challenge */}
                  <span className="mt-2.5 flex items-center gap-1.5">
                    {list.map((c) => (
                      <span key={c.id} className={cn("h-2.5 flex-1 rounded-full sm:max-w-10", done.has(c.id) ? "bg-brand" : "bg-muted")} />
                    ))}
                    <span className="ml-1.5 shrink-0 text-[12px] font-semibold text-muted-foreground">
                      {tierCleared}/{list.length}
                    </span>
                  </span>
                </span>

                <span className="hidden shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-brand-foreground shadow-[0_4px_0_var(--brand-deep)] transition-transform group-active:translate-y-1 group-active:shadow-none sm:block">
                  {complete ? "Replay" : tierCleared ? "Continue" : "Enter"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
