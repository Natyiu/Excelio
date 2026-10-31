"use server";

import prisma from "@Batman/db";
import { revalidatePath } from "next/cache";
import { COURSES } from "@/data/lessons";
import { requireAdmin } from "@/lib/auth-guards";

const refresh = () => {
  revalidatePath("/admin/curriculum");
  revalidatePath("/dashboard");
  revalidatePath("/");
};

/** Set one chapter's access and/or visibility. */
export async function updateChapter(courseId: string, change: { access?: "free" | "pro"; hidden?: boolean }) {
  await requireAdmin();
  if (!COURSES.some((c) => c.id === courseId)) throw new Error("Unknown chapter");
  await prisma.chapterSetting.upsert({
    where: { courseId },
    create: { courseId, access: change.access ?? "pro", hidden: change.hidden ?? false },
    update: change,
  });
  refresh();
}

/** Make the first `count` chapters free and the rest Pro, keeping visibility as it is. */
export async function setFreeChapterCount(count: number) {
  await requireAdmin();
  const n = Math.max(0, Math.min(COURSES.length, Math.floor(count)));
  await prisma.$transaction(
    COURSES.map((c, i) =>
      prisma.chapterSetting.upsert({
        where: { courseId: c.id },
        create: { courseId: c.id, access: i < n ? "free" : "pro" },
        update: { access: i < n ? "free" : "pro" },
      })
    )
  );
  refresh();
}
