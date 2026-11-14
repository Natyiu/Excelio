"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowDown01Icon as Chevron, Search01Icon as Search } from "@hugeicons/react";
import { Panel } from "@/components/game-ui";
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

const chip = (on: boolean) =>
  cn(
    "shrink-0 rounded-full border-2 px-3.5 py-1.5 text-[14px] font-semibold transition-colors",
    on ? "border-brand bg-brand-soft text-brand" : "border-border text-muted-foreground hover:text-foreground"
  );

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
  const categories = [...new Set(formulas.map((f) => f.category))];
  const shownFormulas = formulas.filter(
    (f) => (!category || f.category === category) && (!q || `${f.name} ${f.answer} ${f.syntax}`.toLowerCase().includes(q))
  );
  const shownShortcuts = shortcuts
    .map((g) => ({ ...g, items: g.items.filter((s) => !q || `${s.action} ${s.win} ${s.mac}`.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border-2 border-border p-1">
        {(["formulas", "shortcuts"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl py-2 text-[15px] font-bold transition-colors",
              tab === t ? "bg-brand text-white shadow-[0_3px_0_var(--brand-deep)]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "formulas" ? `Formulas (${formulas.length})` : "Shortcuts"}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-2.5 focus-within:border-brand">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "formulas" ? "Search formulas, like lookup or date" : "Search shortcuts, like paste or filter"}
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </label>

      {tab === "formulas" ? (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button type="button" className={chip(!category)} onClick={() => setCategory(null)}>All</button>
            {categories.map((c) => (
              <button key={c} type="button" className={chip(category === c)} onClick={() => setCategory(category === c ? null : c)}>
                {c}
              </button>
            ))}
          </div>

          {shownFormulas.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No formula matches “{query}”.</p>
          ) : (
            <Panel className="divide-y-2 divide-border overflow-hidden">
              {shownFormulas.map((f) => {
                const expanded = open === f.name;
                return (
                  <div key={f.name}>
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : f.name)}
                      aria-expanded={expanded}
                      className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-mono text-[16px] font-extrabold text-brand">{f.name}</span>
                          <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{f.category}</span>
                        </span>
                        <code className="mt-0.5 block overflow-x-auto whitespace-nowrap font-mono text-[13px] text-foreground/80">={f.syntax}</code>
                        <span className="mt-1 block text-[14px] text-muted-foreground">{f.answer}</span>
                      </span>
                      <Chevron className={cn("mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                    </button>
                    {expanded && (
                      <div className="space-y-3 bg-muted/30 px-4 pb-4 pt-1">
                        <dl className="space-y-1.5">
                          {f.args.map(([name, meaning]) => (
                            <div key={name} className="text-[14px]">
                              <dt className="inline font-mono font-bold">{name}</dt>
                              <dd className="inline text-muted-foreground"> — {meaning}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="rounded-xl bg-brand-soft px-3 py-2">
                          <p className="text-[13px] font-semibold text-muted-foreground">{f.example.ask}</p>
                          <code className="block overflow-x-auto whitespace-nowrap font-mono text-[14px] font-semibold text-brand">{f.example.formula}</code>
                        </div>
                        {f.href && (
                          <Link href={f.href as never} className="inline-block text-[14px] font-bold text-brand hover:underline">
                            Full guide with practice →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </Panel>
          )}
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <button type="button" className={chip(!mac)} onClick={() => setMac(false)}>Windows</button>
            <button type="button" className={chip(mac)} onClick={() => setMac(true)}>Mac</button>
          </div>

          {shownShortcuts.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No shortcut matches “{query}”.</p>
          ) : (
            shownShortcuts.map((g) => (
              <section key={g.title}>
                <h2 className="mb-2 px-1 text-lg font-bold tracking-tight">{g.title}</h2>
                <Panel className="divide-y-2 divide-border overflow-hidden">
                  {g.items.map((s) => (
                    <div key={s.action} className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="text-[15px]">{s.action}</span>
                      <kbd className="shrink-0 rounded-lg border-2 border-b-4 border-border bg-card px-2 py-0.5 font-mono text-[13px] font-semibold">
                        {mac ? s.mac : s.win}
                      </kbd>
                    </div>
                  ))}
                </Panel>
              </section>
            ))
          )}
          <p className="px-1 text-[13px] text-muted-foreground">On Mac laptops, Home, End, Page Up and Page Down need the fn key.</p>
        </>
      )}
    </div>
  );
}
