import { LeaderboardView, type LeaderboardPeriod } from "@/components/leaderboard-view";
import { getLeaderboard } from "@/lib/actions/excel-learning";

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams;
  // Old links used weekly/alltime/longest
  const period: LeaderboardPeriod = sp.period === "xp" || sp.period === "alltime" ? "xp" : "current";
  return <LeaderboardView board={await getLeaderboard(period)} period={period} />;
}
