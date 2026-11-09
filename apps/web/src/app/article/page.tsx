import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight01Icon as Arrow } from "@hugeicons/react";
import { Panel, pressable } from "@/components/game-ui";
import { Mascot } from "@/components/mascot";
import { FUNCTION_ARTICLES, ARTICLES_PATH } from "@/data/function-articles";

const TITLE = "Excel Functions With Live Practice and Examples | Excelio";
const DESCRIPTION = "Clear guides to the Excel functions used in real work, each with worked examples, common mistakes and an exercise you can solve on the page.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: ARTICLES_PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: ARTICLES_PATH, siteName: "Excelio", images: ["/opengraph-image"] },
};

export default function FunctionsPage() {
  const categories = [...new Set(FUNCTION_ARTICLES.map((a) => a.category))];
  return (
    <div className="space-y-10">
      <header className="relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl bg-brand p-6 text-white sm:p-10">
        <div className="max-w-2xl">
          <p className="text-[13px] font-bold uppercase tracking-wider text-white/80">{FUNCTION_ARTICLES.length} function guides</p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">Excel functions you can practice right here</h1>
          <p className="mt-3 text-lg font-medium leading-snug">{DESCRIPTION}</p>
        </div>
        <Mascot mood="wave" size={150} className="hidden shrink-0 sm:block" />
      </header>

      {categories.map((category) => {
        const articles = FUNCTION_ARTICLES.filter((a) => a.category === category);
        return (
          <section key={category}>
            <div className="flex items-center gap-3">
              <span className="h-[3px] flex-1 rounded-full bg-brand/25" />
              <h2 className="flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-[13px] font-extrabold uppercase tracking-wider text-white shadow-[0_3px_0_var(--brand-deep)]">{category}</h2>
              <span className="h-[3px] flex-1 rounded-full bg-brand/25" />
            </div>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link href={`${ARTICLES_PATH}/${a.slug}` as never} className="block h-full">
                    <Panel className="flex h-full flex-col p-5 shadow-[0_4px_0_var(--border)] transition-transform hover:-translate-y-0.5">
                      <span className="font-mono text-lg font-extrabold text-brand">{a.name}</span>
                      <span className="mt-1 flex-1 text-[15px] text-muted-foreground">{a.answer}</span>
                      <span className="mt-3 inline-flex items-center gap-1 text-[14px] font-bold">Learn and practice <Arrow className="size-4" /></span>
                    </Panel>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <div className="text-center"><Link href={"/start" as never} className={pressable("brand", "px-8 py-3")}>Start learning for free</Link></div>
    </div>
  );
}
