import { auth } from "@Batman/auth";
import prisma from "@Batman/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  let settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { id: "default" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true, emailVerified: true },
  });

  if (
    settings.maintenanceMode &&
    (session.user.role as string) !== "admin"
  ) {
    redirect("/maintenance" as never);
  }

  if (
    settings.emailVerificationEnabled &&
    user &&
    !user.emailVerified
  ) {
    redirect("/verify-email" as never);
  }

  if (user && !user.onboardingCompleted && settings.onboardingEnabled) {
    redirect("/onboarding" as never);
  }

  const unreadCount = await prisma.notificationRecipient.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <DashboardShell session={session} unreadNotifications={unreadCount}>
      {children}
    </DashboardShell>
  );
}
