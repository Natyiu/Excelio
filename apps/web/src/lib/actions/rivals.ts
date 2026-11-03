"use server";

import prisma from "@Batman/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";

const rivalInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  avatarUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Avatar must be an http(s) link")
    .optional()
    .transform((v) => v || null),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  currentChapter: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => v || null),
  lessonsCompleted: z.coerce.number().int().min(0).max(10000),
  totalXp: z.coerce.number().int().min(0).max(10_000_000),
  weeklyXp: z.coerce.number().int().min(0).max(1_000_000),
  currentStreak: z.coerce.number().int().min(0).max(10000),
  active: z.boolean().default(true),
});

export type RivalInput = z.input<typeof rivalInput>;
export type RivalResult = { ok: true } | { ok: false; error: string };

const refresh = () => {
  revalidatePath("/admin/rivals");
  revalidatePath("/dashboard", "layout");
};

const parse = (data: RivalInput) => {
  const r = rivalInput.safeParse(data);
  return r.success ? { data: r.data } : { error: r.error.issues[0]?.message ?? "Invalid input" };
};

const dbError = (e: unknown): RivalResult => ({
  ok: false,
  error: /rival/i.test(String(e)) && /does not exist|relation/i.test(String(e))
    ? "The rivals table doesn't exist yet. Run `pnpm db:push` once."
    : e instanceof Error ? e.message : String(e),
});

/** Admin: every rival, newest first. */
export async function listRivals() {
  await requireAdmin();
  return prisma.rival.findMany({ orderBy: [{ totalXp: "desc" }, { createdAt: "desc" }] });
}

export async function createRival(input: RivalInput): Promise<RivalResult> {
  await requireAdmin();
  const p = parse(input);
  if ("error" in p) return { ok: false, error: p.error! };
  try {
    await prisma.rival.create({ data: p.data });
  } catch (e) {
    return dbError(e);
  }
  refresh();
  return { ok: true };
}

export async function updateRival(id: string, input: RivalInput): Promise<RivalResult> {
  await requireAdmin();
  const p = parse(input);
  if ("error" in p) return { ok: false, error: p.error! };
  try {
    await prisma.rival.update({ where: { id }, data: p.data });
  } catch (e) {
    return dbError(e);
  }
  refresh();
  return { ok: true };
}

export async function deleteRival(id: string): Promise<RivalResult> {
  await requireAdmin();
  try {
    await prisma.rival.delete({ where: { id } });
  } catch (e) {
    return dbError(e);
  }
  refresh();
  return { ok: true };
}

/** Admin: remove every rival at once (e.g. once enough real learners have joined). */
export async function deleteAllRivals(): Promise<RivalResult> {
  await requireAdmin();
  try {
    await prisma.rival.deleteMany({});
  } catch (e) {
    return dbError(e);
  }
  refresh();
  return { ok: true };
}
