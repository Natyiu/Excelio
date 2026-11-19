import type { Metadata } from "next";
import Link from "next/link";
import { SHORTCUT_GROUPS } from "@/data/shortcuts";
import { GUIDE_PATH, jsonLd } from "@/lib/excel-guide";
import { SITE_URL } from "@/lib/site-url";
import { Crumbs, GuideCta, breadcrumbSchema } from "../learn-excel/guide-parts";
import ExcelGuideLayout from "../learn-excel/layout";

const PATH = "/excel-shortcuts";
const COUNT = SHORTCUT_GROUPS.reduce((n, g) => n + g.items.length, 0);
const TITLE = `Excel Keyboard Shortcuts for Windows and Mac: ${COUNT} Worth Knowing | Excelio`;
const DESCRIPTION = `The ${COUNT} Excel keyboard shortcuts that save the most time, with the Windows and Mac keys side by side: moving, selecting, editing, formulas, formatting and filters.`;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", url: PATH, siteName: "Excelio", images: ["/opengraph-image"] },
};

export default function ExcelShortcutsPage() {
  const crumbs = [{ name: "Excel guide", href: GUIDE_PATH }, { name: "Shortcuts", href: PATH }];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Excel keyboard shortcuts for Windows and Mac",
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
          <h1 className="text-4xl font-extrabold tracking-tight">Excel keyboard shortcuts for Windows and Mac</h1>
          <p className="mt-3 text-lg text-muted-foreground">{DESCRIPTION}</p>
          <p className="mt-3 text-[15px] text-muted-foreground">
            On a Mac laptop, Home, End, Page Up and Page Down need the fn key. ⌘ is Command, ⌃ is Control, ⌥ is Option and ⇧ is Shift.
          </p>
          <nav aria-label="Sections" className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[15px] font-semibold">
            {SHORTCUT_GROUPS.map((g) => <a key={g.title} href={`#${slug(g.title)}`} className="text-brand hover:underline">{g.title}</a>)}
          </nav>
        </header>

        {SHORTCUT_GROUPS.map((g) => (
          <section key={g.title} id={slug(g.title)} className="scroll-mt-6">
            <h2 className="text-2xl font-bold">{g.title}</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border-2 border-border">
              <table className="w-full text-left text-[15px]">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Action</th>
                    <th className="px-3 py-2 font-semibold">Windows</th>
                    <th className="px-3 py-2 font-semibold">Mac</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {g.items.map((s) => (
                    <tr key={s.action}>
                      <td className="px-3 py-2">{s.action}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[14px] font-semibold">{s.win}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[14px] font-semibold">{s.mac}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section>
          <h2 className="text-2xl font-bold">Which shortcuts to learn first</h2>
          <p className="mt-2 text-[17px] leading-relaxed">
            Start with jumping to the edge of the data and extending the selection to the edge. Together they replace most scrolling and dragging. Then learn the one that toggles absolute references in a formula, which saves retyping dollar signs.
            When you know a few, put them to work on the <Link href={"/excel-practice" as never} className="font-semibold text-brand hover:underline">Excel practice exercises</Link> or the <Link href={"/excel-test" as never} className="font-semibold text-brand hover:underline">free Excel test</Link>.
          </p>
        </section>

        <GuideCta title="Learn Excel by doing" body="Short lessons in a real spreadsheet, with instant feedback." />
      </article>
    </ExcelGuideLayout>
  );
}
