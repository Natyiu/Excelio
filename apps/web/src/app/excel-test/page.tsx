import type { Metadata } from "next";
import Link from "next/link";
import { FUNCTION_ARTICLES, ARTICLES_PATH } from "@/data/function-articles";
import { GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { cellId } from "@/lib/formula-engine";
import { SITE_URL } from "@/lib/site-url";
import { Crumbs, breadcrumbSchema } from "../learn-excel/guide-parts";
import ExcelGuideLayout from "../learn-excel/layout";
import { TestRunner, type TestTask } from "./test-runner";

const PATH = "/excel-test";

/** Easiest first. Only released articles are used, so every "Learn" link works. */
const PLAN: [slug: string, level: TestTask["level"]][] = [
  ["sum", "Basic"],
  ["countif", "Basic"],
  ["sumif", "Basic"],
  ["if", "Basic"],
  ["left", "Basic"],
  ["trim", "Intermediate"],
  ["vlookup", "Intermediate"],
  ["sumifs", "Intermediate"],
  ["countifs", "Intermediate"],
  ["iferror", "Intermediate"],
  ["xlookup", "Advanced"],
  ["filter", "Advanced"],
];

const TASKS: TestTask[] = PLAN.flatMap(([slug, level]) => {
  const a = FUNCTION_ARTICLES.find((x) => x.slug === slug);
  if (!a) return [];
  return [{
    slug: a.slug,
    name: a.name,
    level,
    task: a.exercise.task,
    data: a.data,
    target: cellId(a.data[0]!.length + 1, 1),
    expected: a.exercise.expected,
    requires: a.exercise.requires,
    hint: a.exercise.hint,
    solution: a.exercise.solution,
    href: `${ARTICLES_PATH}/${a.slug}`,
  }];
});

const TITLE = "Free Excel Test: Check Your Formula Skills in a Live Sheet | Excelio";
const DESCRIPTION = `A free Excel skills test with ${TASKS.length} real tasks you solve in a live spreadsheet, from SUM to XLOOKUP and FILTER. Instant score, no sign-up. Good practice before a job assessment or interview.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: PATH, siteName: "Excelio", images: ["/opengraph-image"] },
};

export default function ExcelTestPage() {
  const crumbs = [{ name: "Excel guide", href: GUIDE_PATH }, { name: "Excel test", href: PATH }];
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Free Excel skills test",
    description: DESCRIPTION,
    url: `${SITE_URL}${PATH}`,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: "Excelio", url: SITE_URL },
  };

  return (
    <ExcelGuideLayout>
      <article className="space-y-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([breadcrumbSchema(crumbs), schema]) }} />
        <header>
          <Crumbs items={crumbs} />
          <h1 className="text-4xl font-extrabold tracking-tight">Free Excel test</h1>
          <p className="mt-3 text-lg text-muted-foreground">{DESCRIPTION}</p>
        </header>

        <section>
          <h2 className="text-2xl font-bold">How it works</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[17px] leading-relaxed">
            <li>Each task is a small spreadsheet. Type a formula in the highlighted cell and check it.</li>
            <li>A task counts as soon as your formula gives the right result with the right function.</li>
            <li>Hints and answers are there if you want to learn, but your score only means something if you try first.</li>
            <li>Tasks start easy and get harder. XLOOKUP and FILTER need Excel 2021 or Microsoft 365 in real Excel.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">The test</h2>
          <div className="mt-4"><TestRunner tasks={TASKS} /></div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Preparing for an Excel assessment for a job?</h2>
          <p className="mt-2 text-[17px] leading-relaxed">
            Employers often screen candidates with an Excel test, either their own or one on a job platform. They usually ask about formulas like SUM, AVERAGE, IF and COUNTIF, lookups like VLOOKUP or XLOOKUP, sorting and filtering, and often formatting, charts and PivotTables.
          </p>
          <p className="mt-2 text-[17px] leading-relaxed">
            This test covers the formula part only. It does not test formatting, charts or PivotTables, and it isn&apos;t affiliated with any employer or test provider. To fill the gaps, work through the{" "}
            <Link href={GUIDE_PATH as never} className="font-semibold text-brand hover:underline">free Excel guide</Link>, practice with{" "}
            <Link href={"/excel-practice" as never} className="font-semibold text-brand hover:underline">more Excel exercises</Link> and learn the{" "}
            <Link href={"/excel-shortcuts" as never} className="font-semibold text-brand hover:underline">keyboard shortcuts</Link>, since timed tests reward speed.
          </p>
        </section>
      </article>
    </ExcelGuideLayout>
  );
}
