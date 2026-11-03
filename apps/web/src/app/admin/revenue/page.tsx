import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";
import { getRevenueData, PLANS, type Plan } from "@/lib/revenue";
import { cn } from "@/lib/utils";
import { RevenueChart } from "./revenue-chart";
import { PLAN_STYLE } from "@/lib/revenue-style";

export const dynamic = "force-dynamic";

type Range = "6m" | "12m" | "all";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });
const pct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n)}%`;

/** The money dashboard: recurring revenue, all-time revenue, trends and recent payments. */
export default async function AdminRevenuePage({ searchParams }: { searchParams: Promise<{ plan?: string; range?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const plan: Plan | "all" = PLANS.includes(sp.plan as Plan) ? (sp.plan as Plan) : "all";
  const range: Range = sp.range === "6m" || sp.range === "all" ? sp.range : "12m";
  const data = await getRevenueData();

  const plans: Plan[] = plan === "all" ? PLANS : [plan];
  const recurring = plan !== "lifetime";
  const mrr = plan === "all" ? data.mrr : plan === "lifetime" ? 0 : data.mrrByPlan[plan];
  const subs = plan === "all" ? data.activeSubs.monthly + data.activeSubs.yearly : plan === "lifetime" ? 0 : data.activeSubs[plan];
  const payingCustomers = plan === "all" ? subs + data.lifetimeCustomers : plan === "lifetime" ? data.lifetimeCustomers : subs;
  const sumPlans = (r: { monthly: number; yearly: number; lifetime: number }) => plans.reduce((s, p) => s + r[p], 0);

  const months = range === "all" ? data.months : data.months.slice(range === "6m" ? -6 : -12);
  const thisMonth = data.months.at(-1);
  const lastMonth = data.months.at(-2);
  const thisRev = thisMonth ? sumPlans(thisMonth) : 0;
  const lastRev = lastMonth ? sumPlans(lastMonth) : 0;
  const growth = lastRev > 0 ? ((thisRev - lastRev) / lastRev) * 100 : null;
  const allTime = data.allTimeByPlan ? sumPlans(data.allTimeByPlan) : null;
  const newCount = plans.reduce((s, p) => s + data.newThisMonth[p], 0);
  const recent = data.recent.filter((o) => plans.includes(o.plan)).slice(0, 20);
  const churnBase = subs + data.churnedThisMonth;
  const churnRate = recurring && churnBase > 0 ? (data.churnedThisMonth / churnBase) * 100 : null;

  const href = (next: Partial<{ plan: Plan | "all"; range: Range }>) => {
    const q = new URLSearchParams();
    const p = next.plan ?? plan;
    const r = next.range ?? range;
    if (p !== "all") q.set("plan", p);
    if (r !== "12m") q.set("range", r);
    return `/admin/revenue${q.size ? `?${q}` : ""}`;
  };

  const hero = [
    {
      label: "MRR",
      value: recurring ? usd(mrr) : "–",
      note: recurring ? "Monthly recurring revenue" : "Lifetime isn't recurring",
    },
    { label: "ARR", value: recurring ? usd(mrr * 12) : "–", note: "MRR × 12" },
    {
      label: "All-time revenue",
      value: allTime === null ? "–" : usd(allTime),
      note: data.allTime ? `${data.allTime.orders} payments, after refunds` : "Needs Polar",
    },
    {
      label: "This month",
      value: data.source === "polar" ? usd(thisRev) : "–",
      note: growth === null ? `${usd(lastRev)} last month` : `${pct(growth)} vs last month (${usd(lastRev)})`,
      tone: growth === null ? undefined : growth >= 0 ? "up" : "down",
    },
  ];

  const secondary = [
    { label: "Paying customers", value: String(payingCustomers), note: `${subs} subscribed · ${plan === "all" || plan === "lifetime" ? data.lifetimeCustomers : 0} lifetime` },
    { label: "Avg. revenue per subscriber", value: subs ? usd(mrr / subs) : "–", note: "MRR ÷ active subscriptions" },
    { label: "New this month", value: String(newCount), note: "First payments" },
    {
      label: "Cancelled this month",
      value: recurring ? String(data.churnedThisMonth) : "–",
      note: churnRate === null ? "Subscriptions ended" : `${churnRate.toFixed(1)}% churn`,
    },
    { label: "MRR at risk", value: recurring ? usd(data.atRiskMrr) : "–", note: "Set to cancel at period end" },
    { label: "Refunded", value: data.allTime ? usd(data.allTime.refunds) : "–", note: "All time" },
    { label: "Polar fees", value: data.allTime ? usd(data.allTime.fees) : "–", note: data.allTime ? `${usd(data.allTime.revenue - data.allTime.fees)} kept after fees` : "" },
    { label: "Trials", value: String(data.trialing), note: "Not paying yet" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Revenue</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Live from Polar. Amounts are after discounts and refunds, before tax. Only Excelio Pro products count.
          </p>
        </div>
        {/* Filters, one row */}
        <div className="flex flex-wrap gap-2">
          <nav className="inline-flex rounded-full bg-muted/60 p-1" aria-label="Plan">
            {(["all", ...PLANS] as const).map((p) => (
              <Link
                key={p}
                href={href({ plan: p }) as never}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  plan === p ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p !== "all" && <span className={cn("h-2 w-2 rounded-sm", PLAN_STYLE[p].swatch)} />}
                {p === "all" ? "All plans" : PLAN_STYLE[p].label}
              </Link>
            ))}
          </nav>
          <nav className="inline-flex rounded-full bg-muted/60 p-1" aria-label="Time range">
            {(["6m", "12m", "all"] as const).map((r) => (
              <Link
                key={r}
                href={href({ range: r }) as never}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  range === r ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r === "6m" ? "6 months" : r === "12m" ? "12 months" : "All time"}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {data.source === "estimate" && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-semibold">Showing estimates</p>
          <p className="mt-0.5 text-muted-foreground">
            {data.error} MRR below uses list prices × your active subscriptions; revenue history needs Polar.
          </p>
        </div>
      )}

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {hero.map((h) => (
          <div key={h.label} className="rounded-2xl bg-muted/50 p-4">
            <p className="text-[13px] text-muted-foreground">{h.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{h.value}</p>
            <p
              className={cn(
                "mt-0.5 text-[13px]",
                h.tone === "up" ? "text-brand" : h.tone === "down" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
              )}
            >
              {h.tone === "up" ? "▲ " : h.tone === "down" ? "▼ " : ""}
              {h.note}
            </p>
          </div>
        ))}
      </div>

      <RevenueChart rows={months} plans={plans} />

      {/* Split by plan */}
      {plan === "all" && data.allTimeByPlan && allTime !== null && allTime > 0 && (
        <div className="rounded-2xl bg-muted/50 p-4">
          <p className="mb-3 font-semibold">All-time revenue by plan</p>
          <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
            {PLANS.map((p) =>
              data.allTimeByPlan![p] > 0 ? (
                <span key={p} className={PLAN_STYLE[p].swatch} style={{ flexGrow: data.allTimeByPlan![p] }} />
              ) : null
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {PLANS.map((p) => (
              <div key={p}>
                <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <span className={cn("h-2.5 w-2.5 rounded-sm", PLAN_STYLE[p].swatch)} />
                  {PLAN_STYLE[p].label}
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums">
                  {usd(data.allTimeByPlan![p])}{" "}
                  <span className="text-[13px] font-normal text-muted-foreground">
                    {Math.round((data.allTimeByPlan![p] / allTime) * 100)}%
                  </span>
                </p>
              </div>
            ))}
          </div>
          {recurring && (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Recurring today: {usd(data.mrrByPlan.monthly)}/mo from {data.activeSubs.monthly} monthly and {usd(data.mrrByPlan.yearly)}/mo from{" "}
              {data.activeSubs.yearly} yearly subscribers.
            </p>
          )}
        </div>
      )}

      {/* Supporting numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {secondary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border p-4">
            <p className="text-[13px] text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{s.value}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Recent payments */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent payments</h2>
        {recent.length === 0 ? (
          <p className="rounded-2xl bg-muted/50 py-10 text-center text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-muted/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="max-w-56 truncate px-4 py-3">{o.customer}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-sm", PLAN_STYLE[o.plan].swatch)} />
                        {PLAN_STYLE[o.plan].label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 capitalize text-muted-foreground">{o.reason}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                      {usd(o.amount)}
                      {o.refunded > 0 && <span className="block text-[12px] text-muted-foreground">−{usd(o.refunded)} refunded</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[12px] font-medium",
                          o.status === "paid" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {o.status === "paid" ? "Paid" : o.status === "refunded" ? "Refunded" : "Part refunded"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
