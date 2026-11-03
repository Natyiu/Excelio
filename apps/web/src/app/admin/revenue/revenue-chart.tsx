"use client";

import { useState } from "react";
import type { MonthRow, Plan } from "@/lib/revenue";
import { PLAN_STYLE } from "@/lib/revenue-style";
import { cn } from "@/lib/utils";


const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });

/** Revenue per month as stacked bars (one stack per month, one segment per plan). Hover for the breakdown. */
export function RevenueChart({ rows, plans }: { rows: MonthRow[]; plans: Plan[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const total = (r: MonthRow) => plans.reduce((s, p) => s + r[p], 0);
  const max = Math.max(1, ...rows.map(total));
  // A few round gridlines
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  return (
    <div className="rounded-2xl bg-muted/50 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="font-semibold">Revenue by month</p>
        {/* legend (always shown so colour is never the only cue) */}
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
          {plans.map((p) => (
            <span key={p} className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-sm", PLAN_STYLE[p].swatch)} />
              {PLAN_STYLE[p].label}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTable((t) => !t)}
          className="ml-auto rounded-full border border-border bg-background px-3 py-1 text-[13px] font-medium hover:bg-muted"
        >
          {table ? "Show chart" : "Show table"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No payments yet.</p>
      ) : table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-left text-[12px] text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Month</th>
                {plans.map((p) => (
                  <th key={p} className="py-2 pr-4 text-right font-medium">{PLAN_STYLE[p].label}</th>
                ))}
                <th className="py-2 pr-4 text-right font-medium">Refunds</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {[...rows].reverse().map((r) => (
                <tr key={r.key}>
                  <td className="py-2 pr-4">{r.label}</td>
                  {plans.map((p) => (
                    <td key={p} className="py-2 pr-4 text-right">{usd(r[p])}</td>
                  ))}
                  <td className="py-2 pr-4 text-right text-muted-foreground">{r.refunds ? `−${usd(r.refunds)}` : "–"}</td>
                  <td className="py-2 text-right font-semibold">{usd(total(r))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative pt-7">
          <div className="flex h-56 gap-2">
            {/* y-axis labels */}
            <div className="relative w-12 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
              {ticks.map((t) => (
                <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
                  {usd(t)}
                </span>
              ))}
            </div>
            <div className="relative flex-1">
              {/* recessive gridlines */}
              {ticks.map((t) => (
                <span key={t} className="absolute inset-x-0 border-t border-border/60" style={{ bottom: `${(t / top) * 100}%` }} />
              ))}
              <div className="absolute inset-0 flex items-end gap-[2px]">
                {rows.map((r, i) => {
                  const t = total(r);
                  return (
                    <div
                      key={r.key}
                      className="relative flex h-full min-w-0 flex-1 flex-col justify-end"
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                    >
                      {/* hit target: the whole column, bigger than the bar */}
                      <div
                        className={cn("mx-auto flex w-full max-w-10 flex-col-reverse gap-[2px] transition-opacity", hover !== null && hover !== i && "opacity-50")}
                        style={{ height: `${(t / top) * 100}%` }}
                      >
                        {plans.map((p) =>
                          r[p] > 0 ? (
                            <span key={p} className={cn("w-full first:rounded-b-[2px] last:rounded-t-[4px]", PLAN_STYLE[p].swatch)} style={{ flexGrow: r[p] }} />
                          ) : null
                        )}
                      </div>
                      {hover === i && (
                        <div
                          role="tooltip"
                          className={cn(
                            "pointer-events-none absolute top-0 z-10 w-44 rounded-xl border border-border bg-popover p-3 text-[13px] shadow-lg",
                            i > rows.length / 2 ? "right-0" : "left-0"
                          )}
                        >
                          <p className="font-semibold">{r.label}</p>
                          {plans.map((p) => (
                            <p key={p} className="mt-1 flex items-center gap-1.5">
                              <span className={cn("h-2 w-2 rounded-sm", PLAN_STYLE[p].swatch)} />
                              <span className="text-muted-foreground">{PLAN_STYLE[p].label}</span>
                              <span className="ml-auto tabular-nums">{usd(r[p])}</span>
                            </p>
                          ))}
                          {r.refunds > 0 && (
                            <p className="mt-1 flex text-muted-foreground">
                              Refunds <span className="ml-auto tabular-nums">−{usd(r.refunds)}</span>
                            </p>
                          )}
                          <p className="mt-1.5 flex border-t border-border pt-1.5 font-semibold">
                            Total <span className="ml-auto tabular-nums">{usd(t)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* x-axis: label every month when few, otherwise every few */}
          <div className="ml-14 mt-1 flex gap-[2px] text-[11px] text-muted-foreground">
            {rows.map((r, i) => (
              <span key={r.key} className="min-w-0 flex-1 truncate text-center">
                {rows.length <= 12 || i % Math.ceil(rows.length / 12) === 0 ? r.label : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function niceStep(raw: number) {
  if (raw <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
