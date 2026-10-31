"use server";

import prisma from "@Batman/db";

import { requireAdmin, requireAuth } from "@/lib/auth-guards";

export type { NotificationTag } from "@/types/notifications";

export async function sendNotification(data: {
  title: string;
  description: string;
  tag: string;
  attachmentUrl?: string;
  attachmentName?: string;
  recipientIds: string[];
}) {
  const session = await requireAdmin();

  const notification = await prisma.notification.create({
    data: {
      title: data.title,
      description: data.description,
      tag: data.tag,
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      senderId: session.user.id,
      recipients: {
        create: data.recipientIds.map((userId) => ({ userId })),
      },
    },
    include: { recipients: true },
  });

  return notification;
}

export async function sendNotificationToAll(data: {
  title: string;
  description: string;
  tag: string;
  attachmentUrl?: string;
  attachmentName?: string;
}) {
  const session = await requireAdmin();

  const allUsers = await prisma.user.findMany({
    select: { id: true },
  });

  const notification = await prisma.notification.create({
    data: {
      title: data.title,
      description: data.description,
      tag: data.tag,
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      senderId: session.user.id,
      recipients: {
        create: allUsers.map((u) => ({ userId: u.id })),
      },
    },
    include: { recipients: true },
  });

  return notification;
}

export async function getUserNotifications(params?: {
  tag?: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const session = await requireAuth();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (params?.unreadOnly) {
    where.read = false;
  }

  const notificationWhere: Record<string, unknown> = {};
  if (params?.tag && params.tag !== "all") {
    notificationWhere.tag = params.tag;
  }

  if (Object.keys(notificationWhere).length > 0) {
    where.notification = notificationWhere;
  }

  const [recipients, total] = await Promise.all([
    prisma.notificationRecipient.findMany({
      where,
      include: {
        notification: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notificationRecipient.count({ where }),
  ]);

  return {
    notifications: recipients.map((r) => ({
      id: r.id,
      notificationId: r.notificationId,
      title: r.notification.title,
      description: r.notification.description,
      tag: r.notification.tag,
      attachmentUrl: r.notification.attachmentUrl,
      attachmentName: r.notification.attachmentName,
      read: r.read,
      readAt: r.readAt,
      createdAt: r.notification.createdAt,
    })),
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function markNotificationRead(recipientId: string) {
  const session = await requireAuth();

  await prisma.notificationRecipient.updateMany({
    where: {
      id: recipientId,
      userId: session.user.id,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/** Mark notifications as read because the learner has seen them on screen. */
export async function markNotificationsSeen(recipientIds: string[]) {
  const session = await requireAuth();
  if (!recipientIds.length) return;

  await prisma.notificationRecipient.updateMany({
    where: { id: { in: recipientIds }, userId: session.user.id, read: false },
    data: { read: true, readAt: new Date() },
  });
}

export async function markAllNotificationsRead() {
  const session = await requireAuth();

  await prisma.notificationRecipient.updateMany({
    where: {
      userId: session.user.id,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function getUnreadCount() {
  const session = await requireAuth();

  return prisma.notificationRecipient.count({
    where: {
      userId: session.user.id,
      read: false,
    },
  });
}

export async function getAdminNotificationHistory(params?: {
  page?: number;
  limit?: number;
}) {
  await requireAdmin();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;

  const adminIds = await prisma.user
    .findMany({ where: { role: "admin" }, select: { id: true } })
    .then((users) => users.map((u) => u.id));

  const where = { senderId: { in: adminIds } };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        recipients: { select: { id: true, read: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      ...n,
      recipientCount: n.recipients.length,
      readCount: n.recipients.filter((r) => r.read).length,
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getAllUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function searchUsers(query: string, limit = 20) {
  await requireAdmin();

  if (!query.trim()) {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: limit,
  });
}
