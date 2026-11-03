"use server";

import prisma from "@Batman/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { notifyEveryone } from "@/lib/notify";
import { ANNOUNCEMENT_TONES, type AnnouncementView } from "@/lib/announcement-tones";

const input = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(80),
    message: z.string().trim().min(1, "Message is required").max(600),
    tone: z.enum(ANNOUNCEMENT_TONES),
    ctaLabel: z.string().trim().max(30).optional().transform((v) => v || null),
    ctaUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || v.startsWith("/") || /^https:\/\//.test(v), "Button link must start with / or https://"),
    published: z.boolean(),
    /** ISO date-time or empty */
    endsAt: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(v) : null))
      .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid end date"),
  })
  .refine((d) => !d.ctaLabel === !d.ctaUrl, "Add both a button label and a link, or neither");

export type AnnouncementInput = z.input<typeof input>;
export type AnnouncementResult = { ok: true } | { ok: false; error: string };

const refresh = () => {
  revalidatePath("/admin/announcements");
  // The strip is rendered by the dashboard layout, so refresh every page under it.
  revalidatePath("/dashboard", "layout");
};

const fail = (e: unknown): AnnouncementResult => ({
  ok: false,
  error: /announcement/i.test(String(e)) && /does not exist|relation/i.test(String(e))
    ? "The announcements table doesn't exist yet. Run `pnpm db:push` once."
    : e instanceof Error ? e.message : String(e),
});

/**
 * Tell every learner when an announcement goes live (created published, or a draft published).
 * Edits to a live announcement don't notify again. A failed notification never blocks saving.
 */
async function notifyLive(senderId: string, a: { title: string; message: string; ctaUrl: string | null; ctaLabel: string | null }) {
  try {
    await notifyEveryone(senderId, {
      title: `📣 ${a.title}`,
      description: a.message,
      tag: "announcement",
      // In-app button links go straight there; otherwise point to the dashboard where the card is.
      linkUrl: a.ctaUrl?.startsWith("/") ? a.ctaUrl : "/dashboard",
      linkLabel: a.ctaUrl?.startsWith("/") && a.ctaLabel ? a.ctaLabel : "View announcement",
    });
  } catch (e) {
    console.error("[announcements] notification failed", e);
  }
}

const parse = (data: AnnouncementInput) => {
  const r = input.safeParse(data);
  return r.success ? { data: r.data } : { error: r.error.issues[0]?.message ?? "Invalid input" };
};

/** Admin: all announcements, newest first. */
export async function listAnnouncements() {
  await requireAdmin();
  return prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createAnnouncement(data: AnnouncementInput): Promise<AnnouncementResult> {
  const session = await requireAdmin();
  const p = parse(data);
  if ("error" in p) return { ok: false, error: p.error! };
  try {
    await prisma.announcement.create({ data: p.data });
  } catch (e) {
    return fail(e);
  }
  if (p.data.published) await notifyLive(session.user.id, p.data);
  refresh();
  return { ok: true };
}

export async function updateAnnouncement(id: string, data: AnnouncementInput): Promise<AnnouncementResult> {
  const session = await requireAdmin();
  const p = parse(data);
  if ("error" in p) return { ok: false, error: p.error! };
  let wasPublished = false;
  try {
    const before = await prisma.announcement.findUnique({ where: { id }, select: { published: true } });
    wasPublished = !!before?.published;
    await prisma.announcement.update({ where: { id }, data: p.data });
  } catch (e) {
    return fail(e);
  }
  if (p.data.published && !wasPublished) await notifyLive(session.user.id, p.data);
  refresh();
  return { ok: true };
}

export async function setAnnouncementPublished(id: string, published: boolean): Promise<AnnouncementResult> {
  const session = await requireAdmin();
  let goneLive: { title: string; message: string; ctaUrl: string | null; ctaLabel: string | null } | null = null;
  try {
    const before = await prisma.announcement.findUnique({ where: { id } });
    const a = await prisma.announcement.update({ where: { id }, data: { published } });
    if (published && before && !before.published) goneLive = a;
  } catch (e) {
    return fail(e);
  }
  if (goneLive) await notifyLive(session.user.id, goneLive);
  refresh();
  return { ok: true };
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementResult> {
  await requireAdmin();
  try {
    await prisma.announcement.delete({ where: { id } });
  } catch (e) {
    return fail(e);
  }
  refresh();
  return { ok: true };
}

/** Learners: published announcements that haven't ended, newest first (at most 3). */
export async function getActiveAnnouncements(): Promise<AnnouncementView[]> {
  const now = new Date();
  const rows = await prisma.announcement
    .findMany({
      where: { published: true, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      orderBy: { createdAt: "desc" },
      take: 3,
    })
    .catch(() => []); // table not created yet
  return rows.map((a) => ({
    id: a.id,
    version: a.updatedAt.getTime(),
    title: a.title,
    message: a.message,
    tone: (ANNOUNCEMENT_TONES as readonly string[]).includes(a.tone) ? (a.tone as AnnouncementView["tone"]) : "news",
    ctaLabel: a.ctaLabel,
    ctaUrl: a.ctaUrl,
    createdAt: a.createdAt.toISOString(),
  }));
}
