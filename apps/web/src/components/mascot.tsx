import { useId, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Gridley, the course mascot: a spreadsheet in glasses and sneakers.
 *
 * Drawn as SVG so each part can move on its own. Every mood is a pose plus a
 * looping motion (see the mascot-* keyframes in index.css):
 *
 *   teach   pointer taps the air, holds the Excel notebook   (lesson notes)
 *   think   hand on chin, eyes up, question marks drift up   (questions)
 *   cheer   arms up, jumps, sparkles                          (correct answer)
 *   oops    scratches head, sweat drop, sways                 (wrong answer)
 *   trophy  holds a trophy overhead, confetti                 (lesson complete, achievements)
 *   wave    waves hello                                       (dashboard, greetings)
 *   idle    gentle bob and blink                              (anywhere else)
 */
export type MascotMood = "teach" | "think" | "cheer" | "oops" | "trophy" | "wave" | "idle";

const INK = "#14281d";
// Arms, legs and the pointer follow the theme so they stay visible on dark backgrounds.
const LIMB: CSSProperties = { stroke: "var(--mascot-limb, #14281d)" };
const GREEN = "#1d9a52";
const GREEN_DEEP = "#0d6b37";
const GREEN_LIGHT = "#8fe0b0";
const PAPER = "#f6fcf8";
const GRID = "#cfe8d8";

/** Rotate a group around a point in the SVG's own coordinates. */
const pivot = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" });

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
      <rect x={x} y={207} width={46} height={22} rx={11} fill={GREEN} stroke={GREEN_DEEP} strokeWidth={2.5} />
      <rect x={x - 3} y={223} width={52} height={10} rx={5} fill="#fff" stroke={GREEN_DEEP} strokeWidth={2.5} />
      <path d={`M${x + 14} 213 h12 M${x + 16} 218 h12`} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === "cheer" || mood === "trophy") {
    // Happy closed eyes behind the glasses.
    return (
      <g stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round">
        <path d="M92 108 Q101 97 110 108" />
        <path d="M132 108 Q141 97 150 108" />
      </g>
    );
  }
  const look = mood === "think" ? { dx: 4, dy: -5 } : mood === "oops" ? { dx: -3, dy: 3 } : { dx: 1, dy: 1 };
  return (
    <g className="mascot-blink" style={pivot(121, 105)}>
      {[101, 141].map((cx) => (
        <g key={cx}>
          <circle cx={cx + look.dx} cy={105 + look.dy} r={mood === "oops" ? 7.5 : 9} fill={INK} />
          <circle cx={cx + look.dx + 3} cy={101 + look.dy} r={3} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "think":
      return <ellipse cx={128} cy={136} rx={5} ry={6} fill="#5b1a1a" />;
    case "oops":
      return <path d="M107 137 Q114 131 121 137 Q128 143 135 137" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
    case "cheer":
    case "trophy":
      return (
        <g>
          <path d="M101 127 Q121 156 141 127 Z" fill="#5b1a1a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <ellipse cx={121} cy={141} rx={9} ry={5} fill="#ff6b6b" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M107 127 Q121 148 135 127 Z" fill="#5b1a1a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <ellipse cx={121} cy={138} rx={7} ry={4} fill="#ff6b6b" />
        </g>
      );
  }
}

function Body({ mood }: { mood: MascotMood }) {
  // Unique per instance so several mascots on one page don't share a clip path.
  const clipId = `gridley-${useId().replace(/:/g, "")}`;
  return (
    <g>
      <clipPath id={clipId}>
        <path d="M73 40 H165 L185 60 V162 Q185 180 167 180 H73 Q55 180 55 162 V58 Q55 40 73 40 Z" />
      </clipPath>
      {/* sheet */}
      <path d="M73 40 H165 L185 60 V162 Q185 180 167 180 H73 Q55 180 55 162 V58 Q55 40 73 40 Z" fill={PAPER} />
      <g clipPath={`url(#${clipId})`}>
        <rect x={55} y={40} width={130} height={30} fill={GREEN} />
        <rect x={55} y={165} width={130} height={15} fill={GREEN} />
        {[83, 111, 139, 167].map((x) => (
          <line key={x} x1={x} y1={70} x2={x} y2={165} stroke={GRID} strokeWidth={2} />
        ))}
        {[94, 118, 142].map((y) => (
          <line key={y} x1={55} y1={y} x2={185} y2={y} stroke={GRID} strokeWidth={2} />
        ))}
        {/* the "selected" cell */}
        <rect x={83} y={142} width={28} height={23} fill={GREEN_LIGHT} />
      </g>
      <path d="M73 40 H165 L185 60 V162 Q185 180 167 180 H73 Q55 180 55 162 V58 Q55 40 73 40 Z" fill="none" stroke={GREEN_DEEP} strokeWidth={4} strokeLinejoin="round" />
      {/* folded corner */}
      <path d="M165 40 V54 Q165 60 171 60 H185 Z" fill={GREEN_LIGHT} stroke={GREEN_DEEP} strokeWidth={3} strokeLinejoin="round" />

      {/* face */}
      <g stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round">
        {mood === "oops" ? (
          <>
            <path d="M88 82 Q100 86 112 80" />
            <path d="M130 80 Q142 86 154 82" />
          </>
        ) : (
          <>
            <path d="M88 84 Q100 74 112 81" />
            <path d="M130 81 Q142 74 154 84" />
          </>
        )}
      </g>
      <Eyes mood={mood} />
      {/* glasses */}
      <g stroke={INK} strokeWidth={4.5} fill="none">
        <circle cx={101} cy={105} r={17} fill="#ffffff" fillOpacity={0.25} />
        <circle cx={141} cy={105} r={17} fill="#ffffff" fillOpacity={0.25} />
        <path d="M118 103 Q121 99 124 103" strokeLinecap="round" />
        <path d="M84 102 L60 98 M158 102 L182 98" strokeLinecap="round" />
      </g>
      <Mouth mood={mood} />
      {(mood === "cheer" || mood === "trophy") && (
        <g fill="#ff9aa2" opacity={0.6}>
          <ellipse cx={84} cy={128} rx={7} ry={4} />
          <ellipse cx={158} cy={128} rx={7} ry={4} />
        </g>
      )}
    </g>
  );
}

function Notebook() {
  return (
    <g transform="rotate(-8 52 150)">
      <rect x={24} y={118} width={52} height={66} rx={6} fill="#ece6d6" stroke={INK} strokeWidth={2.5} />
      <rect x={24} y={118} width={8} height={66} rx={3} fill={GREEN_DEEP} />
      {[34, 44, 54, 64].map((x) => (
        <circle key={x} cx={x} cy={118} r={3.5} fill="none" stroke={INK} strokeWidth={2} />
      ))}
      <rect x={40} y={138} width={26} height={26} rx={4} fill={GREEN} />
      <path d="M47 145 l12 12 M59 145 l-12 12" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}

function Trophy() {
  return (
    <g>
      <path d="M100 6 H142 V20 Q142 44 121 48 Q100 44 100 20 Z" fill="#f7b928" stroke="#a86b00" strokeWidth={2.5} />
      <path d="M100 12 Q86 12 88 24 Q90 33 101 34 M142 12 Q156 12 154 24 Q152 33 141 34" fill="none" stroke="#a86b00" strokeWidth={3} />
      <rect x={116} y={47} width={10} height={8} fill="#d69a12" />
      <rect x={106} y={54} width={30} height={7} rx={2} fill="#a86b00" />
      <path d="M112 14 Q113 30 121 36" stroke="#fff6d5" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8} />
    </g>
  );
}

/** Arms, hands and props for each pose. Moving parts get their own animation class. */
function Pose({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "teach":
      return (
        <>
          <Arm d="M57 132 Q40 140 46 160" />
          <Notebook />
          <Glove x={48} y={162} />
          <g className="mascot-point" style={pivot(183, 120)}>
            <Arm d="M183 120 Q204 120 208 100" />
            <line x1={208} y1={98} x2={232} y2={40} style={LIMB} strokeWidth={4.5} strokeLinecap="round" />
            <Glove x={208} y={100} />
          </g>
          <g className="mascot-pop" stroke={GREEN} strokeWidth={5} strokeLinecap="round">
            <path d="M40 34 l10 10" />
            <path d="M58 20 l3 14" />
            <path d="M76 18 l-3 13" />
          </g>
        </>
      );
    case "think":
      return (
        <>
          <Arm d="M57 132 Q44 152 56 172" />
          <Glove x={58} y={172} />
          <Arm d="M183 128 Q196 160 150 158" />
          <g className="mascot-tap" style={pivot(150, 156)}>
            <Glove x={148} y={156} r={12} />
          </g>
          <g fill={GREEN} fontFamily="ui-rounded, system-ui, sans-serif" fontWeight={800}>
            <text x={192} y={52} fontSize={34} className="mascot-float">?</text>
            <text x={214} y={86} fontSize={22} className="mascot-float mascot-delay-1">?</text>
          </g>
        </>
      );
    case "cheer":
      return (
        <>
          <Arm d="M57 122 Q36 100 30 70" />
          <Glove x={30} y={66} />
          <Arm d="M183 118 Q204 96 210 66" />
          <Glove x={210} y={62} />
          <g fill="#f7b928">
            <path className="mascot-sparkle" style={pivot(18, 28)} d="M18 16 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" />
            <path className="mascot-sparkle mascot-delay-1" style={pivot(226, 20)} d="M226 10 l2.5 7 7 2.5 -7 2.5 -2.5 7 -2.5 -7 -7 -2.5 7 -2.5 z" />
            <path className="mascot-sparkle mascot-delay-2" style={pivot(120, 14)} d="M120 6 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill={GREEN} />
          </g>
        </>
      );
    case "oops":
      return (
        <>
          <Arm d="M57 132 Q44 152 54 172" />
          <Glove x={56} y={172} />
          <g className="mascot-scratch" style={pivot(183, 120)}>
            <Arm d="M183 120 Q206 96 186 58" />
            <Glove x={184} y={54} />
          </g>
          <path className="mascot-drip" d="M44 70 Q36 84 44 90 Q52 84 44 70 Z" fill="#8fd3ff" stroke="#2b8fd6" strokeWidth={2} />
        </>
      );
    case "trophy":
      return (
        <>
          <g className="mascot-raise" style={pivot(120, 60)}>
            <Arm d="M57 118 Q60 80 98 40" />
            <Arm d="M183 118 Q180 80 144 40" />
            <Trophy />
            <Glove x={98} y={38} />
            <Glove x={144} y={38} />
          </g>
          {[
            { x: 22, y: 40, c: "#f7b928", d: 0 },
            { x: 210, y: 30, c: GREEN, d: 1 },
            { x: 36, y: 96, c: "#1d9a52", d: 2 },
            { x: 222, y: 92, c: "#ff6b6b", d: 1 },
          ].map((p, i) => (
            <rect key={i} x={p.x} y={p.y} width={8} height={4} rx={1} fill={p.c} className={cn("mascot-confetti", p.d && `mascot-delay-${p.d}`)} style={pivot(p.x + 4, p.y + 2)} />
          ))}
        </>
      );
    case "wave":
      return (
        <>
          <Arm d="M57 132 Q44 152 54 172" />
          <Glove x={56} y={172} />
          <g className="mascot-wave" style={pivot(183, 118)}>
            <Arm d="M183 118 Q208 110 214 76" />
            <Glove x={214} y={72} r={12} />
          </g>
        </>
      );
    default:
      return (
        <>
          <Arm d="M57 132 Q44 152 54 172" />
          <Glove x={56} y={172} />
          <Arm d="M183 132 Q196 152 186 172" />
          <Glove x={184} y={172} />
        </>
      );
  }
}

const MOTION: Record<MascotMood, string> = {
  teach: "mascot-bob",
  think: "mascot-sway",
  cheer: "mascot-jump",
  oops: "mascot-wobble",
  trophy: "mascot-jump",
  wave: "mascot-bob",
  idle: "mascot-bob",
};

export function Mascot({ mood = "idle", size = 120, className }: { mood?: MascotMood; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 240 250"
      width={size}
      height={(size * 250) / 240}
      role="img"
      aria-label="Gridley, the spreadsheet mascot"
      className={cn("shrink-0 overflow-visible", className)}
    >
      <ellipse cx={120} cy={240} rx={58} ry={7} fill="#000" opacity={0.18} className="mascot-shadow" style={pivot(120, 240)} />
      {/* `key` restarts the pop-in whenever the mood changes */}
      <g key={mood} className="mascot-enter" style={pivot(120, 240)}>
        <g className={MOTION[mood]} style={pivot(120, 236)}>
          <path d="M101 178 L96 210 M139 178 L146 210" style={LIMB} strokeWidth={8} strokeLinecap="round" />
          <Shoe x={73} />
          <Shoe x={125} />
          <g transform="rotate(-3 120 110)">
            <Body mood={mood} />
          </g>
          <Pose mood={mood} />
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
