import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import { cache } from "react";
import prisma from "@Batman/db";
import { COURSES } from "@/data/lessons";
import { listProductsForPricing } from "@/lib/actions/polar";
import { getSubscriptionStatus } from "@/lib/subscription";
import type { Billing } from "@/lib/plans";

/** Default when a chapter has no saved setting: the first 3 chapters are free. */
export const FREE_CHAPTERS = 3;

export type ChapterAccess = { access: "free" | "pro"; hidden: boolean };

/** Every chapter's access and visibility, saved settings first, defaults otherwise. */
export const getChapterSettings = cache(async (): Promise<Record<string, ChapterAccess>> => {
  // Falls back to the defaults if the table isn't there yet (before `pnpm db:push`, or a
  // dev server still holding a database client generated before this model existed).
  let rows: { courseId: string; access: string; hidden: boolean }[] = [];
  try {
    rows = await prisma.chapterSetting.findMany();
  } catch {
    rows = [];
  }
  const saved = new Map(rows.map((r) => [r.courseId, r]));
  return Object.fromEntries(
    COURSES.map((c, i) => {
      const row = saved.get(c.id);
      const access: ChapterAccess["access"] = row ? (row.access === "free" ? "free" : "pro") : i < FREE_CHAPTERS ? "free" : "pro";
      return [c.id, { access, hidden: row?.hidden ?? false }];
    })
  );
});

/** True when the chapter needs a Pro subscription. */
export async function isProCourse(courseId: string): Promise<boolean> {
  return (await getChapterSettings())[courseId]?.access === "pro";
}

/** Chapters learners can see, in course order. */
export async function visibleCourses() {
  const settings = await getChapterSettings();
  return COURSES.filter((c) => !settings[c.id]?.hidden);
}

/** Whether the signed-in learner has an active Pro subscription. */
export async function hasPro(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;
  return (await getSubscriptionStatus(session.user.id)).isSubscribed;
}

/** Names of the Excelio products in Polar. The store also holds other products, so match these exactly. */
export const PRO_PRODUCT_NAMES: Record<Billing, string> = {
  monthly: "Excelio Pro Monthly",
  yearly: "Excelio Pro Yearly",
  lifetime: "Excelio Pro Lifetime",
};

/** "Excelio Pro - Monthly" and "excelio pro monthly" compare equal. */
const normalise = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Polar product ids set in env, one per billing period. Sandbox and live have different
 * ids, so each environment sets its own (POLAR_PRODUCT_ID_MONTHLY / _YEARLY / _LIFETIME).
 */
export function configuredProductIds(): Partial<Record<Billing, string>> {
  const ids: Partial<Record<Billing, string>> = {};
  const env: Record<Billing, string | undefined> = {
    monthly: process.env.POLAR_PRODUCT_ID_MONTHLY,
    yearly: process.env.POLAR_PRODUCT_ID_YEARLY,
    lifetime: process.env.POLAR_PRODUCT_ID_LIFETIME,
  };
  for (const billing of Object.keys(env) as Billing[]) {
    const id = env[billing]?.trim();
    if (id) ids[billing] = id;
  }
  return ids;
}

/**
 * The Polar product to check out for each billing period. Uses the product ids from env
 * (see configuredProductIds). A plan with no id set falls back to matching by name, ignoring
 * spaces, dashes and case; failing that, the Excelio product with the right billing
 * (monthly, yearly or one-time). Products without "Excelio" in the name are never matched.
 */
export async function getProProducts(): Promise<Partial<Record<Billing, string>>> {
  const out = configuredProductIds();
  const missing = (Object.keys(PRO_PRODUCT_NAMES) as Billing[]).filter((b) => !out[b]);
  if (missing.length === 0) return out;

  const { products } = await listProductsForPricing().catch(() => ({ products: [] }));
  const excelio = products.filter((p) => normalise(p.name).includes("excelio"));
  for (const billing of missing) {
    const byName = excelio.find((p) => normalise(p.name) === normalise(PRO_PRODUCT_NAMES[billing]));
    const byBilling = excelio.find((p) =>
      billing === "lifetime" ? !p.isRecurring : p.isRecurring && p.recurringInterval === (billing === "monthly" ? "month" : "year")
    );
    const match = byName ?? byBilling;
    if (match) out[billing] = match.id;
  }
  return out;
}
