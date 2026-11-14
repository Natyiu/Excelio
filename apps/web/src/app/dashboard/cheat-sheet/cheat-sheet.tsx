"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowDown01Icon as Chevron, Search01Icon as Search } from "@hugeicons/react";
import type { ShortcutGroup } from "@/data/shortcuts";
import { cn } from "@/lib/utils";

export type CheatFormula = {
  name: string;
  category: string;
  syntax: string;
  answer: string;
  args: [string, string][];
  example: { ask: string; formula: string };
  /** The full article, when it is public. */
  href?: string;
};

type Tab = "formulas" | "shortcuts";

const noSubscribe = () => () => {};

/** "SUMIFS adds up…" reads as "Adds up…" next to the name. */
function summary(f: CheatFormula) {
  const rest = f.answer.startsWith(`${f.name} `) ? f.answer.slice(f.name.length + 1) : f.answer;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

const chip = (on: boolean) =>
  cn(
    "shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold transition-colors",
    on ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
  );

function GroupTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="mb-1 flex items-baseline gap-2 px-1 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
      {count !== undefined && <span className="font-medium normal-case tracking-normal text-muted-foreground/60">{count}</span>}
    </h2>
  );
}

export function CheatSheet({ formulas, shortcuts }: { formulas: CheatFormula[]; shortcuts: ShortcutGroup[] }) {
  const [tab, setTab] = useState<Tab>("formulas");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  // Start on the visitor's own keyboard; the server can't know it, so it renders Windows.
  const onMac = useSyncExternalStore(noSubscribe, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false);
  const [picked, setMac] = useState<boolean | null>(null);
  const mac = picked ?? onMac;
  const [open, setOpen] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const categories = [...new Set(formulas.map((f) => f.category))].sort();
  const matches = formulas.filter(
    (f) => (!category || f.category === category) && (!q || `${f.name} ${f.answer}`.toLowerCase().includes(q))
  );
  const groups = categories
    .map((c) => ({ title: c, items: matches.filter((f) => f.category === c) }))
    .filter((g) => g.items.length > 0);
  const shownShortcuts = shortcuts
    .map((g) => ({ ...g, items: g.items.filter((s) => !q || `${s.action} ${s.win} ${s.mac}`.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-3">
        <div className="inline-flex rounded-full bg-muted p-1">
          {(["formulas", "shortcuts"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-5 py-1.5 text-[14px] font-semibold transition-colors",
                tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "formulas" ? "Formulas" : "Shortcuts"}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 focus-within:border-brand">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "formulas" ? "Search formulas" : "Search shortcuts"}
            className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
        </label>

        {tab === "formulas" ? (
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <button type="button" className={chip(!category)} onClick={() => setCategory(null)}>All</button>
            {categories.map((c) => (
              <button key={c} type="button" className={chip(category === c)} onClick={() => setCategory(category === c ? null : c)}>
                {c}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1.5">
            <button type="button" className={chip(!mac)} onClick={() => setMac(false)}>Windows</button>
            <button type="button" className={chip(mac)} onClick={() => setMac(true)}>Mac</button>
          </div>
        )}
      </div>

      {tab === "formulas" ? (
        groups.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No formula matches “{query}”.</p>
        ) : (
          groups.map((g) => (
            <section key={g.title}>
              <GroupTitle count={g.items.length}>{g.title}</GroupTitle>
              <ul className="divide-y divide-border/70 border-y border-border/70">
                {g.items.map((f) => {
                  const expanded = open === f.name;
                  return (
                    <li key={f.name}>
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : f.name)}
                        aria-expanded={expanded}
                        className="flex w-full items-baseline gap-3 px-1 py-2.5 text-left transition-colors hover:bg-muted/40"
                      >
                        <span className="w-28 shrink-0 font-mono text-[14px] font-bold sm:w-36">{f.name}</span>
                        <span className="min-w-0 flex-1 text-[14px] text-muted-foreground line-clamp-2">{summary(f)}</span>
                        <Chevron className={cn("h-4 w-4 shrink-0 self-center text-muted-foreground/60 transition-transform", expanded && "rotate-180")} />
                      </button>
                      {expanded && (
                        <div className="space-y-3 px-1 pb-4 pt-1">
                          <code className="block overflow-x-auto whitespace-nowrap rounded-lg bg-muted px-3 py-2 font-mono text-[13px] font-semibold">
                            ={f.syntax}
                          </code>
                          <dl className="space-y-1">
                            {f.args.map(([name, meaning]) => (
                              <div key={name} className="flex gap-3 text-[13px]">
                                <dt className="w-28 shrink-0 break-words font-mono font-semibold sm:w-36">{name}</dt>
                                <dd className="min-w-0 text-muted-foreground">{meaning}</dd>
                              </div>
                            ))}
                          </dl>
                          <div className="text-[13px]">
                            <p className="text-muted-foreground">{f.example.ask}</p>
                            <code className="mt-0.5 block overflow-x-auto whitespace-nowrap font-mono font-semibold text-brand">{f.example.formula}</code>
                          </div>
                          {f.href && (
                            <Link href={f.href as never} className="inline-block text-[13px] font-semibold text-brand hover:underline">
                              Full guide and practice →
                            </Link>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )
      ) : shownShortcuts.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No shortcut matches “{query}”.</p>
      ) : (
        <>
          {shownShortcuts.map((g) => (
            <section key={g.title}>
              <GroupTitle>{g.title}</GroupTitle>
              <ul className="divide-y divide-border/70 border-y border-border/70">
                {g.items.map((s) => (
                  <li key={s.action} className="flex items-center justify-between gap-4 px-1 py-2.5">
                    <span className="min-w-0 text-[14px]">{s.action}</span>
                    <kbd className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[12px] font-semibold">
                      {mac ? s.mac : s.win}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="px-1 text-[12px] text-muted-foreground">On Mac laptops, Home, End, Page Up and Page Down need the fn key.</p>
        </>
      )}
    </div>
  );
}
