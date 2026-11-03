"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Instant feedback for in-app navigation: a progress bar along the top of the window,
 * and the clicked link is dimmed and ignores repeat clicks
 * until the new page arrives. Without this, slow server pages give no sign a click
 * registered, so people click again.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const pendingLink = useRef<HTMLAnchorElement | null>(null);

  // Dim the clicked link, show a busy cursor and ignore repeat clicks while its page loads.
  const markPending = (a: HTMLAnchorElement) => {
    a.setAttribute("data-nav-pending", "");
    a.dataset.navPrevStyle = a.getAttribute("style") ?? "";
    a.style.opacity = "0.65";
    a.style.pointerEvents = "none";
    a.style.cursor = "progress";
    a.style.transition = "opacity 120ms ease";
  };
  const unmarkPending = () => {
    const a = pendingLink.current;
    if (!a) return;
    const prev = a.dataset.navPrevStyle;
    if (prev) a.setAttribute("style", prev);
    else a.removeAttribute("style");
    delete a.dataset.navPrevStyle;
    a.removeAttribute("data-nav-pending");
    pendingLink.current = null;
  };

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const done = () => {
    clearTimers();
    unmarkPending();
    setProgress((p) => (p === null ? null : 100));
    timers.current.push(window.setTimeout(() => setProgress(null), 250));
  };

  // The new page has rendered.
  useEffect(() => {
    if (pendingLink.current || progress !== null) done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (or just a #hash jump): nothing to wait for.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (url.pathname.startsWith("/api/")) return;

      clearTimers();
      unmarkPending();
      markPending(a);
      pendingLink.current = a;
      // Creep forward so it always looks alive, never quite finishing on its own.
      setProgress(12);
      ([[150, 35], [500, 55], [1200, 72], [2500, 85], [5000, 92]] as const).forEach(([ms, v]) =>
        timers.current.push(window.setTimeout(() => setProgress((p) => (p === null ? p : Math.max(p, v))), ms))
      );
      // Safety net: never leave a link stuck (e.g. navigation cancelled or redirected back).
      timers.current.push(window.setTimeout(done, 10000));
    };
    // Back/forward buttons
    const onPop = () => done();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (progress === null) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-brand shadow-[0_0_10px_var(--brand)] transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
