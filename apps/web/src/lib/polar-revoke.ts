import prisma from "@Batman/db";
import { Polar } from "@polar-sh/sdk";

/** Cancel a Polar subscription straight away (account deleted, or replaced by Lifetime) so it stops being charged. */
export async function revokePolarSubscription(polarSubscriptionId: string) {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: { polarAccessToken: true, polarSandboxMode: true },
  });
  const token = (settings?.polarAccessToken || process.env.POLAR_ACCESS_TOKEN)?.trim();
  if (!token) throw new Error("Payments aren't configured");
  const sandbox = settings?.polarSandboxMode ?? process.env.POLAR_SANDBOX_MODE !== "false";
  const polar = new Polar({ accessToken: token, ...(sandbox && { server: "sandbox" as const }) });
  await polar.subscriptions.revoke({ id: polarSubscriptionId });
}
