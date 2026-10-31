import type { CSSProperties } from "react";
import Link from "next/link";
import { CrownIcon } from "@hugeicons/react";
import { getLeaderboard } from "@/lib/actions/excel-learning";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mascot } from "@/components/mascot";
import { Panel, SectionTitle } from "@/components/game-ui";
import { cn } from "@/lib/utils";

interface LeaderboardPageProps {
  searchParams: Promise<{ period?: "weekly" | "alltime" }>;
}

type Entry = Awaited<ReturnType<typeof getLeaderboard>>[number];

const PERIODS = [
  { id: "weekly", label: "This week" },
  { id: "alltime", label: "All time" },
] as const;

// Gold, silver and bronze for the podium.
const PODIUM = [
  { place: 1, medal: "#f5b301", medalDeep: "#b07d00", height: "h-32" },
  { place: 2, medal: "#b8c2cc", medalDeep: "#7d8790", height: "h-24" },
  { place: 3, medal: "#d9822b", medalDeep: "#9a5418", height: "h-20" },
];

/** Time until the weekly reset (Sunday 00:00 UTC), e.g. "3d 4h". */
function untilReset(now = new Date()): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + ((7 - now.getUTCDay()) % 7 || 7)));
  const hours = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 3600000));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { period = "weekly" } = await searchParams;
  const board = await getLeaderboard(period);
  const me = board.find((e) => e.isCurrentUser);
  const top = board.slice(0, 3);
  const rest = board.slice(3);
  const leaderXp = board[0]?.xp || 1;

  return (
    <div className="space-y-8">
      {/* League banner */}
      <section
        style={{ "--brand": "#4f46e5", "--brand-deep": "#3730a3" } as CSSProperties}
        className="relative overflow-hidden rounded-2xl bg-brand px-6 pb-6 pt-8 text-brand-foreground"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(135deg,white_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_left,black,transparent_85%)]"
        />
        <Mascot mood={me && me.rank <= 3 ? "cheer" : "wave"} size={140} className="absolute -bottom-2 right-4 hidden sm:block" />
        <div className="relative max-w-md">
          <p className="text-[13px] font-bold uppercase tracking-wide opacity-80">
            {period === "weekly" ? "Weekly league" : "Hall of fame"}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{me ? `You're #${me.rank}` : "Join the board"}</h1>
          <p className="mt-2 text-[15px] opacity-90">
            {me ? `${me.xp.toLocaleString()} XP ${period === "weekly" ? "this week" : "in total"}.` : "Finish a lesson or a challenge to earn XP and get on the board."}
            {period === "weekly" && ` Resets in ${untilReset()}.`}
          </p>

          {/* period switch */}
          <nav className="mt-5 inline-flex rounded-full bg-black/20 p-1" aria-label="Period">
            {PERIODS.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/leaderboard?period=${p.id}` as never}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  period === p.id ? "bg-white text-brand-deep shadow-[0_2px_0_rgb(0_0_0/0.2)]" : "text-white/80 hover:text-white"
                )}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Podium: 2nd, 1st, 3rd */}
      <section>
        <SectionTitle>Top three</SectionTitle>
        <div className="grid grid-cols-3 items-end gap-3 pt-6">
          {[1, 0, 2].map((i) => (
            <PodiumSpot key={i} entry={top[i]} spot={PODIUM[i]!} />
          ))}
        </div>
      </section>

      {/* Everyone else */}
      {(rest.length > 0 || (me && me.rank > 3)) && (
        <section>
          <SectionTitle>Rankings</SectionTitle>
          <Panel className="divide-y divide-border overflow-hidden">
            {rest.map((e) => (
              <Row key={e.userId} entry={e} leaderXp={leaderXp} />
            ))}
          </Panel>
        </section>
      )}

      {!me && board.length > 0 && (
        <Panel className="flex items-center gap-4 border-dashed p-4">
          <span className="w-8 text-center text-lg font-bold text-muted-foreground">–</span>
          <span className="min-w-0 flex-1 font-bold">You</span>
          <span className="text-sm text-muted-foreground">
            {board.length >= 50
              ? `Earn ${(board[board.length - 1]?.xp ?? 0) + 1} XP to get on the board`
              : "Earn any XP to get on the board"}
          </span>
        </Panel>
      )}
    </div>
  );
}

function PodiumSpot({ entry, spot }: { entry?: Entry; spot: (typeof PODIUM)[number] }) {
  return (
    <div className="flex flex-col items-center">
      {entry ? (
        <>
          <div className="relative">
            <Avatar className={cn("border-4", spot.place === 1 ? "h-20 w-20" : "h-16 w-16")} style={{ borderColor: spot.medal }}>
              <AvatarImage src={entry.avatarUrl || undefined} />
              <AvatarFallback className="bg-muted text-lg font-bold">{initials(entry.displayName)}</AvatarFallback>
            </Avatar>
            {spot.place === 1 && (
              <CrownIcon aria-hidden className="absolute -top-6 left-1/2 h-7 w-7 -translate-x-1/2" style={{ color: spot.medal }} />
            )}
          </div>
          <p className={cn("mt-2 max-w-full truncate px-1 text-center font-bold", entry.isCurrentUser && "text-brand")}>
            {entry.isCurrentUser ? "You" : entry.displayName}
          </p>
          <p className="text-sm font-semibold tabular-nums text-muted-foreground">{entry.xp.toLocaleString()} XP</p>
        </>
      ) : (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed border-border text-2xl text-muted-foreground">
            +
          </span>
          <p className="mt-2 font-semibold text-muted-foreground">Open spot</p>
          <p className="text-sm text-muted-foreground/70">&nbsp;</p>
        </>
      )}
      {/* the step */}
      <div
        className={cn("mt-3 flex w-full items-start justify-center rounded-t-2xl pt-3", spot.height)}
        style={{ background: entry ? spot.medal : "var(--muted)", boxShadow: entry ? `inset 0 -6px 0 ${spot.medalDeep}` : undefined }}
      >
        <span className={cn("text-3xl font-black", entry ? "text-white/90" : "text-muted-foreground/60")}>{spot.place}</span>
      </div>
    </div>
  );
}

function Row({ entry: e, leaderXp }: { entry: Entry; leaderXp: number }) {
  return (
    <div className={cn("flex items-center gap-4 px-4 py-3", e.isCurrentUser && "bg-brand-soft")}>
      <span className="w-8 text-center text-lg font-bold tabular-nums text-muted-foreground">{e.rank}</span>
      <Avatar className="h-11 w-11">
        <AvatarImage src={e.avatarUrl || undefined} />
        <AvatarFallback className="bg-muted text-sm font-bold">{initials(e.displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-bold", e.isCurrentUser && "text-brand")}>
          {e.displayName}
          {e.isCurrentUser && <span className="ml-2 text-sm font-semibold text-muted-foreground">(you)</span>}
        </p>
        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(4, (e.xp / leaderXp) * 100)}%` }} />
        </span>
      </div>
      <span className="shrink-0 font-bold tabular-nums">{e.xp.toLocaleString()} XP</span>
    </div>
  );
}
