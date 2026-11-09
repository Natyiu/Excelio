import type { Metadata } from "next";
import Link from "next/link";
import { buildGuide, GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { getChapterSettings } from "@/lib/pro-access";
import { SITE_URL } from "@/lib/site-url";
import { Crumbs, GuideCta, breadcrumbSchema } from "../learn-excel/guide-parts";
import ExcelGuideLayout from "../learn-excel/layout";

export const revalidate = 3600;

const PATH = "/excel-data-analysis";
const TITLE = "Excel Data Analysis Tutorial: From Raw Data to Answers | Excelio";
const DESCRIPTION = "How to analyze data in Excel, step by step: structure and clean it, filter it, summarize it with SUMIFS and statistics, then combine tables with lookups and Power Query.";

const SAMPLE = [
  ["", "A: Region", "B: Rep", "C: Sales"],
  ["2", "North", "Ana", "1,200"],
  ["3", "South", "Ben", "800"],
  ["4", "North", "Cara", "950"],
  ["5", "East", "Dan", "1,500"],
  ["6", "South", "Eva", "700"],
  ["7", "North", "Finn", "1,100"],
];

const QUESTIONS = [
  { question: "What are total sales?", formula: "=SUM(C2:C7)", answer: "6,250" },
  { question: "What is a typical deal?", formula: "=MEDIAN(C2:C7)", answer: "1,025" },
  { question: "How much did North sell?", formula: '=SUMIFS(C2:C7,A2:A7,"North")', answer: "3,250" },
  { question: "How many deals were over 1,000?", formula: '=COUNTIFS(C2:C7,">1000")', answer: "3" },
  { question: "Who made the biggest sale?", formula: "=XLOOKUP(MAX(C2:C7),C2:C7,B2:B7)", answer: "Dan" },
];

const STAGES = [
  { title: "Structure the data", body: "Give every column one kind of value and every row one record. An Excel table then grows with your data, so formulas keep up.", chapters: ["excel-tables", "spreadsheet-design"] },
  { title: "Clean it", body: "Remove duplicates, fix inconsistent text and repeat the same clean-up automatically when new data arrives.", chapters: ["finding-duplicates", "power-query"] },
  { title: "Explore it", body: "Sort and filter to see what is in the data. FILTER, SORT and UNIQUE return a live result that updates itself.", chapters: ["sorting-and-filtering", "filter-with-logic"] },
  { title: "Summarize it", body: "Answer questions with conditional totals and counts, then describe the numbers with the mean, median, LARGE and RANK.", chapters: ["logical-functions", "statistical-functions"] },
  { title: "Combine sources", body: "Bring columns together from several tables with lookups, or relate whole tables and build PivotTables across them.", chapters: ["lookup-functions", "advanced-lookups", "power-pivot-and-the-data-model"] },
  { title: "Make the result readable", body: "Number formats and conditional formatting pull the eye to what changed and what needs attention.", chapters: ["custom-and-conditional-formatting"] },
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", url: PATH, siteName: "Excelio", images: ["/opengraph-image"] },
};

export default async function ExcelDataAnalysisPage() {
  const guide = buildGuide(await getChapterSettings());
  const crumbs = [{ name: "Excel guide", href: GUIDE_PATH }, { name: "Data analysis", href: PATH }];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to analyze data in Excel",
    description: DESCRIPTION,
    url: `${SITE_URL}${PATH}`,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: "Excelio", url: SITE_URL },
  };
  const [head, ...rows] = SAMPLE;

  return (
    <ExcelGuideLayout>
      <article className="space-y-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([breadcrumbSchema(crumbs), schema]) }} />
        <header>
          <Crumbs items={crumbs} />
          <h1 className="text-4xl font-extrabold tracking-tight">How to analyze data in Excel</h1>
          <p className="mt-3 text-lg text-muted-foreground">{DESCRIPTION}</p>
        </header>

        <section>
          <h2 className="text-2xl font-bold">Start with a question</h2>
          <p className="mt-2 text-[17px] leading-relaxed">
            Data analysis means turning rows of data into an answer someone can act on. Write the question first, because it tells you which formula you need. Here are five questions asked of one small sales table.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-border">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-muted/60">
                <tr>{head!.map((c) => <th key={c} className="px-3 py-2 font-semibold">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className="px-3 py-2">{c}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border-2 border-border">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-muted/60">
                <tr><th className="px-3 py-2 font-semibold">Question</th><th className="px-3 py-2 font-semibold">Formula</th><th className="px-3 py-2 font-semibold">Answer</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {QUESTIONS.map((q) => (
                  <tr key={q.formula}>
                    <td className="px-3 py-2">{q.question}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[14px]">{q.formula}</td>
                    <td className="px-3 py-2 font-semibold">{q.answer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[15px] text-muted-foreground">The median is used for a typical deal because one very large sale can pull the average up. XLOOKUP needs Excel 2021 or Microsoft 365.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">The six stages of analysis in Excel</h2>
          <ol className="mt-4 space-y-6">
            {STAGES.map((stage, i) => {
              const chapters = stage.chapters.flatMap((slug) => guide.filter((c) => c.slug === slug));
              return (
                <li key={stage.title}>
                  <h3 className="text-xl font-bold">{i + 1}. {stage.title}</h3>
                  <p className="mt-1 text-[17px] leading-relaxed">{stage.body}</p>
                  {chapters.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[15px] font-semibold">
                      {chapters.map((c) => <li key={c.slug}><Link href={c.href as never} className="text-brand hover:underline">{c.course.title}{c.pro ? " (Pro)" : ""}</Link></li>)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <GuideCta title="Practice on a real sheet" body="Type each formula yourself in a spreadsheet in your browser, with instant feedback." />
      </article>
    </ExcelGuideLayout>
  );
}
