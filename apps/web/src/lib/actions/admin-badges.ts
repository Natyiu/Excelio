"use server";

import prisma from "@Batman/db";
import { requireAdmin } from "@/lib/auth-guards";

export type AdminBadges = { feedback: number; testimonials: number; paidUsers: number; users: number };

/**
 * Counts for the admin sidebar badges: what's new since the admin last opened each page
 * (those times are kept in the admin's browser). Opening the page clears its badge.
 */
export async function getAdminBadges(since: Partial<Record<keyof AdminBadges, string>>): Promise<AdminBadges> {
  await requireAdmin();
  // No "last looked" time means nothing counts as new yet.
  const date = (iso?: string) => {
    const d = iso ? new Date(iso) : null;
    return d && !Number.isNaN(d.getTime()) ? d : new Date();
  };

  const [feedback, testimonials, paidUsers, users] = await Promise.all([
    prisma.feedback.count({ where: { createdAt: { gt: date(since.feedback) } } }).catch(() => 0),
    prisma.testimonial.count({ where: { createdAt: { gt: date(since.testimonials) } } }).catch(() => 0),
    prisma.subscription.count({ where: { createdAt: { gt: date(since.paidUsers) } } }).catch(() => 0),
    prisma.user.count({ where: { createdAt: { gt: date(since.users) } } }).catch(() => 0),
  ]);
  return { feedback, testimonials, paidUsers, users };
}
