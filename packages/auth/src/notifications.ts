import prisma from "@Batman/db";

async function createNotification(data: {
  userId: string;
  title: string;
  description: string;
  tag: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        title: data.title,
        description: data.description,
        tag: data.tag,
        senderId: "system",
        recipients: { create: [{ userId: data.userId }] },
      },
    });
  } catch {
    // Never break the auth flow for a notification.
  }
}

export function notifyFirstAdmin(userId: string): Promise<void> {
  return createNotification({
    userId,
    title: "You're the admin",
    description:
      "As the first user, you have full admin access. You can manage users, settings, and everything from the admin dashboard.",
    tag: "general",
  });
}

export function notifyWelcome(userId: string): Promise<void> {
  return createNotification({
    userId,
    title: "Welcome",
    description: "You've created your account. Get started by exploring the dashboard.",
    tag: "general",
  });
}

export function notifyPasswordChanged(userId: string): Promise<void> {
  return createNotification({
    userId,
    title: "Password changed",
    description: "Your password was updated successfully.",
    tag: "security",
  });
}
