import prisma from "@Batman/db";
import { redirect } from "next/navigation";
import { ExcelDashboardShell } from "@/components/excel-dashboard-shell";
import { getLeaderboard } from "@/lib/actions/excel-learning";
import { getDashboardStatsCached, getSessionCached } from "@/lib/request-cache";
import { getActiveAnnouncements } from "@/lib/actions/announcements";
import { AnnouncementBar } from "@/components/announcement-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionCached();

  if (!session?.user) {
    redirect("/login");
  }

  // Everything below is independent, so fetch it all at once instead of one after another.
  const [existingSettings, user, stats, board, unreadNotifications, announcements] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: "default" } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    }),
    getDashboardStatsCached().catch(() => null),
    getLeaderboard("weekly").catch(() => []),
    // Unread count for the Notifications badge in the sidebar.
    prisma.notificationRecipient
      .count({ where: { userId: session.user.id, read: false } })
      .catch(() => 0),
    getActiveAnnouncements(),
  ]);
  const settings = existingSettings ?? (await prisma.appSettings.create({ data: { id: "default" } }));

  if (settings.maintenanceMode && (session.user.role as string) !== "admin") {
    redirect("/maintenance" as never);
  }

  if (settings.emailVerificationEnabled && user && !user.emailVerified) {
    redirect("/verify-email" as never);
  }

  // This week's top three (and you, if you're further down) for the rail.
  const me = board.find((e) => e.isCurrentUser);
  const leaders = [...board.slice(0, 3), ...(me && me.rank > 3 ? [me] : [])].map((e) => ({
    rank: e.rank,
    name: e.displayName,
    avatarUrl: e.avatarUrl,
    xp: e.xp,
    isMe: e.isCurrentUser,
    isRival: e.isRival,
  }));

  return (
    <>
      {/* Pinned above everything on every dashboard page, lessons included */}
      <AnnouncementBar items={announcements} />
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
    </>
  );
}
