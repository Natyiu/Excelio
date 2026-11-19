import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/game-ui";
import { PracticeSheet } from "@/components/functions/practice-sheet";
import { FUNCTION_ARTICLES, ARTICLES_PATH } from "@/data/function-articles";
import { GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { cellId } from "@/lib/formula-engine";
import { SITE_URL } from "@/lib/site-url";
import { Crumbs, GuideCta, breadcrumbSchema } from "../learn-excel/guide-parts";
import ExcelGuideLayout from "../learn-excel/layout";

const PATH = "/excel-practice";
const COUNT = FUNCTION_ARTICLES.length;
const TITLE = `Excel Practice Exercises: ${COUNT} Free Problems With Answers | Excelio`;
const DESCRIPTION = `Free Excel practice exercises you solve in a live spreadsheet on the page. ${COUNT} problems on SUMIFS, XLOOKUP, IF, FILTER and more, each checked instantly with a hint and the answer.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: PATH, siteName: "Excelio", images: ["/opengraph-image"] },
};

export default function ExcelPracticePage() {
  const crumbs = [{ name: "Excel guide", href: GUIDE_PATH }, { name: "Practice", href: PATH }];
  const categories = [...new Set(FUNCTION_ARTICLES.map((a) => a.category))];
  const featured = FUNCTION_ARTICLES[0]!;
  const target = cellId(featured.data[0]!.length + 1, 1);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Excel practice exercises",
    description: DESCRIPTION,
    url: `${SITE_URL}${PATH}`,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: "Excelio", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: FUNCTION_ARTICLES.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: `${a.name} practice`, url: `${SITE_URL}${ARTICLES_PATH}/${a.slug}#practice` })),
    },
  };

  return (
    <ExcelGuideLayout>
      <article className="space-y-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([breadcrumbSchema(crumbs), schema]) }} />
        <header>
          <Crumbs items={crumbs} />
          <h1 className="text-4xl font-extrabold tracking-tight">Excel practice exercises</h1>
          <p className="mt-3 text-lg text-muted-foreground">{DESCRIPTION}</p>
          <p className="mt-3 text-[17px] leading-relaxed">
            You don&apos;t need Excel installed or an account. Type the formula, press Enter and see if it&apos;s right. Want a score?{" "}
            <Link href={"/excel-test" as never} className="font-semibold text-brand hover:underline">Take the free Excel test</Link>.
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-bold">Try one now: {featured.name}</h2>
          <Panel className="mt-3 border-brand p-4">
            <p className="mb-4 text-[17px] font-semibold">{featured.exercise.task} Type your formula in <code className="font-mono text-brand">{target}</code>.</p>
            <PracticeSheet data={featured.data} target={target} expected={featured.exercise.expected} requires={featured.exercise.requires} hint={featured.exercise.hint} solution={featured.exercise.solution} />
          </Panel>
          <p className="mt-2 text-[15px] text-muted-foreground">
            New to {featured.name}? <Link href={`${ARTICLES_PATH}/${featured.slug}` as never} className="font-semibold text-brand hover:underline">Read the {featured.name} guide</Link> first.
          </p>
        </section>

        {categories.map((category) => (
          <section key={category}>
            <h2 className="text-2xl font-bold">{category} exercises</h2>
            <ul className="mt-3 divide-y divide-border rounded-2xl border-2 border-border">
              {FUNCTION_ARTICLES.filter((a) => a.category === category).map((a) => (
                <li key={a.slug} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono font-bold text-brand">{a.name}</h3>
                    <p className="text-[15px]">{a.exercise.task}</p>
                  </div>
                  <Link href={`${ARTICLES_PATH}/${a.slug}#practice` as never} className="shrink-0 text-[15px] font-semibold text-brand hover:underline">
                    Solve it →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="text-2xl font-bold">How to get the most out of practice</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[17px] leading-relaxed">
            <li>Try each problem before opening the hint. Struggling for a minute is how the formula sticks.</li>
            <li>When you solve one, change a value in your head and predict the new result. That shows whether you understand it or just matched the pattern.</li>
            <li>Come back to the ones you missed a few days later, without looking at the answer.</li>
            <li>Need the keys too? Keep the <Link href={"/excel-shortcuts" as never} className="font-semibold text-brand hover:underline">Excel shortcuts list</Link> open, with Windows and Mac keys.</li>
          </ul>
        </section>

        <GuideCta title="Practice in full lessons" body="Short lessons in a real spreadsheet that build these skills in order, with instant feedback." />
      </article>
    </ExcelGuideLayout>
  );
}
