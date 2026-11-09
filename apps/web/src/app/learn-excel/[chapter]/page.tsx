import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildGuide, chapterTitle, GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { getChapterSettings } from "@/lib/pro-access";
import { Crumbs, GuideCta, breadcrumbSchema } from "../guide-parts";

export const revalidate = 3600;

type Props = { params: Promise<{ chapter: string }> };

async function findChapter(slug: string) {
  return buildGuide(await getChapterSettings()).find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const chapter = await findChapter((await params).chapter);
  if (!chapter) return {};
  const title = chapterTitle(chapter.course.title);
  return { title, description: chapter.course.description, alternates: { canonical: chapter.href }, openGraph: { title, description: chapter.course.description, type: "article", url: chapter.href, siteName: "Excelio", images: ["/opengraph-image"] } };
}

export default async function GuideChapterPage({ params }: Props) {
  const chapter = await findChapter((await params).chapter);
  if (!chapter) notFound();
  const crumbs = [{ name: "Excel guide", href: GUIDE_PATH }, { name: chapter.course.title, href: chapter.href }];

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema(crumbs)) }} />
      <header>
        <Crumbs items={crumbs} />
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Chapter {chapter.number}</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">{chapter.course.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{chapter.course.description}</p>
      </header>

      <section>
        <h2 className="text-2xl font-bold">What this chapter covers</h2>
        <ol className="mt-4 divide-y divide-border rounded-2xl border-2 border-border">
          {chapter.lessons.map((l) => {
            const body = (
              <>
                <span className="font-semibold">{l.data.title}</span>
                <span className="block text-[15px] text-muted-foreground">{l.data.description}</span>
              </>
            );
            return (
              <li key={l.slug}>
                {l.href ? (
                  <Link href={l.href as never} className="block px-4 py-3 transition-colors hover:bg-muted/50">{body}</Link>
                ) : (
                  <div className="px-4 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <GuideCta
        title={chapter.pro ? "This chapter is part of Excelio Pro" : "Practise this chapter for free"}
        body={chapter.pro ? "Start with the free chapters. Pro unlocks these lessons and their hands-on practice." : "Type every formula yourself in a real spreadsheet, with instant feedback."}
      />
    </div>
  );
}
