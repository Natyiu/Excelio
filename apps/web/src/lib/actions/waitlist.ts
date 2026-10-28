"use server";

import prisma from "@Batman/db";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guards";
import type { JoinWaitlistResult } from "@/types/waitlist";

const joinSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
});

/** Public: join waitlist (no auth) */
export async function joinWaitlist(
  data: { email: string; name?: string; company?: string }
): Promise<JoinWaitlistResult> {
  const parsed = joinSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid email address" };
  }

  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: { waitlistMode: true, waitlistShowName: true, waitlistShowCompany: true },
  });

  if (!settings?.waitlistMode) {
    return { success: false, error: "Waitlist is not open" };
  }

  const payload = {
    email: parsed.data.email.toLowerCase(),
    name: settings.waitlistShowName ? parsed.data.name ?? null : null,
    company: settings.waitlistShowCompany ? parsed.data.company ?? null : null,
  };

  try {
    await prisma.waitlistEntry.upsert({
      where: { email: payload.email },
      update: payload,
      create: payload,
    });
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Admin: list recent waitlist signups */
export async function getWaitlistEntries(limit = 50) {
  await requireAdmin();

  return prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
