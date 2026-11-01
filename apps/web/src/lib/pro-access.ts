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

/** The Polar product to check out for each billing period, found by name. */
export async function getProProducts(): Promise<Partial<Record<Billing, string>>> {
  const { products } = await listProductsForPricing().catch(() => ({ products: [] }));
  const out: Partial<Record<Billing, string>> = {};
  for (const billing of Object.keys(PRO_PRODUCT_NAMES) as Billing[]) {
    const match = products.find((p) => p.name.trim().toLowerCase() === PRO_PRODUCT_NAMES[billing].toLowerCase());
    if (match) out[billing] = match.id;
  }
  return out;
}
