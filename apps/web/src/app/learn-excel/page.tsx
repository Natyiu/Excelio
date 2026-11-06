import type { Metadata } from "next";
import Link from "next/link";
import { LEVELS } from "@/components/level-picker";
import { buildGuide, GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { getChapterSettings } from "@/lib/pro-access";
import { SITE_URL } from "@/lib/site-url";
import { GuideCta } from "./guide-parts";

export const revalidate = 3600;

const TITLE = "Learn Excel: Free Guide to Formulas and Functions | Excelio";
const DESCRIPTION = "A chapter-by-chapter Excel guide, from your first cell to XLOOKUP, dynamic arrays and LAMBDA, with clear explanations and worked formula examples.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: GUIDE_PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: GUIDE_PATH, siteName: "Excelio" },
};

export default async function ExcelGuidePage() {
  const guide = buildGuide(await getChapterSettings());
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Excel guide",
    description: DESCRIPTION,
    url: `${SITE_URL}${GUIDE_PATH}`,
    publisher: { "@type": "Organization", name: "Excelio", url: SITE_URL },
    hasPart: guide.map((c) => ({ "@type": "CreativeWork", name: c.course.title, url: `${SITE_URL}${c.href}` })),
  };

  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight">Learn Excel: the free guide</h1>
        <p className="mt-3 text-lg text-muted-foreground">{DESCRIPTION}</p>
      </header>

      {LEVELS.map((level) => {
        const chapters = guide.filter((c) => c.course.difficulty === level.id);
        if (!chapters.length) return null;
        return (
          <section key={level.id}>
            <h2 className="text-2xl font-bold">{level.label}</h2>
            <p className="mt-1 text-muted-foreground">{level.blurb}</p>
            <ul className="mt-4 divide-y divide-border rounded-2xl border-2 border-border">
              {chapters.map((c) => (
                <li key={c.slug}>
                  <Link href={c.href as never} className="block px-4 py-3 transition-colors hover:bg-muted/50">
                    <span className="font-semibold">Chapter {c.number}: {c.course.title}</span>
                    <span className="block text-[15px] text-muted-foreground">{c.course.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <GuideCta title="Reading is the easy part" body="Try every formula yourself in a real spreadsheet, with instant feedback." />
    </div>
  );
}
