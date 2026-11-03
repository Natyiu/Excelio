"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { FEEDBACK_CATEGORIES } from "@/lib/feedback-categories";

export type Show = "all" | "not-replied" | "replied";

const selectClass =
  "h-9 rounded-full border border-border bg-background px-3 pr-8 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

/** Two simple dropdowns that filter the list (kept in the URL). */
export function FeedbackFilters({ show, type, total }: { show: Show; type: string; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const go = (next: { show?: Show; type?: string }) => {
    const q = new URLSearchParams();
    const s = next.show ?? show;
    const t = next.type ?? type;
    if (s !== "all") q.set("show", s);
    if (t !== "all") q.set("type", t);
    startTransition(() => router.push((q.size ? `${pathname}?${q}` : pathname) as never));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted/50 p-2">
      <label className="flex items-center gap-2 pl-2 text-sm text-muted-foreground">
        Show
        <select value={show} onChange={(e) => go({ show: e.target.value as Show })} className={selectClass}>
          <option value="all">All messages</option>
          <option value="not-replied">Not replied yet</option>
          <option value="replied">Replied</option>
        </select>
      </label>
      <label className="flex items-center gap-2 pl-2 text-sm text-muted-foreground">
        Type
        <select value={type} onChange={(e) => go({ type: e.target.value })} className={selectClass}>
          <option value="all">All types</option>
          {FEEDBACK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <span className="ml-auto pr-2 text-sm text-muted-foreground">
        {pending ? "Loading…" : `${total} message${total === 1 ? "" : "s"}`}
      </span>
    </div>
  );
}
