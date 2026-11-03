import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown the instant someone clicks through to a page that's still loading on the server,
 * so it's obvious the click worked (see the loading.tsx files under app/).
 */
export function PageLoading({ variant = "list" }: { variant?: "list" | "lesson" | "sheet" }) {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading…</span>
      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
        <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-brand/25 border-t-brand" />
        Loading…
      </div>

      {variant === "lesson" ? (
        <>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <div className="flex justify-end">
            <Skeleton className="h-12 w-36 rounded-2xl" />
          </div>
        </>
      ) : variant === "sheet" ? (
        <>
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-[420px] w-full rounded-2xl" />
        </>
      ) : (
        <>
          <Skeleton className="h-40 w-full rounded-2xl" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-5 px-2">
              <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
              <Skeleton className="h-6 flex-1" />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
