import type { MetadataRoute } from "next";
import prisma from "@Batman/db";
import { buildGuide, GUIDE_PATH } from "@/lib/excel-guide";
import { getChapterSettings } from "@/lib/pro-access";
import { SITE_URL } from "@/lib/site-url";

// Rebuild hourly so new blog posts show up without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, settings] = await Promise.all([
    prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    getChapterSettings(),
  ]);
  const guide = buildGuide(settings);
  // Only real change dates belong here, so these pages don't claim one.
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}${GUIDE_PATH}`, priority: 0.9 },
    ...guide.map((c) => ({ url: `${SITE_URL}${c.href}`, priority: 0.7 })),
    ...guide.flatMap((c) => c.lessons.flatMap((l) => (l.href ? [{ url: `${SITE_URL}${l.href}`, priority: 0.7 }] : []))),
    { url: `${SITE_URL}/start`, priority: 0.8 },
    { url: `${SITE_URL}/try`, priority: 0.8 },
    { url: `${SITE_URL}/pricing`, priority: 0.7 },
    // An empty blog isn't worth a crawler's visit.
    ...(posts.length ? [{ url: `${SITE_URL}/blog`, priority: 0.7 }] : []),
    { url: `${SITE_URL}/signup`, priority: 0.5 },
    { url: `${SITE_URL}/legal/privacy`, priority: 0.2 },
    { url: `${SITE_URL}/legal/terms`, priority: 0.2 },
  ];
  return [...pages, ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 }))];
}
