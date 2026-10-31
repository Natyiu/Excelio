import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Text inputs on the settings pages: thick border, soft fill, brand ring on focus. */
export const fieldClass =
  "h-12 w-full rounded-xl border-2 border-border bg-muted/40 px-4 text-[15px] shadow-none outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-brand focus-visible:bg-card focus-visible:ring-0 disabled:opacity-60 " +
  // Keep the browser's autofill from painting the box yellow.
  "[&:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_var(--card)] [&:-webkit-autofill]:[caret-color:var(--foreground)]";

/** A settings group: coloured icon tile, title and hint, then its content and an optional footer. */
export function SettingsCard({
  icon: Icon,
  colour,
  title,
  hint,
  footer,
  danger,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  colour: string;
  title: string;
  hint: string;
  footer?: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border-2 bg-card", danger ? "border-destructive/40" : "border-border")}>
      <header className="flex items-center gap-4 border-b-2 border-border px-5 py-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: colour, boxShadow: `0 3px 0 color-mix(in oklab, ${colour} 60%, black)` }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className={cn("text-lg font-bold", danger && "text-destructive")}>{title}</h2>
          <p className="text-[14px] text-muted-foreground">{hint}</p>
        </div>
      </header>
      <div className="space-y-4 p-5">{children}</div>
      {footer && <footer className="flex justify-end border-t-2 border-border bg-muted/30 px-5 py-3.5">{footer}</footer>}
    </section>
  );
}

export function Field({ id, label, note, children }: { id: string; label: string; note?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[14px] font-bold">
        {label}
      </label>
      {children}
      {note && <p className="text-[13px] text-muted-foreground">{note}</p>}
    </div>
  );
}
