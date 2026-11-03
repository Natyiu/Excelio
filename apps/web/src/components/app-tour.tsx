"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Cancel01Icon as Close } from "@hugeicons/react";
import { Mascot, type MascotMood } from "@/components/mascot";
import { pressable } from "@/components/game-ui";
import { cn } from "@/lib/utils";

/**
 * A guided tour of the learner dashboard. It walks through every main feature, moving to
 * each page and spotlighting the part being described.
 *
 * Targets are marked in the markup with `data-tour="<name>"`, or `data-tour-nav="<href>"`
 * for nav links (the sidebar on desktop, the bottom tab bar on mobile). When the same
 * target appears twice (one copy is hidden at the current width), the visible one is used.
 *
 * It starts once by itself for new accounts, and can be replayed from the More page with
 * `startAppTour()`.
 */

type Step = {
  /** Page the step is shown on. "/dashboard" matches exactly; anything else matches as a prefix. */
  path: string;
  /** What to spotlight. Leave it out for a centred card. */
  target?: { tour: string } | { nav: string };
  /** Skip this step when its target isn't on screen (some panels only show on wide screens). */
  optional?: boolean;
  title: string;
  body: string;
  mood: MascotMood;
};

const STEPS: Step[] = [
  {
    path: "/dashboard",
    title: "Welcome to Excelio!",
    body: "Here's a quick look around. It takes about a minute, and you can skip it at any time.",
    mood: "wave",
  },
  {
    path: "/dashboard",
    target: { tour: "chapter" },
    title: "Your learning path",
    body: "The course is split into chapters, from Beginner to Advanced. Open a chapter's Guidebook for short notes on what it covers.",
    mood: "teach",
  },
  {
    path: "/dashboard",
    target: { tour: "up-next" },
    title: "Your next lesson",
    body: "Lessons unlock one at a time. Each takes a few minutes in a real spreadsheet and earns XP.",
    mood: "teach",
  },
  {
    path: "/dashboard",
    target: { tour: "stats" },
    optional: true,
    title: "Streak, XP and time",
    body: "The flame counts the days in a row you've learned. The bolt is your total XP, and the clock shows minutes learned today.",
    mood: "idle",
  },
  {
    path: "/dashboard",
    target: { tour: "quests" },
    optional: true,
    title: "Daily quests",
    body: "Three small goals every day. Earn some XP today to keep your streak alive.",
    mood: "think",
  },
  {
    path: "/dashboard",
    target: { tour: "leaderboard-card" },
    optional: true,
    title: "Streak leaderboard",
    body: "See how your streak compares with other learners. Keep learning every day to climb.",
    mood: "cheer",
  },
  {
    path: "/dashboard/practice",
    target: { nav: "/dashboard/practice" },
    title: "Practice studio",
    body: "A free workbook with no scoring. Open a ready-made sheet or start from a blank grid and try anything.",
    mood: "idle",
  },
  {
    path: "/dashboard/daily-challenge",
    target: { nav: "/dashboard/daily-challenge" },
    title: "Challenges",
    body: "Real-world Excel problems, checked live. Clear them to prove what you know and earn extra XP.",
    mood: "trophy",
  },
  {
    path: "/dashboard/leaderboard",
    target: { nav: "/dashboard/leaderboard" },
    title: "Full leaderboard",
    body: "The top three and where you rank. Switch between daily streaks and XP.",
    mood: "cheer",
  },
  {
    path: "/dashboard/achievements",
    target: { nav: "/dashboard/achievements" },
    title: "Achievements",
    body: "Unlock trophies as you learn. Each one adds bonus XP.",
    mood: "trophy",
  },
  {
    path: "/dashboard/notifications",
    target: { nav: "/dashboard/notifications" },
    title: "Notifications",
    body: "News and updates land here. A red badge shows how many you haven't read.",
    mood: "idle",
  },
  {
    path: "/dashboard/profile",
    target: { nav: "/dashboard/profile" },
    title: "Your profile",
    body: "Your level, XP, streaks and progress, all in one place.",
    mood: "wave",
  },
  {
    path: "/dashboard/more",
    target: { nav: "/dashboard/more" },
    title: "More",
    body: "Edit your profile, change account settings and send us feedback. You can replay this tour from here too.",
    mood: "idle",
  },
  {
    path: "/dashboard",
    target: { tour: "theme" },
    optional: true,
    title: "Light or dark",
    body: "Switch between light and dark mode whenever you like.",
    mood: "idle",
  },
  {
    path: "/dashboard",
    target: { tour: "up-next" },
    title: "You're all set!",
    body: "That's everything. Start your first lesson whenever you're ready.",
    mood: "cheer",
  },
];

const START_EVENT = "excelio:start-tour";
/** Accounts newer than this see the tour by themselves. Older accounts can replay it from More. */
const AUTO_START_DAYS = 14;
const PAD = 8; // space between the spotlight and the element
const GAP = 14; // space between the spotlight and the card
const GUTTER = 16;
const CARD_W = 360;

/** Replays the tour from the first step. */
export function startAppTour() {
  window.dispatchEvent(new Event(START_EVENT));
}

const storageKey = (userId: string) => `excelio:tour-done:v1:${userId}`;

function readDone(userId: string) {
  try {
    return window.localStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return false;
  }
}

function writeDone(userId: string) {
  try {
    window.localStorage.setItem(storageKey(userId), "1");
  } catch {
    // Private mode or blocked storage: the tour may show again next time, which is fine.
  }
}

const onPage = (pathname: string, path: string) =>
  path === "/dashboard" ? pathname === "/dashboard" : pathname === path || pathname.startsWith(`${path}/`);

function findTarget(step: Step): HTMLElement | null {
  if (!step.target) return null;
  const selector =
    "tour" in step.target ? `[data-tour="${step.target.tour}"]` : `[data-tour-nav="${step.target.nav}"]`;
  // Pick the copy that's actually showing (e.g. sidebar link on desktop, tab bar on mobile).
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

type Box = { top: number; left: number; width: number; height: number };

const sameBox = (a: Box | null, b: Box | null) =>
  a === b ||
  (!!a && !!b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5);

export function AppTour({ userId, createdAt }: { userId: string; createdAt?: Date | string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  // Which way we're moving, so optional steps are skipped in the right direction.
  const [dir, setDir] = useState<1 | -1>(1);
  // The step whose target has been located (null while moving between pages).
  const [ready, setReady] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [cardH, setCardH] = useState(240);
  const targetRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

  const close = useCallback(() => {
    writeDone(userId);
    setOpen(false);
    setReady(null);
    setBox(null);
    targetRef.current = null;
  }, [userId]);

  const go = useCallback(
    (delta: 1 | -1) => {
      setDir(delta);
      setReady(null);
      setBox(null);
      setIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)));
    },
    []
  );

  // Start by itself once for new accounts, on the Learn page.
  useEffect(() => {
    if (pathname !== "/dashboard" || readDone(userId)) return;
    const created = createdAt ? new Date(createdAt).getTime() : NaN;
    if (!Number.isFinite(created) || Date.now() - created > AUTO_START_DAYS * 86_400_000) return;
    const t = window.setTimeout(() => {
      setIndex(0);
      setDir(1);
      setReady(null);
      setOpen(true);
    }, 700);
    return () => window.clearTimeout(t);
    // Only on first load, not on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replay requests (from the More page).
  useEffect(() => {
    const start = () => {
      setIndex(0);
      setDir(1);
      setReady(null);
      setOpen(true);
    };
    window.addEventListener(START_EVENT, start);
    return () => window.removeEventListener(START_EVENT, start);
  }, []);

  // Go to the step's page, then find and scroll to its target.
  useEffect(() => {
    if (!open) return;
    if (!onPage(pathname, step.path)) {
      router.push(step.path as never);
      return;
    }
    let cancelled = false;
    const started = Date.now();
    let timer = 0;
    const look = () => {
      if (cancelled) return;
      const el = findTarget(step);
      if (el || !step.target || Date.now() - started > (step.optional ? 800 : 2500)) {
        if (!el && step.optional) {
          // Not shown at this screen width: skip it, unless it's at either end.
          const next = index + dir;
          if (next >= 0 && next < STEPS.length) {
            setIndex(next);
            return;
          }
        }
        targetRef.current = el;
        if (el) {
          // Jump straight there, so the spotlight lands on the feature instead of chasing it.
          el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
        }
        setReady(index);
        return;
      }
      timer = window.setTimeout(look, 100);
    };
    look();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, index, dir, pathname, step, router]);

  // Follow the target as the page scrolls, resizes or animates. Layout effect, so the first
  // position is measured before paint and the card doesn't jump.
  useLayoutEffect(() => {
    if (!open || ready !== index) return;
    let raf = 0;
    const tick = () => {
      const el = targetRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
        setBox((prev) => (sameBox(prev, next) ? prev : next));
      } else {
        setBox((prev) => (prev === null ? prev : null));
      }
      const h = cardRef.current?.offsetHeight;
      if (h) setCardH((prev) => (Math.abs(prev - h) < 1 ? prev : h));
      raf = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(raf);
  }, [open, ready, index]);

  // Keyboard: Esc closes, arrows move.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") (last ? close() : go(1));
      else if (e.key === "ArrowLeft" && index > 0) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, last, close, go]);

  // Move focus to the card's main button on each step.
  useEffect(() => {
    if (open && ready === index) nextRef.current?.focus({ preventScroll: true });
  }, [open, ready, index]);

  if (!open) return null;

  const showing = ready === index;
  const spot = showing ? box : null;
  const placement = showing ? placeCard(spot, cardH) : null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="app-tour-title">
      {/* Click catcher: the page can't be used mid-tour. */}
      <div className="absolute inset-0" />

      {/* Dim with a hole around the target, or a plain dim for a centred card. */}
      {spot ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl bg-green-500/10 ring-2 ring-green-500"
          style={{ ...spot, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.6)" }}
        />
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/60 motion-safe:transition-opacity" />
      )}

      {placement && (
        <div
          ref={cardRef}
          className="absolute rounded-2xl border-2 border-border bg-card p-5 text-card-foreground shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200"
          style={placement.style}
        >
          {placement.arrow && <CardArrow {...placement.arrow} />}
          <button
            type="button"
            onClick={close}
            aria-label="Close tour"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Close className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <Mascot mood={step.mood} size={64} className="-mb-1 -mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-brand">
                Step {index + 1} of {STEPS.length}
              </p>
              <h2 id="app-tour-title" className="mt-0.5 text-lg font-bold leading-snug">
                {step.title}
              </h2>
            </div>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>

          {/* progress */}
          <div className="mt-4 flex gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= index ? "bg-brand" : "bg-muted")}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            {index === 0 ? (
              <button type="button" onClick={close} className={pressable("ghost", "px-3 py-2 text-sm")}>
                Skip tour
              </button>
            ) : (
              <button type="button" onClick={() => go(-1)} className={pressable("ghost", "px-3 py-2 text-sm")}>
                Back
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (last ? close() : go(1))}
              className={pressable("brand", "px-5 py-2 text-sm")}
            >
              {index === 0 ? "Show me around" : last ? "Start learning" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type Placement = {
  style: CSSProperties;
  /** Which edge of the card the arrow sits on (it points at the spotlight). None when centred. */
  arrow: { side: "left" | "top" | "bottom"; offset: number } | null;
};

const ARROW_EDGE = 22; // keep the arrow clear of the card's rounded corners

/** Puts the card beside, below or above the spotlight (whichever has room), or centres it. */
function placeCard(spot: Box | null, cardH: number): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_W, vw - GUTTER * 2);

  if (!spot) {
    return { style: { width, left: (vw - width) / 2, top: Math.max(GUTTER, (vh - cardH) / 2) }, arrow: null };
  }

  const clampX = (x: number) => Math.min(Math.max(GUTTER, x), vw - width - GUTTER);
  const clampY = (y: number) => Math.min(Math.max(GUTTER, y), vh - cardH - GUTTER);
  const clampArrow = (o: number, size: number) => Math.min(Math.max(ARROW_EDGE, o), size - ARROW_EDGE);
  const below = vh - (spot.top + spot.height) - GAP;
  const above = spot.top - GAP;
  const right = vw - (spot.left + spot.width) - GAP;
  const midX = spot.left + spot.width / 2;
  const midY = spot.top + spot.height / 2;

  // Narrow targets in the sidebar: put the card beside them.
  if (spot.width < vw / 3 && right >= width + GUTTER && spot.left < vw / 3) {
    const top = clampY(midY - cardH / 2);
    return {
      style: { width, left: spot.left + spot.width + GAP, top },
      arrow: { side: "left", offset: clampArrow(midY - top, cardH) },
    };
  }
  const left = clampX(midX - width / 2);
  if (below >= cardH + GUTTER || below >= above) {
    return {
      style: { width, left, top: clampY(spot.top + spot.height + GAP) },
      arrow: { side: "top", offset: clampArrow(midX - left, width) },
    };
  }
  return {
    style: { width, left, top: clampY(spot.top - GAP - cardH) },
    arrow: { side: "bottom", offset: clampArrow(midX - left, width) },
  };
}

/** A "V" on the card's edge pointing at the spotlight: a rotated square showing two borders. */
function CardArrow({ side, offset }: { side: "left" | "top" | "bottom"; offset: number }) {
  const base = "pointer-events-none absolute h-4 w-4 rotate-45 border-border bg-card";
  if (side === "left") {
    return <span aria-hidden className={cn(base, "-left-[9px] -mt-2 border-b-2 border-l-2")} style={{ top: offset }} />;
  }
  if (side === "top") {
    return <span aria-hidden className={cn(base, "-top-[9px] -ml-2 border-l-2 border-t-2")} style={{ left: offset }} />;
  }
  return <span aria-hidden className={cn(base, "-bottom-[9px] -ml-2 border-b-2 border-r-2")} style={{ left: offset }} />;
}
