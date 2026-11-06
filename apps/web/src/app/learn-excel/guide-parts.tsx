import Link from "next/link";
import { RichText } from "@/components/learning/lesson-notes";
import { pressable } from "@/components/game-ui";
import { readDemo } from "@/lib/excel-guide";
import { parseNotes } from "@/lib/lesson-notes-parse";
import { SITE_URL } from "@/lib/site-url";

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

export function GuideCta({ title, body }: { title: string; body: string }) {
  return (
    <aside className="rounded-3xl border-2 border-b-[5px] border-border bg-card p-6 text-center">
      <p className="text-xl font-bold">{title}</p>
      <p className="mt-1 text-[15px] text-muted-foreground">{body}</p>
      <Link href={"/start" as never} className={pressable("brand", "mt-4 px-6 py-3")}>
        Start learning for free
      </Link>
    </aside>
  );
}
