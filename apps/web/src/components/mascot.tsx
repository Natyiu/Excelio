"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Gridley, the course mascot: a smiling spreadsheet with an Excel "X" tab, leafy tufts,
 * arms and sneakers (the same character as the logo).
 *
 * Drawn as SVG so each part moves on its own. Every mood is a pose plus several looping
 * motions (see the mascot-* keyframes in index.css), so nothing is ever static:
 *
 *   teach   pointer taps the air, holds the Excel notebook   (lesson notes)
 *   think   hand on chin, eyes up, question marks drift up   (questions)
 *   cheer   arms up, jumps, sparkles                          (correct answer)
 *   oops    scratches head, sweat drop, wobbles               (wrong answer)
 *   sad     droopy arms, frown, a tear rolls down             (lost streak, failed)
 *   trophy  holds a trophy overhead, confetti                 (lesson complete, achievements)
 *   wave    waves hello                                       (dashboard, greetings)
 *   idle    swings arms, taps a foot, blinks                  (anywhere else)
 *
 * Interactive: the eyes follow the pointer, hovering makes it lean in, and clicking makes it
 * jump with a happy face.
 */
export type MascotMood = "teach" | "think" | "cheer" | "oops" | "sad" | "trophy" | "wave" | "idle";

const INK = "#10251a";
// Arms, legs and the pointer follow the theme so they stay visible on dark backgrounds.
const LIMB: CSSProperties = { stroke: "var(--mascot-limb, #10251a)" };
// The body takes the surrounding brand colour, so inside a chapter it wears that chapter's
// colour (the dashboard overrides --brand / --brand-deep per chapter); elsewhere it's green.
// CSS variables only work through `style`, not SVG presentation attributes.
const GREEN = "var(--brand, #1f9d55)";
const GREEN_DEEP = "var(--brand-deep, #0f6a37)";
const GREEN_DARKEST = "color-mix(in oklab, var(--brand-deep, #0f6a37) 75%, black)";
const PAPER = "#f4fbf6";
const GRID = "color-mix(in oklab, var(--brand, #1f9d55) 22%, white)";

/** Rotate a group around a point in the SVG's own coordinates. */
const pivot = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" });

const HAPPY: MascotMood[] = ["cheer", "trophy"];

function Glove({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={INK} strokeWidth={2.5} />
      <path d={`M${x - r * 0.45} ${y - r * 0.2} q${r * 0.3} ${-r * 0.35} ${r * 0.6} 0`} stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.55} />
    </g>
  );
}

function Arm({ d }: { d: string }) {
  return <path d={d} style={LIMB} strokeWidth={8} fill="none" strokeLinecap="round" />;
}

function Shoe({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y={207} width={46} height={22} rx={11} style={{ fill: GREEN, stroke: GREEN_DEEP }} strokeWidth={2.5} />
      <rect x={x - 3} y={223} width={52} height={10} rx={5} fill="#fff" style={{ stroke: GREEN_DEEP }} strokeWidth={2.5} />
      <path d={`M${x + 14} 213 h12 M${x + 16} 218 h12`} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

/** Legs and sneakers. Idle and wave tap a foot; cheer and trophy kick both. */
function Legs({ mood }: { mood: MascotMood }) {
  const happy = HAPPY.includes(mood);
  return (
    <>
      <g className={happy ? "mascot-kick" : undefined} style={pivot(100, 180)}>
        <path d="M100 178 L96 210" style={LIMB} strokeWidth={8} strokeLinecap="round" />
        <Shoe x={73} />
      </g>
      <g className={happy ? "mascot-kick mascot-delay-1" : "mascot-foot"} style={pivot(142, 180)}>
        <path d="M140 178 L146 210" style={LIMB} strokeWidth={8} strokeLinecap="round" />
        <Shoe x={125} />
      </g>
    </>
  );
}

function Eyes({ mood, look }: { mood: MascotMood; look: { x: number; y: number } }) {
  if (HAPPY.includes(mood)) {
    // Happy closed eyes.
    return (
      <g stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round">
        <path d="M94 112 Q104 99 114 112" />
        <path d="M132 112 Q142 99 152 112" />
      </g>
    );
  }
  // Each mood has a resting gaze; the pointer nudges it.
  const base = mood === "think" ? { x: 3, y: -5 } : mood === "oops" ? { x: -2, y: 2 } : mood === "sad" ? { x: 0, y: 4 } : { x: 0, y: 0 };
  const dx = base.x + look.x;
  const dy = base.y + look.y;
  const ry = mood === "sad" ? 10 : 12;
  return (
    <g className="mascot-blink" style={pivot(123, 110)}>
      {[104, 142].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={110} rx={11} ry={ry + 2} fill="#fff" stroke={INK} strokeWidth={2.5} />
          <g style={{ transform: `translate(${dx}px, ${dy}px)`, transition: "transform 120ms ease-out" }}>
            <ellipse cx={cx} cy={111} rx={7.5} ry={ry - 3} fill={INK} />
            <circle cx={cx + 2.5} cy={106} r={2.8} fill="#fff" />
          </g>
        </g>
      ))}
    </g>
  );
}

function Brows({ mood }: { mood: MascotMood }) {
  const d =
    mood === "sad" || mood === "oops"
      ? ["M92 92 Q102 84 114 88", "M132 88 Q144 84 154 92"] // worried: inner ends up
      : mood === "think"
        ? ["M92 90 Q103 86 114 90", "M132 84 Q143 76 154 82"] // one brow raised
        : HAPPY.includes(mood)
          ? ["M92 88 Q103 78 114 86", "M132 86 Q143 78 154 88"]
          : ["M92 90 Q103 80 114 87", "M132 87 Q143 80 154 90"];
  return (
    <g stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" className="mascot-brow" style={pivot(123, 88)}>
      <path d={d[0]} />
      <path d={d[1]} />
    </g>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "think":
      return <ellipse cx={128} cy={140} rx={5} ry={6} fill="#5b1a1a" className="mascot-hum" style={pivot(128, 140)} />;
    case "oops":
      return <path d="M108 142 Q115 136 122 142 Q129 148 136 142" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
    case "sad":
      return <path d="M108 146 Q122 132 136 146" stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
    case "cheer":
    case "trophy":
      return (
        <g className="mascot-hum" style={pivot(122, 136)}>
          <path d="M100 128 Q122 162 144 128 Z" fill="#5b1a1a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <ellipse cx={122} cy={144} rx={10} ry={5.5} fill="#ff7b84" />
        </g>
      );
    default:
      return (
        <g className="mascot-hum" style={pivot(122, 134)}>
          <path d="M106 128 Q122 152 138 128 Z" fill="#5b1a1a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <ellipse cx={122} cy={141} rx={8} ry={4.5} fill="#ff7b84" />
        </g>
      );
  }
}

/** The spreadsheet body and face, matching the logo. */
function Body({ mood, look }: { mood: MascotMood; look: { x: number; y: number } }) {
  // Unique per instance so several mascots on one page don't share a clip path.
  const clipId = `gridley-${useId().replace(/:/g, "")}`;
  return (
    <g>
      {/* leafy tufts on top */}
      <g className="mascot-tuft" style={{ ...pivot(130, 46), fill: GREEN, stroke: GREEN_DEEP }} strokeWidth={2.5} strokeLinejoin="round">
        <path d="M112 46 Q104 26 116 14 Q122 30 122 46 Z" />
        <path d="M124 46 Q124 22 140 12 Q140 32 134 46 Z" />
        <path d="M136 46 Q146 28 162 26 Q154 40 146 48 Z" />
      </g>

      {/* green frame */}
      <rect x={55} y={42} width={132} height={138} rx={26} style={{ fill: GREEN, stroke: GREEN_DEEP }} strokeWidth={4} />
      {/* the sheet inside */}
      <clipPath id={clipId}>
        <rect x={66} y={53} width={110} height={116} rx={17} />
      </clipPath>
      <rect x={66} y={53} width={110} height={116} rx={17} fill={PAPER} />
      <g clipPath={`url(#${clipId})`} style={{ stroke: GRID }} strokeWidth={2}>
        {[93, 121, 149].map((x) => (
          <line key={x} x1={x} y1={53} x2={x} y2={169} />
        ))}
        {[82, 111, 140].map((y) => (
          <line key={y} x1={66} y1={y} x2={176} y2={y} />
        ))}
      </g>
      <rect x={66} y={53} width={110} height={116} rx={17} fill="none" style={{ stroke: GREEN_DEEP }} strokeWidth={2} opacity={0.5} />

      {/* Excel "X" tab, top-left */}
      <g className="mascot-tab" style={pivot(62, 62)}>
        <rect x={38} y={36} width={42} height={42} rx={9} style={{ fill: GREEN_DEEP, stroke: GREEN_DARKEST }} strokeWidth={2.5} transform="rotate(-8 59 57)" />
        <path d="M50 47 l17 20 M67 47 l-17 20" stroke="#fff" strokeWidth={5} strokeLinecap="round" transform="rotate(-8 59 57)" />
      </g>

      {/* face */}
      <Brows mood={mood} />
      <Eyes mood={mood} look={look} />
      <Mouth mood={mood} />
      {(HAPPY.includes(mood) || mood === "wave" || mood === "idle") && (
        <g fill="#ff9aa2" opacity={0.55} className="mascot-blush">
          <ellipse cx={86} cy={132} rx={7} ry={4} />
          <ellipse cx={160} cy={132} rx={7} ry={4} />
        </g>
      )}
      {mood === "sad" && (
        <path className="mascot-tear" d="M96 122 Q91 132 96 136 Q101 132 96 122 Z" fill="#8fd3ff" stroke="#2b8fd6" strokeWidth={1.5} />
      )}
    </g>
  );
}

function Notebook() {
  return (
    <g transform="rotate(-8 52 150)">
      <rect x={24} y={118} width={52} height={66} rx={6} fill="#ece6d6" stroke={INK} strokeWidth={2.5} />
      <rect x={24} y={118} width={8} height={66} rx={3} style={{ fill: GREEN_DEEP }} />
      {[34, 44, 54, 64].map((x) => (
        <circle key={x} cx={x} cy={118} r={3.5} fill="none" stroke={INK} strokeWidth={2} />
      ))}
      <rect x={40} y={138} width={26} height={26} rx={4} style={{ fill: GREEN }} />
      <path d="M47 145 l12 12 M59 145 l-12 12" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}

function Trophy() {
  return (
    <g>
      <path d="M100 6 H142 V20 Q142 44 121 48 Q100 44 100 20 Z" fill="#ffb01f" stroke="#e46f00" strokeWidth={2.5} />
      <path d="M100 12 Q86 12 88 24 Q90 33 101 34 M142 12 Q156 12 154 24 Q152 33 141 34" fill="none" stroke="#e46f00" strokeWidth={3} />
      <rect x={116} y={47} width={10} height={8} fill="#ff9a00" />
      <rect x={106} y={54} width={30} height={7} rx={2} fill="#e46f00" />
      <path d="M112 14 Q113 30 121 36" stroke="#fff3c4" strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.95} />
    </g>
  );
}

/** Arms, hands and props for each pose. Every pose has at least one moving arm. */
function Pose({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "teach":
      return (
        <>
          <g className="mascot-hold" style={pivot(57, 132)}>
            <Arm d="M57 132 Q40 140 46 160" />
            <Notebook />
            <Glove x={48} y={162} />
          </g>
          <g className="mascot-point" style={pivot(185, 120)}>
            <Arm d="M185 120 Q206 120 210 100" />
            <line x1={210} y1={98} x2={234} y2={40} style={LIMB} strokeWidth={4.5} strokeLinecap="round" />
            <Glove x={210} y={100} />
          </g>
          <g className="mascot-pop" style={{ stroke: GREEN }} strokeWidth={5} strokeLinecap="round">
            <path d="M226 26 l8 -8" />
            <path d="M236 40 l10 -2" />
          </g>
        </>
      );
    case "think":
      return (
        <>
          <g className="mascot-swing-l" style={pivot(57, 132)}>
            <Arm d="M57 132 Q44 152 56 172" />
            <Glove x={58} y={172} />
          </g>
          <Arm d="M185 128 Q198 162 152 160" />
          <g className="mascot-tap" style={pivot(150, 158)}>
            <Glove x={150} y={158} r={12} />
          </g>
          <g style={{ fill: GREEN }} fontFamily="ui-rounded, system-ui, sans-serif" fontWeight={800}>
            <text x={196} y={52} fontSize={34} className="mascot-float">?</text>
            <text x={218} y={86} fontSize={22} className="mascot-float mascot-delay-1">?</text>
            <text x={186} y={20} fontSize={16} className="mascot-float mascot-delay-2">?</text>
          </g>
        </>
      );
    case "cheer":
      return (
        <>
          <g className="mascot-pump" style={pivot(57, 122)}>
            <Arm d="M57 122 Q36 100 30 70" />
            <Glove x={30} y={66} />
          </g>
          <g className="mascot-pump mascot-delay-1" style={pivot(185, 118)}>
            <Arm d="M185 118 Q206 96 212 66" />
            <Glove x={212} y={62} />
          </g>
          <g fill="#f7b928">
            <path className="mascot-sparkle" style={pivot(18, 28)} d="M18 16 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" />
            <path className="mascot-sparkle mascot-delay-1" style={pivot(226, 20)} d="M226 10 l2.5 7 7 2.5 -7 2.5 -2.5 7 -2.5 -7 -7 -2.5 7 -2.5 z" />
            <path className="mascot-sparkle mascot-delay-2" style={{ ...pivot(86, 14), fill: GREEN }} d="M86 6 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" />
          </g>
        </>
      );
    case "oops":
      return (
        <>
          <g className="mascot-swing-l" style={pivot(57, 132)}>
            <Arm d="M57 132 Q44 152 54 172" />
            <Glove x={56} y={172} />
          </g>
          <g className="mascot-scratch" style={pivot(185, 120)}>
            <Arm d="M185 120 Q208 96 188 58" />
            <Glove x={186} y={54} />
          </g>
          <path className="mascot-drip" d="M200 74 Q192 88 200 94 Q208 88 200 74 Z" fill="#8fd3ff" stroke="#2b8fd6" strokeWidth={2} />
        </>
      );
    case "sad":
      return (
        <>
          <g className="mascot-droop" style={pivot(57, 136)}>
            <Arm d="M57 136 Q46 160 52 182" />
            <Glove x={52} y={184} />
          </g>
          <g className="mascot-droop mascot-delay-1" style={pivot(185, 136)}>
            <Arm d="M185 136 Q196 160 190 182" />
            <Glove x={190} y={184} />
          </g>
          {/* little rain cloud */}
          <g className="mascot-cloud" style={pivot(204, 30)}>
            <path d="M188 38 Q186 26 198 26 Q202 16 214 22 Q226 22 224 34 Q228 40 220 42 H192 Q184 42 188 38 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth={2} />
            <path className="mascot-rain" d="M198 48 v6 M208 48 v6 M218 48 v6" stroke="#60a5fa" strokeWidth={2.5} strokeLinecap="round" />
          </g>
        </>
      );
    case "trophy":
      return (
        <>
          <g className="mascot-raise" style={pivot(120, 60)}>
            {/* arms go up around the outside of the body, not across the face */}
            <Arm d="M57 112 Q24 58 98 36" />
            <Arm d="M185 112 Q218 58 144 36" />
            <Trophy />
            <Glove x={98} y={38} />
            <Glove x={144} y={38} />
          </g>
          {[
            { x: 22, y: 40, c: "#f7b928", d: 0 },
            { x: 210, y: 30, c: GREEN, d: 1 },
            { x: 36, y: 96, c: GREEN_DEEP, d: 2 },
            { x: 222, y: 92, c: "#ff6b6b", d: 1 },
          ].map((p, i) => (
            <rect key={i} x={p.x} y={p.y} width={8} height={4} rx={1} className={cn("mascot-confetti", p.d && `mascot-delay-${p.d}`)} style={{ ...pivot(p.x + 4, p.y + 2), fill: p.c }} />
          ))}
        </>
      );
    case "wave":
      return (
        <>
          <g className="mascot-swing-l" style={pivot(57, 132)}>
            <Arm d="M57 132 Q44 152 54 172" />
            <Glove x={56} y={172} />
          </g>
          <g className="mascot-wave" style={pivot(185, 118)}>
            <Arm d="M185 118 Q210 110 216 76" />
            <Glove x={216} y={72} r={12} />
          </g>
        </>
      );
    default:
      return (
        <>
          <g className="mascot-swing-l" style={pivot(57, 132)}>
            <Arm d="M57 132 Q44 152 54 172" />
            <Glove x={56} y={172} />
          </g>
          <g className="mascot-swing-r" style={pivot(185, 132)}>
            <Arm d="M185 132 Q198 152 188 172" />
            <Glove x={186} y={172} />
          </g>
        </>
      );
  }
}

const MOTION: Record<MascotMood, string> = {
  teach: "mascot-bob",
  think: "mascot-sway",
  cheer: "mascot-jump",
  oops: "mascot-wobble",
  sad: "mascot-sigh",
  trophy: "mascot-jump",
  wave: "mascot-bob",
  idle: "mascot-bob",
};

/** How far (in SVG units) the pupils follow the pointer. */
const LOOK_RANGE = 3.5;

export function Mascot({
  mood = "idle",
  size = 120,
  className,
  faceOnly = false,
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** Just the head: face, eyes, blinking and bobbing, no arms, hands or legs. Cropped to fill `size`. */
  faceOnly?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);
  const [boing, setBoing] = useState(0);

  // Eyes follow the pointer anywhere on the page.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height * 0.45);
        const dist = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, dist / 240);
        setLook({ x: (dx / dist) * LOOK_RANGE * k, y: (dy / dist) * LOOK_RANGE * k });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // A click plays a happy jump, then returns to the mood.
  useEffect(() => {
    if (!boing) return;
    const t = setTimeout(() => setBoing(0), 900);
    return () => clearTimeout(t);
  }, [boing]);

  const shown: MascotMood = boing ? "cheer" : mood;

  return (
    <svg
      ref={ref}
      viewBox={faceOnly ? "32 -8 166 196" : "0 0 240 250"}
      width={size}
      height={faceOnly ? (size * 196) / 166 : (size * 250) / 240}
      role="img"
      aria-label="Gridley, the spreadsheet mascot"
      className={cn("shrink-0 cursor-pointer touch-manipulation overflow-visible", className)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={() => setBoing((n) => n + 1)}
    >
      {!faceOnly && (
        <ellipse cx={120} cy={240} rx={58} ry={7} fill="#000" opacity={0.18} className="mascot-shadow" style={pivot(120, 240)} />
      )}
      {/* `key` restarts the pop-in whenever the mood changes */}
      <g key={mood} className="mascot-enter" style={pivot(120, 240)}>
        <g key={boing} className={boing ? "mascot-boing" : hover ? "mascot-lean" : undefined} style={pivot(120, 236)}>
          <g className={MOTION[shown]} style={pivot(120, 236)}>
            {!faceOnly && <Legs mood={shown} />}
            <g transform="rotate(-3 120 110)">
              <Body mood={shown} look={look} />
            </g>
            {faceOnly ? (
              // No hands to hold it, so the trophy rests on the head
              mood === "trophy" && (
                <g transform="translate(0 -12)">
                  <Trophy />
                </g>
              )
            ) : (
              <Pose mood={shown} />
            )}
          </g>
        </g>
      </g>
    </svg>
  );
}

/** The mascot with a speech bubble. The bubble re-animates whenever the message changes. */
export function MascotSays({
  mood = "idle",
  size = 96,
  children,
  className,
  bubbleClassName,
}: {
  mood?: MascotMood;
  size?: number;
  children: ReactNode;
  className?: string;
  bubbleClassName?: string;
}) {
  return (
    <div className={cn("flex items-end gap-3", className)}>
      <Mascot mood={mood} size={size} />
      <div
        className={cn(
          "relative mb-4 min-w-0 rounded-2xl border-2 border-border bg-card px-4 py-3 text-[15px] font-medium leading-snug animate-in fade-in zoom-in-95 slide-in-from-left-2 duration-300",
          // tail pointing at the mascot
          "before:absolute before:-left-[9px] before:bottom-4 before:h-4 before:w-4 before:rotate-45 before:border-b-2 before:border-l-2 before:border-border before:bg-card",
          bubbleClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
