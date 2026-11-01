import prisma from "@Batman/db";
import type { SubscriptionStatus } from "@/types/subscription";

// "lifetime" is a one-time Pro purchase; it never expires.
const ACTIVE_STATUSES = ["active", "trialing", "lifetime"] as const;

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!sub) {
    return { isSubscribed: false, subscription: null };
  }

  // Monthly/yearly plans stay open until their period ends. A renewal moves the end date
  // forward via the Polar webhook; if the payment fails Polar changes the status (past_due,
  // canceled, revoked) and access locks. The short grace covers a renewal webhook arriving
  // a little after the old period ends, so paying learners aren't locked out for minutes.
  const RENEWAL_GRACE_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const isActive =
    ACTIVE_STATUSES.includes(sub.status as (typeof ACTIVE_STATUSES)[number]) &&
    sub.currentPeriodEnd.getTime() + RENEWAL_GRACE_MS > now;

  return {
    isSubscribed: isActive,
    subscription: {
      id: sub.id,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    },
  };
}

export async function requireSubscription(userId: string): Promise<SubscriptionStatus> {
  const status = await getSubscriptionStatus(userId);
  if (!status.isSubscribed) {
    throw new SubscriptionRequiredError();
  }
  return status;
}

export class SubscriptionRequiredError extends Error {
  constructor() {
    super("Subscription required");
    this.name = "SubscriptionRequiredError";
  }
}
