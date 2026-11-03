"use server";

import prisma from "@Batman/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { getPolarClient } from "@/lib/polar-client";

export type RemoveProMode = "now" | "period_end";

export type RemoveProResult = { ok: true; warning?: string } | { ok: false; error: string };

const isLifetime = (s: { status: string; polarSubscriptionId: string }) =>
  s.status === "lifetime" || s.polarSubscriptionId.startsWith("order_");

/**
 * Admin: take Pro away from a learner.
 * - "period_end": cancel the subscription in Polar; they keep Pro until the paid period ends.
 * - "now": revoke it in Polar (charging stops) and lock Pro straight away.
 * Lifetime purchases have nothing to cancel in Polar, so they're always removed now.
 * Refunds aren't issued here; do those in the Polar dashboard.
 */
export async function adminRemovePro(userId: string, mode: RemoveProMode): Promise<RemoveProResult> {
  await requireAdmin();
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return { ok: false, error: "This user has no Pro subscription." };

  const polar = getPolarClient();
  const lifetime = isLifetime(sub);

  if (mode === "period_end") {
    if (lifetime) return { ok: false, error: "Lifetime Pro has no renewal to cancel. Use “Remove now”." };
    if (!polar) return { ok: false, error: "Payments aren't configured (POLAR_ACCESS_TOKEN is missing)." };
    try {
      await polar.subscriptions.update({
        id: sub.polarSubscriptionId,
        subscriptionUpdate: { cancelAtPeriodEnd: true },
      });
    } catch (e) {
      return { ok: false, error: `Polar couldn't cancel it: ${e instanceof Error ? e.message : String(e)}` };
    }
    await prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: true } });
    revalidatePath("/admin/paid-users");
    return { ok: true };
  }

  // Remove now: stop the charges in Polar first, then lock access here either way.
  let warning: string | undefined;
  if (!lifetime) {
    if (!polar) {
      warning = "Payments aren't configured, so the subscription wasn't cancelled in Polar. Cancel it there too.";
    } else {
      try {
        await polar.subscriptions.revoke({ id: sub.polarSubscriptionId });
      } catch (e) {
        warning = `Pro was removed here, but Polar couldn't revoke the subscription (${
          e instanceof Error ? e.message : String(e)
        }). Check it in the Polar dashboard so they aren't charged again.`;
      }
    }
  }

  await prisma.subscription.update({
    where: { userId },
    data: { status: "revoked", cancelAtPeriodEnd: false, currentPeriodEnd: new Date() },
  });
  revalidatePath("/admin/paid-users");
  return { ok: true, warning };
}
