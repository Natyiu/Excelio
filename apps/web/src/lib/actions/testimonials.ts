"use server";

import prisma from "@Batman/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireAuth } from "@/lib/auth-guards";

const submission = z.object({
  quote: z.string().trim().min(20, "Tell us a little more (at least 20 characters).").max(400, "Keep it under 400 characters."),
  displayName: z.string().trim().min(2, "Add the name to show.").max(40),
  location: z.string().trim().min(2, "Add your city and country.").max(60),
  consent: z.literal(true, { message: "Please agree to show your review publicly." }),
});

export type TestimonialInput = z.input<typeof submission>;

/** The signed-in learner's own testimonial, if they've written one. */
export async function getMyTestimonial() {
  const session = await requireAuth();
  return prisma.testimonial.findUnique({ where: { userId: session.user.id } });
}

/** Save the learner's testimonial. Editing it sends it back for approval. */
export async function submitTestimonial(input: TestimonialInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAuth();
  const parsed = submission.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const lessonsDone = await prisma.lessonProgress.count({
    where: { userId: session.user.id, status: { in: ["completed", "mastered"] } },
  });
  const data = { ...parsed.data, lessonsDone, approved: false };
  await prisma.testimonial.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });
  revalidatePath("/admin/testimonials");
  return { ok: true };
}

/** Approved testimonials for the landing page, newest first. */
export async function getApprovedTestimonials(limit = 6) {
  return prisma.testimonial.findMany({
    where: { approved: true, consent: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, quote: true, displayName: true, location: true, lessonsDone: true },
  });
}

/** Every testimonial, waiting ones first, for the admin page. */
export async function getAdminTestimonials() {
  await requireAdmin();
  return prisma.testimonial.findMany({ orderBy: [{ approved: "asc" }, { createdAt: "desc" }] });
}

export async function setTestimonialApproved(id: string, approved: boolean) {
  await requireAdmin();
  await prisma.testimonial.update({ where: { id }, data: { approved } });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}
