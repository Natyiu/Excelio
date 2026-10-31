"use client";

import type { ReactNode } from "react";
import type { CellFormat } from "@/types/excel-learning";
import { cn } from "@/lib/utils";

/**
 * The parts of the Excel window around the grid (title bar, ribbon tabs, the Home
 * ribbon and the status bar), drawn in the app's own style so learners see and
 * learn the real layout. Commands the lesson grid supports work; the rest are
 * there to be recognised.
 */

const TABS = ["File", "Home", "Insert", "Page Layout", "Formulas", "Data", "Review", "View"];

export function ExcelTitleBar({ fileName = "Book1" }: { fileName?: string }) {
  return (
    <div className="flex items-center gap-3 bg-brand px-3 py-2 text-[12px] text-brand-foreground">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/15">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="2" y="2" width="12" height="12" rx="2" />
          <path d="M2 6h12M2 10h12M6 2v12" />
        </svg>
      </span>
      <span className="truncate font-semibold">{fileName} - Excel</span>
      <span className="mx-auto hidden w-56 items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-white/80 sm:flex">
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        Search
      </span>
      {/* window controls: minimise, maximise, close */}
      <span className="ml-auto flex shrink-0 items-center gap-3 text-white/70 sm:ml-0" aria-hidden>
        <span>—</span>
        <span>☐</span>
        <span>✕</span>
      </span>
    </div>
  );
}

export function ExcelTabs() {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border/60 bg-card px-2 text-[12.5px]">
      {TABS.map((t) => (
        <span
          key={t}
          className={cn(
            "shrink-0 whitespace-nowrap px-2.5 py-1.5",
            t === "Home" ? "font-semibold text-brand shadow-[inset_0_-2px_0_var(--brand)]" : "text-muted-foreground"
          )}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col justify-between border-r border-border/60 px-2 last:border-r-0">
      <div className="flex flex-1 items-center gap-0.5">{children}</div>
      <span className="pt-0.5 text-center text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function Btn({
  children,
  title,
  onClick,
  active,
  big,
  label,
}: {
  children: ReactNode;
  title: string;
  onClick?: () => void;
  active?: boolean;
  big?: boolean;
  label?: string;
}) {
  const live = Boolean(onClick);
  return (
    <button
      type="button"
      title={live ? title : `${title} (not needed in this lesson)`}
      onMouseDown={(e) => e.preventDefault()} // keep the cell selection
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-lg text-foreground transition-colors",
        big ? "h-14 min-w-12 flex-col gap-0.5 px-1.5 text-[10px] leading-tight" : "h-7 min-w-7 px-1 text-[13px]",
        live ? "hover:bg-muted" : "cursor-default opacity-60",
        active && "bg-brand-soft text-brand"
      )}
    >
      {children}
      {label && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

const Ic = ({ d, className }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export function ExcelRibbon({
  format,
  onFormat,
  onFormula,
}: {
  format?: CellFormat;
  onFormat: (f: Partial<CellFormat>) => void;
  onFormula: (start: string) => void;
}) {
  return (
    <div className="flex items-stretch overflow-x-auto border-b border-border/60 bg-muted/30 px-1 py-1.5">
      <Group label="Clipboard">
        <Btn big title="Paste" label="Paste">
          <Ic className="h-6 w-6" d="M9 4h6v3H9zM7 6H5v15h14V6h-2" />
        </Btn>
      </Group>
      <Group label="Font">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span className="w-20 rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground">Aptos</span>
            <span className="w-8 rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground">11</span>
          </div>
          <div className="flex items-center">
            <Btn title="Bold" active={format?.bold} onClick={() => onFormat({ bold: !format?.bold })}>
              <b>B</b>
            </Btn>
            <Btn title="Italic" active={format?.italic} onClick={() => onFormat({ italic: !format?.italic })}>
              <i className="font-serif">I</i>
            </Btn>
            <Btn title="Underline" active={format?.underline} onClick={() => onFormat({ underline: !format?.underline })}>
              <u>U</u>
            </Btn>
            <Btn title="Borders">
              <Ic d="M4 4h16v16H4zM4 12h16M12 4v16" />
            </Btn>
            <Btn title="Fill Color">
              <Ic d="M5 12l7-7 6 6-7 7zM19 15s2 2.2 2 3.5a2 2 0 0 1-4 0c0-1.3 2-3.5 2-3.5" />
            </Btn>
          </div>
        </div>
      </Group>
      <Group label="Alignment">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center">
            <Btn title="Align Left" active={format?.align === "left"} onClick={() => onFormat({ align: "left" })}>
              <Ic d="M4 6h16M4 10h10M4 14h16M4 18h10" />
            </Btn>
            <Btn title="Center" active={format?.align === "center"} onClick={() => onFormat({ align: "center" })}>
              <Ic d="M4 6h16M7 10h10M4 14h16M7 18h10" />
            </Btn>
            <Btn title="Align Right" active={format?.align === "right"} onClick={() => onFormat({ align: "right" })}>
              <Ic d="M4 6h16M10 10h10M4 14h16M10 18h10" />
            </Btn>
          </div>
          <div className="flex items-center">
            <Btn title="Wrap Text" label="Wrap" active={format?.wrap} onClick={() => onFormat({ wrap: !format?.wrap })}>
              <Ic className="mr-1 h-3.5 w-3.5" d="M4 6h16M4 12h13a3 3 0 0 1 0 6h-4m2-2-2 2 2 2M4 18h5" />
            </Btn>
            <Btn title="Merge & Center" label="Merge">
              <Ic className="mr-1 h-3.5 w-3.5" d="M4 5h16v14H4zM8 12h8m-2-2 2 2-2 2m-4-4-2 2 2 2" />
            </Btn>
          </div>
        </div>
      </Group>
      <Group label="Number">
        <div className="flex flex-col gap-0.5">
          <span className="w-24 rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {format?.numberFormat === "currency" ? "Currency" : format?.numberFormat === "percentage" ? "Percentage" : format?.numberFormat === "date" ? "Date" : format?.numberFormat === "number" ? "Number" : "General"}
          </span>
          <div className="flex items-center">
            <Btn title="Currency" active={format?.numberFormat === "currency"} onClick={() => onFormat({ numberFormat: format?.numberFormat === "currency" ? undefined : "currency" })}>
              $
            </Btn>
            <Btn title="Percent Style" active={format?.numberFormat === "percentage"} onClick={() => onFormat({ numberFormat: format?.numberFormat === "percentage" ? undefined : "percentage" })}>
              %
            </Btn>
            <Btn title="Comma Style" active={format?.numberFormat === "number"} onClick={() => onFormat({ numberFormat: format?.numberFormat === "number" ? undefined : "number" })}>
              <span className="font-bold">,</span>
            </Btn>
          </div>
        </div>
      </Group>
      <Group label="Styles">
        <Btn big title="Conditional Formatting" label="Conditional">
          <Ic className="h-5 w-5" d="M4 4h16v16H4zM4 9h16M4 14h16M9 4v16" />
        </Btn>
        <Btn big title="Format as Table" label="Table">
          <Ic className="h-5 w-5" d="M4 5h16v14H4zM4 10h16M10 10v9" />
        </Btn>
      </Group>
      <Group label="Cells">
        <Btn big title="Insert" label="Insert">
          <Ic className="h-5 w-5" d="M4 8h16v12H4zM12 2v6m-3-3h6" />
        </Btn>
        <Btn big title="Delete" label="Delete">
          <Ic className="h-5 w-5" d="M4 8h16v12H4zM9 3l6 4m0-4-6 4" />
        </Btn>
      </Group>
      <Group label="Editing">
        <Btn big title="AutoSum" label="AutoSum" onClick={() => onFormula("=SUM(")}>
          <span className="text-lg font-bold leading-none">Σ</span>
        </Btn>
        <Btn big title="Sort & Filter" label="Sort">
          <Ic className="h-5 w-5" d="M7 4v16m-3-3 3 3 3-3M14 5h6M14 10h4M14 15h2" />
        </Btn>
        <Btn big title="Find & Select" label="Find">
          <Ic className="h-5 w-5" d="M10.5 10.5m-6 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0M15 15l5 5" />
        </Btn>
      </Group>
    </div>
  );
}

export function ExcelSheetTabs({ names }: { names: string[] }) {
  return (
    <div className="flex items-center gap-1 border-t border-border/60 bg-card px-2 py-1 text-[12px]">
      <span className="px-1 text-muted-foreground">‹ ›</span>
      {names.map((n, i) => (
        <span key={n} className={cn("rounded-md px-3 py-0.5", i === 0 ? "font-semibold text-brand shadow-[inset_0_-2px_0_var(--brand)]" : "text-muted-foreground")}>
          {n}
        </span>
      ))}
      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground">+</span>
    </div>
  );
}

export function ExcelStatusBar({ mode, stats }: { mode: string; stats: { count: number; sum: number | null; avg: number | null } }) {
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <div className="flex items-center gap-4 border-t border-border/60 bg-muted/30 px-3 py-1.5 text-[11.5px] text-muted-foreground">
      <span className="font-medium">{mode}</span>
      <span className="ml-auto flex items-center gap-4 tabular-nums">
        {stats.avg !== null && stats.count > 1 && (
          <span>
            Average: <b className="text-foreground">{fmt(stats.avg)}</b>
          </span>
        )}
        {stats.count > 1 && (
          <span>
            Count: <b className="text-foreground">{stats.count}</b>
          </span>
        )}
        {stats.sum !== null && stats.count > 1 && (
          <span>
            Sum: <b className="text-foreground">{fmt(stats.sum)}</b>
          </span>
        )}
      </span>
      <span className="hidden items-center gap-2 sm:flex">
        <span className="h-1 w-16 rounded-full bg-border">
          <span className="block h-1 w-8 rounded-full bg-muted-foreground/60" />
        </span>
        100%
      </span>
    </div>
  );
}
