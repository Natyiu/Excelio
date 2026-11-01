import { getPaidUsers, type PaidUser } from "@/lib/actions/polar";
import { PRO_LIFETIME, PRO_MONTHLY, PRO_YEARLY } from "@/lib/plans";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<PaidUser["plan"], string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  lifetime: "Lifetime",
  unknown: "Pro",
};

const date = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function statusLabel(u: PaidUser) {
  if (u.plan === "lifetime") return u.active ? "Lifetime" : u.status;
  if (!u.active) return u.status === "active" ? "Expired" : u.status;
  if (u.cancelAtPeriodEnd) return `Cancels ${date(u.currentPeriodEnd)}`;
  return u.status === "trialing" ? `Trial until ${date(u.currentPeriodEnd)}` : `Renews ${date(u.currentPeriodEnd)}`;
}

/** Everyone who has paid for Pro: monthly, yearly or lifetime. */
export default async function AdminPaidUsersPage() {
  const users = await getPaidUsers().catch(() => null);

  if (!users) {
    return (
      <div className="space-y-2">
        <h1 className="text-[28px] font-bold tracking-tight">Paid Users</h1>
        <p className="text-sm text-muted-foreground">Couldn&apos;t load paid users. Check the database connection.</p>
      </div>
    );
  }

  const active = users.filter((u) => u.active);
  const count = (plan: PaidUser["plan"]) => active.filter((u) => u.plan === plan).length;
  const stats = [
    { label: "Paying now", value: active.length, note: `${users.length - active.length} ended or refunded` },
    { label: "Monthly", value: count("monthly"), note: `$${PRO_MONTHLY}/month` },
    { label: "Yearly", value: count("yearly"), note: `$${PRO_YEARLY}/year` },
    { label: "Lifetime", value: count("lifetime"), note: `$${PRO_LIFETIME} once` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">Paid Users</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Everyone who bought Pro, from Polar webhooks. Updated on every visit.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-4 bg-muted/50">
            <p className="text-[13px] text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl bg-muted/50 py-16 text-center">
          <p className="text-sm text-muted-foreground">No paid users yet.</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            If someone has paid, check that the Polar webhook is enabled and returning 200.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-muted/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Paid since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.map((u) => (
                <tr key={u.userId} className={u.active ? "" : "text-muted-foreground"}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-[13px] text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{PLAN_LABEL[u.plan]}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                        u.active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabel(u)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{date(u.since)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
