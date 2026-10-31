import { cn } from "@/lib/utils";

/**
 * Shared building blocks for the learner-facing dashboard: soft rounded
 * panels, pill buttons and slim progress bars in an Apple-like style.
 * Keep every /dashboard page on these so the app reads as one system.
 */

export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border-2 border-border bg-card", className)}
      {...props}
    />
  );
}

export type PressVariant = "brand" | "outline" | "ghost" | "danger";

/** className for a link or button styled as a rounded pill. */
export function pressable(variant: PressVariant = "brand", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold",
    "transition-[transform,box-shadow,filter,background-color] duration-100 disabled:pointer-events-none disabled:opacity-50",
    // 3D buttons: a darker "underside" that the button presses down into.
    variant === "brand" &&
      "bg-brand text-brand-foreground shadow-[0_4px_0_var(--brand-deep)] hover:brightness-110 active:translate-y-[4px] active:shadow-none",
    variant === "outline" &&
      "border-2 border-border bg-card text-foreground shadow-[0_4px_0_var(--border)] hover:bg-muted active:translate-y-[4px] active:shadow-none",
    variant === "ghost" && "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97]",
    variant === "danger" &&
      "bg-destructive text-white shadow-[0_4px_0_#9f1239] hover:brightness-110 active:translate-y-[4px] active:shadow-none",
    className
  );
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  className,
}: {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const bar = (
    <div className={cn("h-2.5 flex-1 overflow-hidden rounded-full bg-muted", !showLabel && className)}>
      <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${percent}%` }} />
    </div>
  );
  if (!showLabel) return bar;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {bar}
      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
        {Math.min(value, max)}/{max}
      </span>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold tracking-tight lg:text-[34px]">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <h2 className="text-xl font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

/** Icon in a soft, tinted rounded square — used for list rows, quests and badges. */
export function IconTile({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "muted" | "amber" | "sky" | "rose" | "violet";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]",
        tone === "brand" && "bg-brand-soft text-brand",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "amber" && "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
        tone === "sky" && "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
        tone === "rose" && "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
        tone === "violet" && "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Panel className="flex flex-col items-center px-6 py-14 text-center">
      <IconTile tone="muted" className="h-16 w-16 rounded-[20px]">{icon}</IconTile>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[15px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Panel>
  );
}
