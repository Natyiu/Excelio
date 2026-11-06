import { buildGuide, GUIDE_PATH } from "@/lib/excel-guide";
import { getChapterSettings } from "@/lib/pro-access";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;

/** A plain-text map of the site for AI tools that read llms.txt. Optional: Google doesn't use it. */
export async function GET() {
  const guide = buildGuide(await getChapterSettings());
  const lessons = guide.reduce((n, c) => n + c.lessons.length, 0);
  const url = (path: string) => `${SITE_URL}${path}`;
  const body = [
    "# Excelio",
    "",
    `> Excelio teaches Microsoft Excel through ${lessons} short, interactive lessons in a real spreadsheet in the browser, from first formulas to XLOOKUP, dynamic arrays and LAMBDA. The first chapters are free.`,
    "",
    "## Start here",
    `- [Excelio home](${url("/")}): what Excelio is, how it works and common questions`,
    `- [Free Excel guide](${url(GUIDE_PATH)}): the course, chapter by chapter`,
    `- [Pricing](${url("/pricing")}): free and Pro plans`,
    `- [Try the first lesson](${url("/try")}): no account needed`,
    "",
    "## Chapters",
    ...guide.map((c) => `- [${c.course.title}](${url(c.href)}): ${c.course.description}`),
    "",
    "## Free lessons",
    ...guide.flatMap((c) => c.lessons.filter((l) => l.href).map((l) => `- [${l.data.title}](${url(l.href!)}): ${l.data.description}`)),
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
