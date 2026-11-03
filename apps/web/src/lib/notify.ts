import prisma from "@Batman/db";

/**
 * Creates a notification visible to all admin users.
 * Fire-and-forget — errors are swallowed so they never break the calling flow.
 */
export async function notifyAdmins(data: {
  title: string;
  description: string;
  tag: string;
  senderId?: string;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await prisma.notification.create({
      data: {
        title: data.title,
        description: data.description,
        tag: data.tag,
        senderId: data.senderId ?? "system",
        recipients: {
          create: admins.map((a) => ({ userId: a.id })),
        },
      },
    });
  } catch {
    // Swallow — notifications should never break core flows
  }
}

/**
 * Creates a notification for a specific user.
 */
export async function notifyUser(
  userId: string,
  data: {
    title: string;
    description: string;
    tag: string;
    senderId?: string;
  },
) {
  try {
    await prisma.notification.create({
      data: {
        title: data.title,
        description: data.description,
        tag: data.tag,
        senderId: data.senderId ?? "system",
        recipients: {
          create: [{ userId }],
        },
      },
    });
  } catch {
    // Swallow
  }
}

/**
 * Drops a notification into several learners' inboxes (the bell and /dashboard/notifications).
 * Callers must already have checked the sender is an admin. A link starting with "/" opens
 * inside the app; anything else is shown as a download/external link. Throws on failure, so
 * callers decide whether to swallow it.
 */
type Notice = { title: string; description: string; tag: string; linkUrl?: string | null; linkLabel?: string | null };

export async function notifyUsers(senderId: string, userIds: string[], n: Notice) {
  if (userIds.length === 0) return;
  await prisma.notification.create({
    data: {
      title: n.title.slice(0, 200),
      description: n.description,
      tag: n.tag,
      attachmentUrl: n.linkUrl ?? null,
      attachmentName: n.linkUrl ? (n.linkLabel ?? "Open") : null,
      senderId,
      recipients: { createMany: { data: userIds.map((userId) => ({ userId })), skipDuplicates: true } },
    },
  });
}

/** Every user with an account. */
export async function notifyEveryone(senderId: string, n: Notice) {
  const users = await prisma.user.findMany({ select: { id: true } });
  await notifyUsers(
    senderId,
    users.map((u) => u.id),
    n
  );
}
