import { cn } from "@/lib/utils";

/** Marks an admin-made rival on leaderboards, so learners can tell rivals from real people. */
export function RivalBadge({ className }: { className?: string }) {
  return (
    <span
      title="A practice rival, not a real learner"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-muted px-1.5 py-px align-middle text-[10px] font-bold uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      Rival
    </span>
  );
}
