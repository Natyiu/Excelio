import Link from "next/link";
import { RichText } from "@/components/learning/lesson-notes";
import { ArrowRight01Icon as ArrowRight, Tick02Icon as Check } from "@hugeicons/react";
import { pressable } from "@/components/game-ui";
import { Mascot } from "@/components/mascot";
import { readDemo } from "@/lib/excel-guide";
import { parseNotes } from "@/lib/lesson-notes-parse";
import { SITE_URL } from "@/lib/site-url";
import { cn } from "@/lib/utils";

function NotesTable({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows;
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-border">
      <table className="w-full text-left text-[15px]">
        {head && (
          <thead className="bg-muted/60">
            <tr>{head.map((c, i) => <th key={i} className="px-3 py-2 font-semibold"><RichText text={c} /></th>)}</tr>
          </thead>
        )}
        <tbody className="divide-y divide-border">
          {body.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2"><RichText text={c} /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lesson notes as a readable article: the app's animated demos become a table and written steps. */
export function GuideNotes({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-[17px] leading-relaxed">
      {parseNotes(text).map((b, i) => {
        if (b.kind === "p") return <p key={i}><RichText text={b.text} /></p>;
        if (b.kind === "table") return <NotesTable key={i} rows={b.rows} />;
        if (b.kind === "code") {
          return (
            <pre key={i} className="overflow-x-auto rounded-2xl bg-muted px-4 py-3 font-mono text-[15px]">
              {b.lines.join("\n")}
            </pre>
          );
        }
        if (b.kind === "list") {
          const Tag = b.ordered ? "ol" : "ul";
          return (
            <Tag key={i} className={b.ordered ? "list-decimal space-y-1 pl-6" : "list-disc space-y-1 pl-6"}>
              {b.items.map((item, j) => <li key={j}><RichText text={item} /></li>)}
            </Tag>
          );
        }
        const { rows, steps } = readDemo(b.lines);
        return (
          <figure key={i} className="space-y-3">
            {rows.length > 0 && <NotesTable rows={rows} />}
            {steps.length > 0 && (
              <ol className="list-decimal space-y-1 pl-6">
                {steps.map((s, j) => (
                  <li key={j}>
                    {s.formula && <>In <code className="font-mono text-[0.9em] font-semibold">{s.cell}</code>, type <code className="font-mono text-[0.9em] font-semibold">{s.formula}</code>. </>}
                    <RichText text={s.caption} />
                  </li>
                ))}
              </ol>
            )}
          </figure>
        );
      })}
    </div>
  );
}

export function Crumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-x-2 text-sm text-muted-foreground">
      {items.map((c, i) => (
        <span key={c.href} className="flex gap-x-2">
          {i > 0 && <span aria-hidden>/</span>}
          <Link href={c.href as never} className="hover:text-foreground">{c.name}</Link>
        </span>
      ))}
    </nav>
  );
}

export const breadcrumbSchema = (items: { name: string; href: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE_URL}${c.href}` })),
});

export const START_HREF = "/start";

/** The faint spreadsheet grid behind heroes, fading out at the edges. */
export function GridBackdrop({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:72px_32px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]",
        className
      )}
    />
  );
}

/** The main call to action: a big, bright panel with Gridley cheering. Marked so the sticky bar hides while it's on screen. */
export function GuideCta({ title, body, label = "Start learning for free" }: { title: string; body: string; label?: string }) {
  return (
    <aside
      data-guide-cta
      className="relative overflow-hidden rounded-3xl bg-brand px-6 py-8 text-center text-white shadow-[0_6px_0_var(--brand-deep)] sm:px-10 sm:text-left"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_28px] [mask-image:linear-gradient(to_left,black,transparent_80%)]"
      />
      <div className="relative flex flex-col items-center gap-6 sm:flex-row">
        <Mascot mood="cheer" size={120} className="shrink-0 drop-shadow-[0_10px_16px_rgb(0_0_0/0.25)]" />
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-extrabold tracking-tight">{title}</p>
          <p className="mt-1 text-[16px] text-white/85">{body}</p>
          <Link
            href={START_HREF as never}
            className="group relative mt-5 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[17px] font-extrabold text-brand shadow-[0_5px_0_rgb(0_0_0/0.2)] transition-[transform,box-shadow] duration-100 hover:-translate-y-0.5 active:translate-y-[4px] active:shadow-none"
          >
            <span aria-hidden className="cta-glow absolute inset-0 rounded-full text-white" />
            <span className="relative">{label}</span>
            <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] font-semibold text-white/80 sm:justify-start">
            <span className="flex items-center gap-1"><Check className="h-4 w-4" /> No account needed to start</span>
            <span className="flex items-center gap-1"><Check className="h-4 w-4" /> Works in your browser</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

/** A slimmer nudge between sections, for readers who skim past the big panels. */
export function InlineCta({ text, label = "Try it free" }: { text: string; label?: string }) {
  return (
    <Link
      href={START_HREF as never}
      className="group flex items-center gap-4 rounded-2xl border-2 border-b-[5px] border-brand/40 bg-brand-soft px-4 py-3 transition-transform hover:-translate-y-0.5"
    >
      <Mascot mood="wave" size={44} faceOnly />
      <span className="min-w-0 flex-1 text-[15px] font-semibold">{text}</span>
      <span className={pressable("brand", "shrink-0 px-4 py-2 text-sm")}>
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
