"use server";

import prisma from "@Batman/db";
import { requireAuth } from "@/lib/auth-guards";
import { revokePolarSubscription } from "@/lib/polar-revoke";

/**
 * Permanently delete the signed-in learner's account and everything tied to it.
 * Progress, XP, streaks, achievements, sessions and logins are removed with the user row;
 * the few tables that don't reference it directly are cleared here first.
 */
export async function deleteMyAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAuth();
  const userId = session.user.id;

  // Don't lock everyone out of the admin panel.
  if (session.user.role === "admin") {
    const admins = await prisma.user.count({ where: { role: "admin" } });
    if (admins <= 1) return { ok: false, error: "You're the only admin. Make someone else an admin before deleting your account." };
  }

  // Stop billing first; if that fails, keep the account so the subscription isn't orphaned.
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (sub && (sub.status === "active" || sub.status === "trialing") && sub.currentPeriodEnd > new Date()) {
    try {
      await revokePolarSubscription(sub.polarSubscriptionId);
    } catch {
      return { ok: false, error: "We couldn't cancel your Pro subscription, so your account wasn't deleted. Please try again or contact support." };
    }
  }

  // The reviews table may not exist yet on databases that haven't run `pnpm db:push`.
  try {
    await prisma.testimonial.deleteMany({ where: { userId } });
  } catch {
    // no reviews table yet
  }
  await prisma.$transaction([
    prisma.feedback.deleteMany({ where: { userId } }),
    prisma.notificationRecipient.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  return { ok: true };
}
