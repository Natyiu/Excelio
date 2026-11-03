import { FireIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

/** A streak as the orange fire icon plus the number of days, like the stats bar. */
export function StreakCount({ days, label = false, className }: { days: number; label?: boolean; className?: string }) {
  return (
    <span
      title={`${days}-day streak`}
      className={cn("inline-flex shrink-0 items-center gap-1 font-bold tabular-nums", days > 0 ? "text-orange-500" : "text-muted-foreground", className)}
    >
      <FireIcon className="h-[1.15em] w-[1.15em]" />
      {days}
      {label && <span className="font-semibold">{days === 1 ? " day" : " days"}</span>}
    </span>
  );
}
