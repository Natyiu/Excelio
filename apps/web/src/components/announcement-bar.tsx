"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Cancel01Icon as Close,
  ArrowRight01Icon as Arrow,
  ArrowDown01Icon as Down,
} from "@hugeicons/react";
import { TONE_STYLE, type AnnouncementView } from "@/lib/announcement-tones";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

const dismissKey = (a: Pick<AnnouncementView, "id" | "version">) => `excelio:announcement-dismissed:${a.id}:${a.version}`;

function readDismissed(a: AnnouncementView) {
  try {
    return localStorage.getItem(dismissKey(a)) === "1";
  } catch {
    return false;
  }
}

/**
 * A slim announcement strip pinned to the very top of the window, above everything.
 * It publishes its height as the CSS variable --announcement-h so sticky parts of the app
 * (sidebar, rail, mobile header) sit below it instead of under it.
 * Click the text to expand the full message. `preview` renders it in place for the admin.
 */
export function AnnouncementBar({ items, preview = false }: { items: AnnouncementView[]; preview?: boolean }) {
  const mounted = useMounted();
  const [dismissedNow, setDismissedNow] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const visible = !mounted
    ? []
    : preview
      ? items
      : items.filter((a) => !dismissedNow.includes(a.id) && !readDismissed(a));
  const a = visible[Math.min(index, visible.length - 1)];

  // Reserve space at the top of the page for the fixed strip (and release it when gone).
  useEffect(() => {
    if (preview) return;
    const root = document.documentElement;
    const el = ref.current;
    if (!el) {
      root.style.setProperty("--announcement-h", "0px");
      return;
    }
    const set = () => root.style.setProperty("--announcement-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty("--announcement-h", "0px");
    };
  }, [preview, a?.id, a?.version]);

  if (!a) return null;
  const t = TONE_STYLE[a.tone];
  const external = !!a.ctaUrl && /^https?:\/\//.test(a.ctaUrl);
  const emoji = t.kicker.split(" ")[0];

  const dismiss = () => {
    if (preview) return;
    try {
      localStorage.setItem(dismissKey(a), "1");
    } catch {
      /* private mode: dismiss just for this visit */
    }
    setDismissedNow((d) => [...d, a.id]);
    setExpanded(false);
    setIndex(0);
  };

  const ctaClass =
    "inline-flex shrink-0 items-center gap-1 rounded-full bg-white/95 px-3 py-0.5 text-[12px] font-extrabold uppercase tracking-wide shadow-[0_2px_0_rgb(0_0_0/0.2)] transition hover:bg-white active:translate-y-px active:shadow-none";
  const cta =
    a.ctaLabel && a.ctaUrl ? (
      preview ? (
        <span className={ctaClass} style={{ color: t.deep }}>
          {a.ctaLabel} <Arrow className="h-3.5 w-3.5" />
        </span>
      ) : external ? (
        <a href={a.ctaUrl} target="_blank" rel="noopener noreferrer" className={ctaClass} style={{ color: t.deep }}>
          {a.ctaLabel} <Arrow className="h-3.5 w-3.5" />
        </a>
      ) : (
        <Link href={a.ctaUrl as never} className={ctaClass} style={{ color: t.deep }}>
          {a.ctaLabel} <Arrow className="h-3.5 w-3.5" />
        </Link>
      )
    ) : null;

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Announcement"
      className={cn(
        "z-[45] w-full text-white shadow-[0_2px_8px_rgb(0_0_0/0.15)]",
        preview ? "relative overflow-hidden rounded-xl" : "fixed inset-x-0 top-0 animate-in slide-in-from-top duration-300"
      )}
      style={{ background: `linear-gradient(90deg, ${t.from}, ${t.to})` }}
    >
      <div className="mx-auto flex min-h-9 max-w-[1400px] items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] leading-tight sm:text-sm"
        >
          <span aria-hidden className="shrink-0">{emoji}</span>
          <span className="min-w-0 flex-1 truncate">
            <span className="font-extrabold">{a.title || (preview ? "Your title" : "")}</span>
            {!expanded && (a.message || preview) && (
              <span className="hidden text-white/90 sm:inline">
                <span className="mx-2 opacity-60">·</span>
                {a.message || "Your message appears here."}
              </span>
            )}
          </span>
          <Down className={cn("h-4 w-4 shrink-0 opacity-80 transition-transform", expanded && "rotate-180")} />
        </button>

        {cta}

        {visible.length > 1 && (
          <button
            type="button"
            onClick={() => {
              setIndex((i) => (i + 1) % visible.length);
              setExpanded(false);
            }}
            className="hidden shrink-0 rounded-full bg-black/15 px-2 py-0.5 text-[11px] font-bold tabular-nums hover:bg-black/25 sm:block"
            aria-label="Next announcement"
          >
            {Math.min(index, visible.length - 1) + 1}/{visible.length} ›
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/15 transition-colors hover:bg-black/30"
        >
          <Close className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="mx-auto max-w-[1400px] px-3 pb-2.5 sm:px-4">
          <p className="whitespace-pre-wrap break-words pl-6 text-[13px] leading-relaxed text-white/95 sm:text-sm">
            {a.message || (preview ? "Your message appears here." : "")}
          </p>
        </div>
      )}
    </div>
  );
}
