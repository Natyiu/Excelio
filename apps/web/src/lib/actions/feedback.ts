"use server";

import prisma from "@Batman/db";

import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { FEEDBACK_CATEGORIES, FEEDBACK_MAX_LENGTH } from "@/lib/feedback-categories";
import { notifyUsers } from "@/lib/notify";

export async function submitFeedback(data: {
  category: string;
  message: string;
}) {
  const session = await requireAuth();

  if (!data.message.trim()) throw new Error("Message is required");
  if (data.message.length > FEEDBACK_MAX_LENGTH) throw new Error("Message is too long");
  if (!FEEDBACK_CATEGORIES.some((c) => c.value === data.category)) {
    throw new Error("Invalid category");
  }

  return prisma.feedback.create({
    data: {
      userId: session.user.id,
      category: data.category,
      message: data.message.trim(),
    },
  });
}

export async function getUserFeedback() {
  const session = await requireAuth();

  return prisma.feedback.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getAdminFeedback(params?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  /** "no": still waiting for a reply (and not closed), "yes": already replied to */
  replied?: "yes" | "no";
}) {
  await requireAdmin();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params?.category && params.category !== "all") {
    where.category = params.category;
  }
  if (params?.status && params.status !== "all") {
    where.status = params.status;
  }
  if (params?.replied === "no") {
    where.AND = [{ OR: [{ adminNote: null }, { adminNote: "" }] }, { status: { not: "closed" } }];
  } else if (params?.replied === "yes") {
    where.AND = [{ adminNote: { not: null } }, { NOT: { adminNote: "" } }];
  }

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.feedback.count({ where }),
  ]);

  const userIds = [...new Set(items.map((i) => i.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, image: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    feedback: items.map((item) => ({
      ...item,
      user: userMap.get(item.userId) ?? null,
    })),
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function updateFeedbackStatus(
  id: string,
  status: string,
  adminNote?: string
) {
  const session = await requireAdmin();

  const validStatuses = ["open", "reviewed", "planned", "resolved", "closed"];
  if (!validStatuses.includes(status)) throw new Error("Invalid status");

  const before = await prisma.feedback.findUnique({ where: { id }, select: { adminNote: true } });
  const updated = await prisma.feedback.update({
    where: { id },
    data: {
      status,
      ...(adminNote !== undefined && { adminNote }),
    },
  });

  // A new or changed reply: let the learner know in their notifications.
  const reply = adminNote?.trim();
  if (reply && reply !== (before?.adminNote ?? "").trim()) {
    await notifyUsers(session.user.id, [updated.userId], {
      title: "💬 We replied to your feedback",
      description: reply.length > 280 ? `${reply.slice(0, 277)}…` : reply,
      tag: "feedback",
      linkUrl: "/dashboard/feedback",
      linkLabel: "See the reply",
    }).catch((e) => console.error("[feedback] reply notification failed", e));
  }

  return updated;
}

export async function getAdminFeedbackStats() {
  await requireAdmin();

  const [total, open, reviewed, planned, resolved, needsReply, replied] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.count({ where: { status: "open" } }),
    prisma.feedback.count({ where: { status: "reviewed" } }),
    prisma.feedback.count({ where: { status: "planned" } }),
    prisma.feedback.count({ where: { status: "resolved" } }),
    prisma.feedback.count({
      where: { AND: [{ OR: [{ adminNote: null }, { adminNote: "" }] }, { status: { not: "closed" } }] },
    }),
    prisma.feedback.count({ where: { AND: [{ adminNote: { not: null } }, { NOT: { adminNote: "" } }] } }),
  ]);

  return { total, open, reviewed, planned, resolved, needsReply, replied };
}
