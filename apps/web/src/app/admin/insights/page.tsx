import Link from "next/link";
import { getFounderInsights } from "@/lib/actions/insights";
import { ActivityChart, FunnelChart, SignupsChart, StreakChart } from "./charts";

export const dynamic = "force-dynamic";

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The founder's view of learning, growth and revenue. */
export default async function AdminInsightsPage() {
  const data = await getFounderInsights().catch(() => null);

  if (!data) {
    return (
      <div className="space-y-2">
        <h1 className="text-[28px] font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">Couldn&apos;t load insights. Check the database connection and that `pnpm db:push` has been run.</p>
      </div>
    );
  }

  const { kpis, paywall, retention } = data;
  const kpiGroups = [
    {
      title: "Learners",
      items: [
        { label: "Total learners", value: kpis.totalUsers.toLocaleString(), note: `+${kpis.newUsers7} this week` },
        { label: "Active today", value: kpis.dau.toLocaleString(), note: "learned something today" },
        { label: "Active this week", value: kpis.wau.toLocaleString(), note: `${kpis.mau} in the last 30 days` },
        {
          label: "Stickiness",
          value: kpis.mau ? `${Math.round((kpis.dau / kpis.mau) * 100)}%` : "–",
          note: "daily ÷ monthly active",
        },
      ],
    },
    {
      title: "Learning",
      items: [
        { label: "Lessons completed", value: kpis.lessonsCompleted.toLocaleString(), note: `${kpis.lessons7} this week` },
        { label: "Day-1 return", value: retention.cohort ? `${retention.d1}%` : "–", note: "came back the day after signing up" },
        { label: "Week-2 return", value: retention.cohort ? `${retention.w2}%` : "–", note: "active 7–13 days after signing up" },
        { label: "Retention cohort", value: retention.cohort.toLocaleString(), note: "signed up 2–8 weeks ago" },
      ],
    },
    {
      title: "Revenue",
      items: [
        { label: "Pro subscribers", value: kpis.proSubscribers.toLocaleString(), note: `${kpis.monthlySubs} monthly · ${kpis.yearlySubs} yearly · ${kpis.lifetimeSubs} lifetime` },
        { label: "Monthly recurring revenue", value: usd(kpis.mrr), note: `${usd(kpis.arr)} a year · ${usd(kpis.lifetimeRevenue)} from lifetime` },
        { label: "Paid conversion", value: `${kpis.conversion}%`, note: "of all learners are Pro" },
        { label: "Cancelling", value: kpis.cancelling.toLocaleString(), note: "end at their period's close" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Insights</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">How people learn, where they drop off, and what it earns. Updated on every visit.</p>
        </div>
        <Link href="/admin/curriculum" className="text-sm font-semibold underline-offset-4 hover:underline">
          Change free and Pro chapters →
        </Link>
      </div>

      {kpiGroups.map((g) => (
        <section key={g.title}>
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {g.items.map((k) => (
              <div key={k.label} className="rounded-2xl p-4 bg-muted/50">
                <p className="text-[13px] text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{k.note}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityChart data={data.daily} />
        <SignupsChart data={data.daily} />
      </div>

      {/* Paywall */}
      <section className="rounded-2xl p-4 bg-muted/50">
        <p className="text-sm font-semibold">Paywall</p>
        {paywall.chapter ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[13px] text-muted-foreground">Reached the paywall</p>
              <p className="text-2xl font-semibold tabular-nums">{paywall.reached}</p>
              <p className="text-[13px] text-muted-foreground">finished every free chapter before chapter {paywall.chapter}</p>
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Then subscribed</p>
              <p className="text-2xl font-semibold tabular-nums">{paywall.converted}</p>
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Paywall conversion</p>
              <p className="text-2xl font-semibold tabular-nums">{paywall.reached ? `${paywall.rate}%` : "–"}</p>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Every visible chapter is free, so there&apos;s no paywall right now.</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelChart data={data.funnel} />
        <StreakChart data={data.streaks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl p-4 bg-muted/50">
          <p className="text-sm font-semibold">Hardest lessons</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Most wrong answers (lessons with at least 5 attempts). Worth reviewing.</p>
          {data.hardest.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Not enough attempts yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="text-left text-[13px] text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Lesson</th>
                  <th className="pb-2 text-right font-medium">Attempts</th>
                  <th className="pb-2 text-right font-medium">Wrong</th>
                  <th className="pb-2 text-right font-medium">Hints / try</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.hardest.map((h) => (
                  <tr key={h.lesson}>
                    <td className="py-2 pr-2">{h.lesson}</td>
                    <td className="py-2 text-right tabular-nums">{h.attempts}</td>
                    <td className="py-2 text-right tabular-nums">{h.wrongRate}%</td>
                    <td className="py-2 text-right tabular-nums">{h.hintsPerAttempt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl p-4 bg-muted/50">
          <p className="text-sm font-semibold">Top learners</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">By total XP.</p>
          {data.topLearners.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No learners yet.</p>
          ) : (
            <ol className="mt-3 divide-y divide-border/60 text-sm">
              {data.topLearners.map((l, i) => (
                <li key={i} className="flex items-center gap-3 py-2">
                  <span className="w-4 text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 truncate">
                    {l.name}
                    {l.pro && <span className="ml-2 rounded-xl bg-violet-600 px-1.5 py-0.5 text-[12px] font-semibold text-white">Pro</span>}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{l.streak}d streak</span>
                  <span className="w-20 text-right font-semibold tabular-nums">{l.xp.toLocaleString()} XP</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
