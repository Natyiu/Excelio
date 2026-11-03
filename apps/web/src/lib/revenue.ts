import prisma from "@Batman/db";
import { getPolarClient } from "@/lib/polar-client";
import { getProProducts } from "@/lib/pro-access";
import { PRO_LIFETIME, PRO_MONTHLY, PRO_YEARLY } from "@/lib/plans";

/**
 * Revenue numbers for the admin money dashboard, from Polar (the source of truth for
 * payments). Only Excelio's Pro products count; the Polar store also sells other things.
 * All amounts are in dollars. Call only after requireAdmin().
 */

export type Plan = "monthly" | "yearly" | "lifetime";
export const PLANS: Plan[] = ["monthly", "yearly", "lifetime"];

export type MonthRow = { key: string; label: string; monthly: number; yearly: number; lifetime: number; refunds: number };
export type RecentOrder = {
  id: string;
  date: string;
  customer: string;
  plan: Plan;
  amount: number;
  refunded: number;
  status: string;
  reason: "new" | "renewal" | "one-time" | "change";
};

export type RevenueData = {
  /** "polar": real payments. "estimate": Polar unreachable, list prices × our own subscription records. */
  source: "polar" | "estimate";
  error?: string;
  currency: string;
  mrr: number;
  mrrByPlan: { monthly: number; yearly: number };
  /** MRR from subscriptions set to cancel at the end of their period */
  atRiskMrr: number;
  activeSubs: { monthly: number; yearly: number };
  trialing: number;
  lifetimeCustomers: number;
  /** After discounts and refunds, before tax. Null when only estimating. */
  allTime: { revenue: number; refunds: number; fees: number; orders: number } | null;
  allTimeByPlan: Record<Plan, number> | null;
  months: MonthRow[];
  newThisMonth: Record<Plan, number>;
  churnedThisMonth: number;
  recent: RecentOrder[];
};

const cents = (n: number | null | undefined) => (n ?? 0) / 100;
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
};

/** Every month from `from` to now (inclusive), oldest first. */
function monthRange(from: Date, now = new Date()): string[] {
  const keys: string[] = [];
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const end = monthKey(now);
  for (let i = 0; i < 240; i++) {
    const k = monthKey(d);
    keys.push(k);
    if (k === end) break;
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return keys;
}

/** A subscription's price expressed per month. */
function perMonth(amount: number, interval: string, count: number) {
  const n = Math.max(1, count || 1);
  const months = interval === "year" ? 12 : interval === "month" ? 1 : interval === "week" ? 12 / 52 : interval === "day" ? 12 / 365 : 1;
  return amount / (months * n);
}

async function collect<T>(iterator: AsyncIterable<unknown>, maxPages = 50): Promise<T[]> {
  const out: T[] = [];
  let pages = 0;
  for await (const page of iterator) {
    const items = (page as { result?: { items?: T[] } }).result?.items ?? [];
    out.push(...items);
    if (++pages >= maxPages || items.length === 0) break;
  }
  return out;
}

export async function getRevenueData(): Promise<RevenueData> {
  const now = new Date();
  const thisMonth = monthKey(now);
  const products = await getProProducts().catch(() => ({}) as Partial<Record<Plan, string>>);
  const planOf = new Map<string, Plan>();
  for (const p of PLANS) if (products[p]) planOf.set(products[p]!, p);
  const polar = getPolarClient();

  if (!polar || planOf.size === 0) {
    return estimate(!polar ? "Payments aren't configured (POLAR_ACCESS_TOKEN is missing)." : "Couldn't find the Excelio products in Polar.");
  }

  try {
    const productId = [...planOf.keys()];
    type O = {
      id: string;
      createdAt: Date;
      status: string;
      netAmount: number;
      refundedAmount: number;
      refundedTaxAmount: number;
      platformFeeAmount: number;
      currency: string;
      billingReason: string;
      productId: string | null;
      customer?: { email?: string | null; name?: string | null } | null;
    };
    type S = {
      id: string;
      amount: number;
      recurringInterval: string;
      recurringIntervalCount: number;
      status: string;
      cancelAtPeriodEnd: boolean;
      canceledAt: Date | null;
      endedAt: Date | null;
      startedAt: Date | null;
      createdAt: Date;
      productId: string;
    };
    const [orders, subs] = await Promise.all([
      collect<O>(await polar.orders.list({ productId, limit: 100 })),
      collect<S>(await polar.subscriptions.list({ productId, limit: 100 })),
    ]);

    // ── Recurring revenue ──
    let mrrMonthly = 0;
    let mrrYearly = 0;
    let atRisk = 0;
    let trialing = 0;
    const activeSubs = { monthly: 0, yearly: 0 };
    let churned = 0;
    for (const s of subs) {
      const plan = planOf.get(s.productId);
      if (!plan || plan === "lifetime") continue;
      if (s.status === "trialing") trialing++;
      if (s.status === "active") {
        const m = perMonth(cents(s.amount), s.recurringInterval, s.recurringIntervalCount);
        if (plan === "yearly") mrrYearly += m;
        else mrrMonthly += m;
        activeSubs[plan]++;
        if (s.cancelAtPeriodEnd) atRisk += m;
      }
      const ended = s.endedAt ?? (s.status !== "active" && s.status !== "trialing" ? s.canceledAt : null);
      if (ended && monthKey(new Date(ended)) === thisMonth) churned++;
    }

    // ── Orders ──
    const counted = orders.filter((o) => o.status === "paid" || o.status === "refunded" || o.status === "partially_refunded");
    const first = counted.reduce<Date | null>((min, o) => (!min || o.createdAt < min ? new Date(o.createdAt) : min), null);
    const keys = monthRange(first ?? now, now);
    const months = new Map<string, MonthRow>(keys.map((k) => [k, { key: k, label: monthLabel(k), monthly: 0, yearly: 0, lifetime: 0, refunds: 0 }]));
    const byPlan: Record<Plan, number> = { monthly: 0, yearly: 0, lifetime: 0 };
    const newThisMonth: Record<Plan, number> = { monthly: 0, yearly: 0, lifetime: 0 };
    let revenue = 0;
    let refunds = 0;
    let fees = 0;
    const lifetimeBuyers = new Set<string>();

    for (const o of counted) {
      const plan = o.productId ? planOf.get(o.productId) : undefined;
      if (!plan) continue;
      const refund = Math.max(0, cents(o.refundedAmount) - cents(o.refundedTaxAmount));
      const net = Math.max(0, cents(o.netAmount) - refund);
      revenue += net;
      refunds += refund;
      fees += cents(o.platformFeeAmount);
      byPlan[plan] += net;
      const row = months.get(monthKey(new Date(o.createdAt)));
      if (row) {
        row[plan] += net;
        row.refunds += refund;
      }
      const isNew = o.billingReason === "purchase" || o.billingReason === "subscription_create";
      if (isNew && monthKey(new Date(o.createdAt)) === thisMonth) newThisMonth[plan]++;
      if (plan === "lifetime" && o.status !== "refunded") lifetimeBuyers.add(o.customer?.email ?? o.id);
    }

    const recent: RecentOrder[] = [...counted]
      .filter((o) => o.productId && planOf.has(o.productId))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 50)
      .map((o) => ({
        id: o.id,
        date: new Date(o.createdAt).toISOString(),
        customer: o.customer?.email ?? o.customer?.name ?? "Unknown",
        plan: planOf.get(o.productId!)!,
        amount: cents(o.netAmount),
        refunded: Math.max(0, cents(o.refundedAmount) - cents(o.refundedTaxAmount)),
        status: o.status,
        reason:
          o.billingReason === "subscription_cycle"
            ? "renewal"
            : o.billingReason === "subscription_create"
              ? "new"
              : o.billingReason === "subscription_update"
                ? "change"
                : "one-time",
      }));

    return {
      source: "polar",
      currency: (counted[0]?.currency ?? "usd").toUpperCase(),
      mrr: mrrMonthly + mrrYearly,
      mrrByPlan: { monthly: mrrMonthly, yearly: mrrYearly },
      atRiskMrr: atRisk,
      activeSubs,
      trialing,
      lifetimeCustomers: lifetimeBuyers.size,
      allTime: { revenue, refunds, fees, orders: counted.length },
      allTimeByPlan: byPlan,
      months: [...months.values()],
      newThisMonth,
      churnedThisMonth: churned,
      recent,
    };
  } catch (e) {
    return estimate(`Couldn't read payments from Polar: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Fallback when Polar can't be reached: list prices × our own subscription records. */
async function estimate(error: string): Promise<RevenueData> {
  const subs = await prisma.subscription.findMany().catch(() => []);
  const products = await getProProducts().catch(() => ({}) as Partial<Record<Plan, string>>);
  const now = new Date();
  const activeSubs = { monthly: 0, yearly: 0 };
  let lifetime = 0;
  let atRisk = 0;
  for (const s of subs) {
    if (s.status === "lifetime" || s.polarSubscriptionId.startsWith("order_")) {
      lifetime++;
      continue;
    }
    if (s.status !== "active" || s.currentPeriodEnd <= now) continue;
    const plan: Plan = s.productId && s.productId === products.yearly ? "yearly" : "monthly";
    activeSubs[plan]++;
    if (s.cancelAtPeriodEnd) atRisk += plan === "yearly" ? PRO_YEARLY / 12 : PRO_MONTHLY;
  }
  const mrrByPlan = { monthly: activeSubs.monthly * PRO_MONTHLY, yearly: (activeSubs.yearly * PRO_YEARLY) / 12 };
  return {
    source: "estimate",
    error,
    currency: "USD",
    mrr: mrrByPlan.monthly + mrrByPlan.yearly,
    mrrByPlan,
    atRiskMrr: atRisk,
    activeSubs,
    trialing: 0,
    lifetimeCustomers: lifetime,
    allTime: null,
    allTimeByPlan: lifetime ? { monthly: 0, yearly: 0, lifetime: lifetime * PRO_LIFETIME } : null,
    months: [],
    newThisMonth: { monthly: 0, yearly: 0, lifetime: 0 },
    churnedThisMonth: 0,
    recent: [],
  };
}
