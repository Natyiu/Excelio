import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/learning/lesson-notes";
import { buildGuide, GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { getChapterSettings } from "@/lib/pro-access";
import { SITE_URL } from "@/lib/site-url";
import { Crumbs, GuideCta, GuideNotes, breadcrumbSchema } from "../../guide-parts";

export const revalidate = 3600;

type Props = { params: Promise<{ chapter: string; lesson: string }> };

async function findLesson(chapterSlug: string, lessonSlug: string) {
  const chapter = buildGuide(await getChapterSettings()).find((c) => c.slug === chapterSlug);
  const index = chapter?.lessons.findIndex((l) => l.slug === lessonSlug && l.href) ?? -1;
  if (!chapter || index < 0) return null;
  const withPages = chapter.lessons.filter((l) => l.href);
  const lesson = chapter.lessons[index]!;
  const at = withPages.indexOf(lesson);
  return { chapter, lesson, prev: withPages[at - 1], next: withPages[at + 1] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapter, lesson } = await params;
  const found = await findLesson(chapter, lesson);
  if (!found) return {};
  const title = `${found.lesson.data.title} in Excel | Excelio`;
  const description = found.lesson.data.description;
  return { title, description, alternates: { canonical: found.lesson.href! }, openGraph: { title, description, type: "article", url: found.lesson.href!, siteName: "Excelio" } };
}

export default async function GuideLessonPage({ params }: Props) {
  const { chapter: chapterSlug, lesson: lessonSlug } = await params;
  const found = await findLesson(chapterSlug, lessonSlug);
  if (!found) notFound();
  const { chapter, lesson, prev, next } = found;
  const { data } = lesson;
  const crumbs = [
    { name: "Excel guide", href: GUIDE_PATH },
    { name: chapter.course.title, href: chapter.href },
    { name: data.title, href: lesson.href! },
  ];
  const schema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: data.title,
    description: data.description,
    url: `${SITE_URL}${lesson.href}`,
    inLanguage: "en",
    educationalLevel: data.difficulty,
    timeRequired: `PT${data.estimatedMinutes}M`,
    isPartOf: { "@type": "CreativeWork", name: chapter.course.title, url: `${SITE_URL}${chapter.href}` },
    publisher: { "@type": "Organization", name: "Excelio", url: SITE_URL },
  };

  return (
    <article className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([breadcrumbSchema(crumbs), schema]) }} />
      <header>
        <Crumbs items={crumbs} />
        <h1 className="text-4xl font-extrabold tracking-tight">{data.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{data.description}</p>
      </header>

      <GuideNotes text={data.content.conceptOverview ?? ""} />

      {data.content.challenges.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Practise it</h2>
          <p className="mt-1 text-muted-foreground">The hands-on tasks in this lesson, checked live in the spreadsheet:</p>
          <ol className="mt-3 list-decimal space-y-1 pl-6 text-[17px]">
            {data.content.challenges.map((c) => <li key={c.id}><RichText text={c.instruction} /></li>)}
          </ol>
        </section>
      )}

      <GuideCta title="Now try it yourself" body={`This lesson takes about ${data.estimatedMinutes} minutes in a real spreadsheet, with instant feedback.`} />

      <nav aria-label="More lessons" className="flex flex-wrap justify-between gap-4 text-[15px] font-semibold">
        {prev ? <Link href={prev.href as never} className="text-brand hover:underline">← {prev.data.title}</Link> : <Link href={chapter.href as never} className="text-brand hover:underline">← {chapter.course.title}</Link>}
        {next && <Link href={next.href as never} className="text-brand hover:underline">{next.data.title} →</Link>}
      </nav>
    </article>
  );
}
