import { LeaderboardView } from "@/components/leaderboard-view";
import { getPublicLeaderboard } from "@/lib/actions/excel-learning";

export default async function GuestLeaderboardPage() {
  const board = await getPublicLeaderboard().catch(() => []);
  return <LeaderboardView board={board} period="current" />;
}
