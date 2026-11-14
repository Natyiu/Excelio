import { ALL_FUNCTION_ARTICLES, FUNCTION_ARTICLES, ARTICLES_PATH } from "@/data/function-articles";
import { SHORTCUT_GROUPS } from "@/data/shortcuts";
import { PageHeader } from "@/components/game-ui";
import { CheatSheet, type CheatFormula } from "./cheat-sheet";

export const metadata = { title: "Cheat sheet | Excelio" };

/** Every function Excelio teaches, plus keyboard shortcuts, in one searchable reference. */
export default function CheatSheetPage() {
  const released = new Set(FUNCTION_ARTICLES.map((a) => a.slug));
  // Only the fields the list shows go to the browser, not each article's sample sheet and exercise.
  const formulas: CheatFormula[] = ALL_FUNCTION_ARTICLES.map((a) => ({
    name: a.name,
    category: a.category,
    syntax: a.syntax,
    answer: a.answer,
    args: a.args,
    example: { ask: a.examples[0]!.ask, formula: a.examples[0]!.formula },
    href: released.has(a.slug) ? `${ARTICLES_PATH}/${a.slug}` : undefined,
  })).sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="space-y-6">
      <PageHeader title="Cheat sheet" description={`${formulas.length} formulas and the keyboard shortcuts worth knowing.`} />
      <CheatSheet formulas={formulas} shortcuts={SHORTCUT_GROUPS} />
    </div>
  );
}
