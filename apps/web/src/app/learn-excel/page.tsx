import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight01Icon as ArrowRight,
  Book02Icon as Book,
  Clock01Icon as Clock,
  CrownIcon as Crown,
  CursorPointer01Icon as Pointer,
  FlashIcon as Zap,
} from "@hugeicons/react";
import { pressable } from "@/components/game-ui";
import { SheetDemo } from "@/components/learning/sheet-demo";
import { chapterColour } from "@/components/learning-path";
import { LEVELS, levelStyle } from "@/components/level-picker";
import { MascotSays } from "@/components/mascot";
import { buildGuide, GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { getChapterSettings } from "@/lib/pro-access";
import { SITE_URL } from "@/lib/site-url";
import { GridBackdrop, GuideCta, InlineCta, START_HREF } from "./guide-parts";

// The demo under the hero: a receipt that gets totalled, as on the home page.
const DEMO = [
  "| Item | Qty | Price | Total |",
  "| Coffee | 3 | 4 | |",
  "| Bagel | 2 | 3 | |",
  "| Juice | 4 | 5 | |",
  "cell C3: Every cell has an address, like C3",
  "type D2 =B2*C2: A formula starts with = and does the maths",
  "fill D2 D4: Copy it down and the references follow",
  "type D5 =SUM(D2:D4): SUM adds up a whole range",
];

export const revalidate = 3600;

const TITLE = "Excel Tutorial: Learn Formulas, Functions and Data Analysis | Excelio";
const DESCRIPTION = "A chapter-by-chapter Excel guide, from your first cell to XLOOKUP, dynamic arrays and LAMBDA, with clear explanations and worked formula examples.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: GUIDE_PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: GUIDE_PATH, siteName: "Excelio", images: ["/opengraph-image"] },
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

  const lessons = guide.flatMap((c) => c.lessons);
  const hours = Math.round(lessons.reduce((n, l) => n + l.data.estimatedMinutes, 0) / 60);
  const stats = [
    { icon: Book, value: guide.length, label: "chapters" },
    { icon: Zap, value: lessons.length, label: "hands-on lessons" },
    { icon: Clock, value: `${hours}h`, label: "of practice" },
  ];

  return (
    <div className="space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      {/* Hero: Gridley, the promise, and the button */}
      <header className="relative -mx-4 overflow-hidden rounded-none bg-brand-soft/60 px-6 py-10 sm:mx-0 sm:rounded-3xl sm:px-10">
        <GridBackdrop />
        <div className="relative">
          <MascotSays mood="wave" size={84} className="mb-6">
            Hi, I&apos;m Gridley! Read any chapter here, or learn it for real in a live spreadsheet.
          </MascotSays>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Excel tutorial: learn Excel <span className="text-brand">step by step</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{DESCRIPTION}</p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {stats.map(({ icon: Icon, value, label }) => (
              <span key={label} className="flex items-center gap-2 rounded-xl border-2 border-b-4 border-border bg-card px-3 py-1.5 text-sm font-bold">
                <Icon className="h-4 w-4 text-brand" />
                {value} <span className="font-semibold text-muted-foreground">{label}</span>
              </span>
            ))}
          </div>

          <div data-guide-cta className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={START_HREF as never} className={pressable("brand", "group relative px-8 py-4 text-lg font-extrabold")}>
              <span aria-hidden className="cta-glow absolute inset-0 rounded-full text-brand" />
              <span className="relative">Start your first lesson free</span>
              <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#chapters" className="text-[15px] font-semibold text-muted-foreground hover:text-foreground">
              or browse the chapters ↓
            </a>
          </div>
        </div>
      </header>

      {/* What a lesson feels like: the same animated sheet as the home page */}
      <section>
        <div className="rounded-3xl border-2 border-b-[6px] border-border bg-card p-3 md:p-4">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-2 truncate text-[13px] font-semibold text-muted-foreground">This is what a lesson looks like</span>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-foreground">
              <Pointer className="h-3 w-3" /> Live
            </span>
          </div>
          <div className="overflow-x-auto">
            <SheetDemo lines={DEMO} />
          </div>
        </div>
        <div className="mt-4">
          <InlineCta text="Now it's your turn: type the formula yourself and get instant feedback." label="Try it now" />
        </div>
      </section>

      <p className="text-[17px]">
        Working with real data? Start with <Link href={"/excel-data-analysis" as never} className="font-semibold text-brand hover:underline">how to analyze data in Excel</Link>.
      </p>

      <div id="chapters" className="scroll-mt-24 space-y-10">
        {LEVELS.map((level, li) => {
          const chapters = guide.filter((c) => c.course.difficulty === level.id);
          if (!chapters.length) return null;
          return (
            <section key={level.id} className="space-y-4">
              <div style={levelStyle(level.id)} className="flex items-center gap-3">
                <span className="h-[3px] flex-1 rounded-full bg-brand/25" />
                <h2 className="flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-[13px] font-extrabold uppercase tracking-wider text-white shadow-[0_3px_0_var(--brand-deep)]">
                  {level.label}
                  <span className="rounded-full bg-white/25 px-2 py-px text-[11px] font-bold normal-case tracking-normal">
                    {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"}
                  </span>
                </h2>
                <span className="h-[3px] flex-1 rounded-full bg-brand/25" />
              </div>
              <p className="text-center text-muted-foreground">{level.blurb}</p>

              <ul className="grid gap-4 sm:grid-cols-2">
                {chapters.map((c) => (
                  <li key={c.slug} style={chapterColour(c.number - 1)}>
                    <Link
                      href={c.href as never}
                      className="group flex h-full flex-col rounded-2xl border-2 border-b-[5px] border-border bg-card p-4 transition-[transform,border-color] duration-150 hover:-translate-y-1 hover:border-brand active:translate-y-0.5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white shadow-[0_4px_0_var(--brand-deep)] transition-transform group-hover:-rotate-6 group-hover:scale-110">
                          <span className="absolute inset-x-2.5 top-1 h-1.5 rounded-full bg-white/25" />
                          {c.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[12px] font-bold uppercase tracking-wide text-brand">Chapter {c.number}</span>
                          <span className="block font-bold leading-snug">{c.course.title}</span>
                        </div>
                        {c.pro && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                            <Crown className="h-3 w-3" /> Pro
                          </span>
                        )}
                      </div>
                      <span className="mt-2 block flex-1 text-[14px] text-muted-foreground">{c.course.description}</span>
                      <span className="mt-3 flex items-center justify-between text-[13px] font-semibold text-muted-foreground">
                        <span>{c.lessons.length} lessons · {c.lessons.reduce((n, l) => n + l.data.estimatedMinutes, 0)} min</span>
                        <span className="flex items-center gap-1 text-brand opacity-0 transition-opacity group-hover:opacity-100">
                          Open <ArrowRight className="h-4 w-4" />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {li === 0 && <InlineCta text="Skip the reading: the Beginner lessons are interactive and free to start." label="Start free" />}
            </section>
          );
        })}
      </div>

      <GuideCta title="Reading is the easy part" body="Try every formula yourself in a real spreadsheet, with instant feedback." />
    </div>
  );
}
