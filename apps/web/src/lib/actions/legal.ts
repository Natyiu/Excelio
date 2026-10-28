"use server";

import prisma from "@Batman/db";

/** Public: fetch legal page content (no auth required) */
export async function getLegalContent(slug: "privacy" | "terms") {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: { privacyContent: true, termsContent: true },
  });
  if (!settings) return null;
  const content = slug === "privacy" ? settings.privacyContent : settings.termsContent;
  return content || null;
}
