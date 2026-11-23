import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight01Icon as ArrowRight,
  Book02Icon as Book,
  Clock01Icon as Clock,
  CrownIcon as Crown,
  FlashIcon as Zap,
  StarIcon as Star,
} from "@hugeicons/react";
import { pressable } from "@/components/game-ui";
import { chapterColour, SheetArt } from "@/components/learning-path";
import { LEVELS } from "@/components/level-picker";
import { buildGuide, chapterTitle, GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { getChapterSettings } from "@/lib/pro-access";
import { Crumbs, GuideCta, START_HREF, breadcrumbSchema } from "../guide-parts";

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

  const minutes = chapter.lessons.reduce((n, l) => n + l.data.estimatedMinutes, 0);
  const level = LEVELS.find((l) => l.id === chapter.course.difficulty);
  const guide = buildGuide(await getChapterSettings());
  const next = guide.find((c) => c.number === chapter.number + 1);

  return (
    <div className="space-y-10" style={chapterColour(chapter.number - 1)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema(crumbs)) }} />
      <Crumbs items={crumbs} />

      {/* Banner in the chapter's colour, the same look as the chapter path in the app */}
      <header data-guide-cta className="relative -mt-2 overflow-hidden rounded-3xl bg-brand px-6 pb-8 pt-10 text-white shadow-[0_6px_0_var(--brand-deep)] sm:px-8">
        <SheetArt formula={chapter.course.formula ?? "=SUM(B2:B4)"} />
        <div className="relative max-w-[62%] max-sm:max-w-none">
          <p className="flex flex-wrap items-center gap-2 text-[13px] font-extrabold uppercase tracking-wider text-white/85">
            Chapter {chapter.number}
            {level && <span className="rounded-full bg-white/20 px-2 py-px text-[11px]">{level.label}</span>}
            {chapter.pro && <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-px text-[11px] text-amber-950"><Crown className="h-3 w-3" /> Pro</span>}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{chapter.course.title}</h1>
          <p className="mt-3 text-lg text-white/85">{chapter.course.description}</p>
          <p className="mt-4 flex flex-wrap gap-2 text-[13px] font-bold">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1"><Book className="h-4 w-4" /> {chapter.lessons.length} lessons</span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1"><Clock className="h-4 w-4" /> {minutes} min</span>
          </p>
          <Link
            href={START_HREF as never}
            className="group relative mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[17px] font-extrabold text-brand shadow-[0_5px_0_rgb(0_0_0/0.2)] transition-[transform,box-shadow] duration-100 hover:-translate-y-0.5 active:translate-y-[4px] active:shadow-none"
          >
            <span aria-hidden className="cta-glow absolute inset-0 rounded-full text-white" />
            <span className="relative">{chapter.pro ? "Start with the free chapters" : "Practise this chapter free"}</span>
            <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-bold">What this chapter covers</h2>
        <ol className="relative mt-5 space-y-4">
          {/* the path joining the lesson coins */}
          <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-1 rounded-full bg-brand/20" />
          {chapter.lessons.map((l, i) => (
            <li key={l.slug} className="relative flex items-center gap-4">
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-white shadow-[0_5px_0_var(--brand-deep)]">
                <span className="absolute inset-x-3 top-1.5 h-2 rounded-full bg-white/25" />
                {i === 0 ? <Star className="h-7 w-7" /> : i + 1}
              </span>
              <div className="group flex min-w-0 flex-1 flex-wrap items-center gap-3 rounded-2xl border-2 border-b-[5px] border-border bg-card px-4 py-3 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-brand">
                <div className="min-w-0 flex-1">
                  {l.href ? (
                    <Link href={l.href as never} className="font-bold after:absolute after:inset-0 hover:text-brand">{l.data.title}</Link>
                  ) : (
                    <span className="font-bold">{l.data.title}</span>
                  )}
                  <span className="block text-[14px] text-muted-foreground">{l.data.description}</span>
                  <span className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {l.data.estimatedMinutes} min
                  </span>
                </div>
                <Link href={START_HREF as never} className={pressable("brand", "relative z-10 shrink-0 px-4 py-2 text-sm")}>
                  <Zap className="h-4 w-4" /> Try it
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <GuideCta
        title={chapter.pro ? "This chapter is part of Excelio Pro" : "Practise this chapter for free"}
        body={chapter.pro ? "Start with the free chapters. Pro unlocks these lessons and their hands-on practice." : "Type every formula yourself in a real spreadsheet, with instant feedback."}
      />

      {next && (
        <Link
          href={next.href as never}
          style={chapterColour(next.number - 1)}
          className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-b-[5px] border-border bg-card px-5 py-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="min-w-0">
            <span className="block text-[12px] font-bold uppercase tracking-wide text-brand">Up next · Chapter {next.number}</span>
            <span className="block font-bold">{next.course.title}</span>
          </span>
          <ArrowRight className="h-6 w-6 shrink-0 text-brand transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
