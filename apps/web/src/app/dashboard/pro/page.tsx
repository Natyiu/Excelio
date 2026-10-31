import { auth } from "@Batman/auth";
import { headers } from "next/headers";

import { CrownIcon as Crown } from "@hugeicons/react";
import { getSubscriptionStatus } from "@/lib/subscription";
import { IconTile, PageHeader, Panel } from "@/components/game-ui";

export default async function ProDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { subscription } = await getSubscriptionStatus(session!.user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Pro" description="You have an active subscription." />

      {subscription && (
        <Panel className="flex items-center gap-4 p-5">
          <IconTile tone="violet">
            <Crown className="h-6 w-6" />
          </IconTile>
          <div className="min-w-0">
            <p className="font-bold">
              Subscription · <span className="capitalize">{subscription.status}</span>
              {subscription.cancelAtPeriodEnd && (
                <span className="ml-1 font-normal text-muted-foreground">(ends at period end)</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Current period ends {subscription.currentPeriodEnd.toLocaleDateString()}
            </p>
          </div>
        </Panel>
      )}

      <p className="text-[15px] text-muted-foreground">
        This is a subscription-protected area. Add your premium content here.
      </p>
    </div>
  );
}
