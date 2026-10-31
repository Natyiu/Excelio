import { auth } from "@Batman/auth";
import prisma from "@Batman/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ExcelDashboardShell } from "@/components/excel-dashboard-shell";
import { getDashboardStats, getLeaderboard } from "@/lib/actions/excel-learning";

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
    select: { emailVerified: true },
  });

  if (settings.maintenanceMode && (session.user.role as string) !== "admin") {
    redirect("/maintenance" as never);
  }

  if (settings.emailVerificationEnabled && user && !user.emailVerified) {
    redirect("/verify-email" as never);
  }


  // Fetch dashboard stats for sidebar
  let stats;
  try {
    stats = await getDashboardStats();
  } catch {
    stats = null;
  }

  // This week's top three (and you, if you're further down) for the rail.
  const board = await getLeaderboard("weekly").catch(() => []);
  const me = board.find((e) => e.isCurrentUser);
  const leaders = [...board.slice(0, 3), ...(me && me.rank > 3 ? [me] : [])].map((e) => ({
    rank: e.rank,
    name: e.displayName,
    avatarUrl: e.avatarUrl,
    xp: e.xp,
    isMe: e.isCurrentUser,
  }));

  // Unread count for the Notifications badge in the sidebar.
  const unreadNotifications = await prisma.notificationRecipient
    .count({ where: { userId: session.user.id, read: false } })
    .catch(() => 0);

  return (
    <ExcelDashboardShell
      session={session}
      unreadNotifications={unreadNotifications}
      leaders={leaders}
      stats={stats ? {
        totalXp: stats.totalXp,
        currentStreak: stats.currentStreak,
        todayXp: stats.todayXp,
        todayMinutes: stats.todayMinutes,
        dailyGoalMinutes: stats.dailyGoalMinutes,
      } : undefined}
    >
      {children}
    </ExcelDashboardShell>
  );
}
