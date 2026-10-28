import { auth } from "@Batman/auth";
import prisma from "@Batman/db";
import { headers } from "next/headers";

import { DashboardHome } from "@/components/dashboard-shell";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: { organizationsEnabled: true },
  });

  return (
    <DashboardHome
      userName={session?.user?.name ?? undefined}
      organizationsEnabled={settings?.organizationsEnabled ?? false}
    />
  );
}
