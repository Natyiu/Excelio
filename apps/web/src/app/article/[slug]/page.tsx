import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, pressable } from "@/components/game-ui";
import { SheetDemo } from "@/components/learning/sheet-demo";
import { Mascot } from "@/components/mascot";
import { PracticeSheet } from "@/components/functions/practice-sheet";
import { findFunctionArticle, FUNCTION_ARTICLES, ARTICLES_PATH, type FunctionArticle } from "@/data/function-articles";
import { GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { cellId, formatDateSerial } from "@/lib/formula-engine";
import { SITE_URL } from "@/lib/site-url";
import { Crumbs, breadcrumbSchema } from "../../learn-excel/guide-parts";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => FUNCTION_ARTICLES.map((a) => ({ slug: a.slug }));

const titleOf = (a: FunctionArticle) => `Excel ${a.name} Function: ${a.hook} | Excelio`;
const shown = (v: string | number) => (typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : v);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = findFunctionArticle((await params).slug);
  if (!a) return {};
  const title = titleOf(a);
  const url = `${ARTICLES_PATH}/${a.slug}`;
  return { title, description: a.answer, alternates: { canonical: url }, openGraph: { title, description: a.answer, type: "article", url, siteName: "Excelio", images: ["/opengraph-image"] } };
}

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function FunctionArticlePage({ params }: Props) {
  const a = findFunctionArticle((await params).slug);
  if (!a) notFound();
  const url = `${ARTICLES_PATH}/${a.slug}`;
  const crumbs = [{ name: "Excel guide", href: GUIDE_PATH }, { name: "Articles", href: ARTICLES_PATH }, { name: a.name, href: url }];
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: `Excel ${a.name} function: ${a.hook}`, description: a.answer, url: `${SITE_URL}${url}`, inLanguage: "en", publisher: { "@type": "Organization", name: "Excelio", url: SITE_URL } };
  const target = cellId(a.data[0]!.length + 1, 1);
  const first = a.examples[0]!;
  const demo = [...a.data.map((r) => `| ${r.join(" | ")} |`), `type ${target} ${first.formula}: ${first.explain}`];
  // A named sibling may not be released yet, so top up with released articles, closest topic first.
  const others = FUNCTION_ARTICLES.filter((r) => r.slug !== a.slug);
  const related = [...new Set([...a.related.flatMap((s) => findFunctionArticle(s) ?? []), ...others.filter((r) => r.category === a.category), ...others])].slice(0, 3);

  return (
    <article className="mx-auto max-w-2xl space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([breadcrumbSchema(crumbs), schema]) }} />

      <header>
        <Crumbs items={crumbs} />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Excel {a.name}</h1>
            <p className="mt-3 text-xl font-semibold leading-snug">{a.answer}</p>
          </div>
          <Mascot mood="wave" size={110} className="hidden shrink-0 sm:block" />
        </div>
        <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">{a.story}</p>
        <a href="#practice" className={pressable("brand", "mt-5 px-6 py-3")}>Practice it now</a>
      </header>

      <Section title="How to write it">
        <Panel className="overflow-hidden">
          <code className="block overflow-x-auto bg-brand-soft px-4 py-3 font-mono text-[15px] font-semibold text-brand">={a.syntax}</code>
          <dl className="divide-y divide-border">
            {a.args.map(([name, meaning]) => (
              <div key={name} className="px-4 py-2.5">
                <dt className="font-mono text-[14px] font-bold">{name}</dt>
                <dd className="text-[15px] text-muted-foreground">{meaning}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </Section>

      <Section title="Watch it work">
        <Panel className="p-3"><SheetDemo lines={demo} /></Panel>
      </Section>

      <Section title="Examples">
        <Panel className="divide-y divide-border">
          {a.examples.map((e) => (
            <div key={e.formula} className="p-4">
              <h3 className="font-bold">{e.ask}</h3>
              <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <code className="max-w-full overflow-x-auto font-mono text-[14px] text-muted-foreground">{e.formula}</code>
                <strong className="text-brand">{a.category === "Dates" && typeof e.expected === "number" && e.expected > 30000 ? formatDateSerial(e.expected) : shown(e.expected)}</strong>
              </div>
              <p className="mt-1.5 text-[15px] text-muted-foreground">{e.explain}</p>
            </div>
          ))}
        </Panel>
      </Section>

      <Section id="practice" title="Your turn">
        <Panel className="border-brand p-4">
          <p className="mb-4 text-[17px] font-semibold">{a.exercise.task} Type your formula in <code className="font-mono text-brand">{target}</code>.</p>
          <PracticeSheet data={a.data} target={target} expected={a.exercise.expected} requires={a.exercise.requires} hint={a.exercise.hint} solution={a.exercise.solution} />
        </Panel>
      </Section>

      <Section title="Common mistakes">
        <Panel className="divide-y divide-border">
          {a.mistakes.map(([problem, fix]) => (
            <div key={problem} className="p-4">
              <p className="font-bold">{problem}</p>
              <p className="mt-0.5 text-[15px] text-muted-foreground">{fix}</p>
            </div>
          ))}
        </Panel>
      </Section>

      <Section title="Good to know">
        <ul className="list-disc space-y-1.5 pl-5 text-[17px] leading-relaxed">
          {a.tips.map((t) => <li key={t}>{t}</li>)}
          <li><strong>{a.name} or {a.versus.name}?</strong> {a.versus.text}</li>
        </ul>
      </Section>

      <aside className="flex items-center gap-4 rounded-2xl bg-brand p-6 text-white">
        <Mascot mood="cheer" size={92} className="hidden shrink-0 sm:block" />
        <div>
          <p className="text-xl font-extrabold tracking-tight">Learn Excel by doing</p>
          <p className="mt-0.5 text-[15px] text-white/85">Short lessons in a real spreadsheet, with instant feedback.</p>
          <Link href={"/start" as never} className="mt-3 inline-flex rounded-full bg-white px-5 py-2.5 text-[15px] font-bold text-brand-deep shadow-[0_4px_0_rgb(0_0_0/0.2)] transition-transform active:translate-y-[3px] active:shadow-none">
            Start learning for free
          </Link>
        </div>
      </aside>

      <nav aria-label="Related" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-semibold">
        <span className="text-muted-foreground">Next:</span>
        {related.map((r) => <Link key={r.slug} href={`${ARTICLES_PATH}/${r.slug}` as never} className="font-mono text-brand hover:underline">{r.name}</Link>)}
        <Link href={`${GUIDE_PATH}/${a.chapter}` as never} className="text-brand hover:underline">Chapter guide</Link>
      </nav>
    </article>
  );
}
