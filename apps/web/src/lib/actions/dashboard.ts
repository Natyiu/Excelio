"use server";

import prisma from "@Batman/db";
import geoip from "geoip-country";

import { requireAdmin } from "@/lib/auth-guards";

export async function getOverview() {
  await requireAdmin();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    usersLast7d,
    usersLast30d,
    onboardedUsers,
    dailyActiveUsers,
    weeklyActiveUsers,
    recentUsers,
    totalOrgs,
    totalMembers,
    totalNotifications,
    unreadRecipients,
    totalRecipients,
    recentNotifications,
    totalFeedback,
    openFeedback,
    recentFeedback,
    recentSignups,
    recentSessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { onboardingCompleted: true } }),
    prisma.session
      .groupBy({ by: ["userId"], where: { createdAt: { gte: oneDayAgo } } })
      .then((r) => r.length),
    prisma.session
      .groupBy({ by: ["userId"], where: { createdAt: { gte: sevenDaysAgo } } })
      .then((r) => r.length),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true, createdAt: true, role: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.organization.count(),
    prisma.member.count(),
    prisma.notification.count(),
    prisma.notificationRecipient.count({ where: { read: false } }),
    prisma.notificationRecipient.count(),
    prisma.notification.findMany({
      select: { id: true, title: true, tag: true, createdAt: true, _count: { select: { recipients: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.feedback.count(),
    prisma.feedback.count({ where: { status: "open" } }),
    prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      select: { createdAt: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.session.findMany({
      select: { createdAt: true, userId: true, ipAddress: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Resolve IPs to countries (top 5 for overview)
  const userIpMap = new Map<string, string | null>();
  for (const s of recentSessions) {
    if (!userIpMap.has(s.userId)) {
      userIpMap.set(s.userId, s.ipAddress ?? null);
    }
  }
  const countryCounts = new Map<string, { code: string; name: string; count: number }>();
  const UNKNOWN_KEY = "__unknown__";
  for (const ip of userIpMap.values()) {
    if (!ip) {
      const existing = countryCounts.get(UNKNOWN_KEY);
      if (existing) existing.count++;
      else countryCounts.set(UNKNOWN_KEY, { code: "XX", name: "Unknown", count: 1 });
      continue;
    }
    const result = geoip.lookup(ip);
    if (result) {
      const existing = countryCounts.get(result.country);
      if (existing) {
        existing.count++;
      } else {
        countryCounts.set(result.country, { code: result.country, name: result.name, count: 1 });
      }
    } else {
      // Localhost (127.0.0.1, ::1) or private IPs — geoip returns null
      const existing = countryCounts.get(UNKNOWN_KEY);
      if (existing) existing.count++;
      else countryCounts.set(UNKNOWN_KEY, { code: "XX", name: "Unknown", count: 1 });
    }
  }
  const countries = Array.from(countryCounts.values()).sort((a, b) => b.count - a.count);

  // 7-day sparkline data
  const sparkline: { signups: number; active: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const signups = recentSignups.filter(
      (u) => u.createdAt >= dayStart && u.createdAt < dayEnd
    ).length;
    const activeSet = new Set(
      recentSessions
        .filter((s) => s.createdAt >= dayStart && s.createdAt < dayEnd)
        .map((s) => s.userId)
    );
    sparkline.push({ signups, active: activeSet.size });
  }

  const onboardingRate =
    totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0;
  const notificationReadRate =
    totalRecipients > 0
      ? Math.round(((totalRecipients - unreadRecipients) / totalRecipients) * 100)
      : 0;

  const feedbackUserIds = [...new Set(recentFeedback.map((f) => f.userId))];
  const feedbackUsers = await prisma.user.findMany({
    where: { id: { in: feedbackUserIds } },
    select: { id: true, name: true, email: true, image: true },
  });
  const feedbackUserMap = new Map(feedbackUsers.map((u) => [u.id, u]));

  return {
    stats: {
      totalUsers,
      usersLast7d,
      usersLast30d,
      dailyActiveUsers,
      weeklyActiveUsers,
      onboardingRate,
      onboardedUsers,
      notificationReadRate,
      totalOrgs,
      totalMembers,
      totalNotifications,
      totalFeedback,
      openFeedback,
    },
    sparkline,
    recentUsers,
    recentNotifications: recentNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      tag: n.tag,
      createdAt: n.createdAt,
      recipientCount: n._count.recipients,
    })),
    recentFeedback: recentFeedback.map((f) => ({
      id: f.id,
      category: f.category,
      message: f.message,
      status: f.status,
      createdAt: f.createdAt,
      user: feedbackUserMap.get(f.userId) ?? null,
    })),
    countries,
  };
}

export async function getAnalytics() {
  await requireAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    onboardedUsers,
    usersLast7d,
    usersLast30d,
    recentSignups,
    recentSessions,
    dailyActiveUsers,
    weeklyActiveUsers,
    accounts,
    totalOrgs,
    totalMembers,
    unreadRecipients,
    totalRecipients,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboardingCompleted: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.findMany({
      select: { createdAt: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.session.findMany({
      select: { createdAt: true, userId: true, ipAddress: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.session.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: oneDayAgo } },
    }).then((r) => r.length),
    prisma.session.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: sevenDaysAgo } },
    }).then((r) => r.length),
    prisma.account.groupBy({ by: ["providerId"], _count: true }),
    prisma.organization.count(),
    prisma.member.count(),
    prisma.notificationRecipient.count({ where: { read: false } }),
    prisma.notificationRecipient.count(),
  ]);

  // Build daily chart: signups + unique active users per day
  const dayMap: Record<string, { signups: number; activeUsers: Set<string> }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = { signups: 0, activeUsers: new Set() };
  }
  for (const u of recentSignups) {
    const key = new Date(u.createdAt).toISOString().slice(0, 10);
    if (dayMap[key]) dayMap[key].signups++;
  }
  for (const s of recentSessions) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    if (dayMap[key]) dayMap[key].activeUsers.add(s.userId);
  }
  const baselineUsers = totalUsers - usersLast30d;
  let cumulative = baselineUsers;
  const dailyData = Object.entries(dayMap).map(([date, data]) => {
    cumulative += data.signups;
    return {
      date,
      label: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      signups: data.signups,
      activeUsers: data.activeUsers.size,
      totalUsers: cumulative,
    };
  });

  // Weekly signup buckets (last 4 weeks) for sparkline
  const weeklySignups: number[] = [];
  const entries = Object.values(dayMap);
  for (let w = 0; w < 4; w++) {
    const start = w * 7;
    const end = start + 7;
    const sum = entries.slice(start, end).reduce((s, d) => s + d.signups, 0);
    weeklySignups.push(sum);
  }
  // Last 2 days leftover
  const remainder = entries.slice(28).reduce((s, d) => s + d.signups, 0);
  if (remainder > 0) weeklySignups.push(remainder);

  // Weekly active user buckets for sparkline
  const weeklyActive: number[] = [];
  const sessionEntries = Object.values(dayMap);
  for (let w = 0; w < 4; w++) {
    const start = w * 7;
    const end = start + 7;
    const uniqueUsers = new Set<string>();
    sessionEntries.slice(start, end).forEach((d) => d.activeUsers.forEach((u) => uniqueUsers.add(u)));
    weeklyActive.push(uniqueUsers.size);
  }

  const authProviders = accounts.map((a) => ({
    provider:
      a.providerId === "credential"
        ? "Email/Password"
        : a.providerId.charAt(0).toUpperCase() + a.providerId.slice(1),
    count: a._count,
  }));

  // Resolve unique user IPs to countries
  const userIpMap = new Map<string, string | null>();
  for (const s of recentSessions) {
    if (!userIpMap.has(s.userId)) {
      userIpMap.set(s.userId, s.ipAddress ?? null);
    }
  }
  const countryCounts = new Map<string, { code: string; name: string; count: number }>();
  const UNKNOWN_KEY = "__unknown__";
  for (const ip of userIpMap.values()) {
    if (!ip) {
      const existing = countryCounts.get(UNKNOWN_KEY);
      if (existing) existing.count++;
      else countryCounts.set(UNKNOWN_KEY, { code: "XX", name: "Unknown", count: 1 });
      continue;
    }
    const result = geoip.lookup(ip);
    if (result) {
      const existing = countryCounts.get(result.country);
      if (existing) {
        existing.count++;
      } else {
        countryCounts.set(result.country, {
          code: result.country,
          name: result.name,
          count: 1,
        });
      }
    } else {
      // Localhost (127.0.0.1, ::1) or private IPs — geoip returns null
      const existing = countryCounts.get(UNKNOWN_KEY);
      if (existing) existing.count++;
      else countryCounts.set(UNKNOWN_KEY, { code: "XX", name: "Unknown", count: 1 });
    }
  }
  const countries = Array.from(countryCounts.values()).sort(
    (a, b) => b.count - a.count
  );

  const onboardingRate =
    totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0;
  const notificationReadRate =
    totalRecipients > 0
      ? Math.round(((totalRecipients - unreadRecipients) / totalRecipients) * 100)
      : 0;

  return {
    overview: {
      totalUsers,
      usersLast7d,
      usersLast30d,
      dailyActiveUsers,
      weeklyActiveUsers,
      onboardedUsers,
      onboardingRate,
      notificationReadRate,
    },
    dailyData,
    weeklySignups,
    weeklyActive,
    authProviders,
    countries,
    organizations: {
      totalOrgs,
      avgMembersPerOrg:
        totalOrgs > 0
          ? parseFloat((totalMembers / totalOrgs).toFixed(1))
          : 0,
    },
  };
}
