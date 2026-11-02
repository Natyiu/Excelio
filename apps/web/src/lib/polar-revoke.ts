import { getPolarClient } from "@/lib/polar-client";

/** Cancel a Polar subscription straight away (account deleted, or replaced by Lifetime) so it stops being charged. */
export async function revokePolarSubscription(polarSubscriptionId: string) {
  const polar = getPolarClient();
  if (!polar) throw new Error("Payments aren't configured");
  await polar.subscriptions.revoke({ id: polarSubscriptionId });
}
