"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight01Icon as ArrowRight } from "@hugeicons/react";
import { pressable } from "@/components/game-ui";
import { Mascot } from "@/components/mascot";
import { cn } from "@/lib/utils";

/**
 * A call to action pinned to the bottom of the screen once the reader scrolls past the top.
 * It steps aside while a full CTA panel (`data-guide-cta`) is on screen, so there's never two at once.
 */
export function StickyCta() {
  const [scrolled, setScrolled] = useState(false);
  const [panelInView, setPanelInView] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setPanelInView(visible.size > 0);
    });
    document.querySelectorAll("[data-guide-cta]").forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const shown = scrolled && !panelInView;

  return (
    <div
      aria-hidden={!shown}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-300",
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border-2 border-b-[5px] border-border bg-card/95 p-2.5 pl-3 shadow-[0_12px_40px_-8px_rgb(0_0_0/0.3)] backdrop-blur">
        <Mascot mood="wave" size={40} faceOnly className="hidden min-[400px]:block" />
        <p className="min-w-0 flex-1 text-[14px] font-semibold leading-tight sm:text-[15px]">
          Learn it by doing it
          <span className="block text-[12px] font-medium text-muted-foreground sm:text-[13px]">Free lessons in a live spreadsheet</span>
        </p>
        <Link href={"/start" as never} tabIndex={shown ? 0 : -1} className={pressable("brand", "group shrink-0 px-4 py-2.5 text-[15px] font-bold sm:px-6")}>
          Start free
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
