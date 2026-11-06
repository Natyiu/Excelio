import Link from "next/link";
import { getUserDropOffs, type UserDropOff } from "@/lib/actions/insights";
import { ACTIVE_DAYS, type DropOffBucket } from "@/lib/drop-off";
import { CHANNEL_LABEL, type Channel } from "@/lib/traffic-source";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const BUCKETS: { key: DropOffBucket; label: string; note: string }[] = [
  { key: "active", label: "Still active", note: `learned or signed up in the last ${ACTIVE_DAYS} days` },
  { key: "never_started", label: "Never started", note: "signed up, never checked an answer" },
  { key: "mid_lesson", label: "Left mid-lesson", note: "stopped partway through a lesson" },
  { key: "next_lesson", label: "Between lessons", note: "finished one, didn't try the next" },
  { key: "paywall", label: "At the paywall", note: "next lesson needs Pro" },
  { key: "finished", label: "Finished", note: "completed every visible lesson" },
];

const date = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function ago(days: number) {
  if (days <= 0) return "Today";
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function stoppedDetail(u: UserDropOff) {
  if (u.stage === "finished") return "Completed every visible lesson";
  if (u.stage === "never_started") return "Hasn't checked an answer yet";
  if (u.stage === "paywall") return "Next lesson needs Pro";
  if (u.stage === "next_lesson") return "Finished the last one, hasn't tried this one";
  const step = u.step ? `Step ${u.step} of ${u.steps}` : "Partway through";
  if (!u.wrongOnStep) return step;
  return `${step} · ${u.wrongOnStep} wrong ${u.wrongOnStep === 1 ? "try" : "tries"} there`;
}

/** Where each learner stopped: which chapter, lesson and step. */
export default async function AdminDropOffPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const users = await getUserDropOffs().catch(() => null);

  if (!users) {
    return (
      <div className="space-y-2">
        <h1 className="text-[28px] font-bold tracking-tight">Drop-off</h1>
        <p className="text-sm text-muted-foreground">Couldn&apos;t load learners. Check the database connection.</p>
      </div>
    );
  }

  const show =BUCKETS.find((b) => b.key === sp.show)?.key ?? null;
  const q = sp.q?.trim() ?? "";
  const needle = q.toLowerCase();
  const searched = needle
    ? users.filter((u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle))
    : users;
  const rows = show ? searched.filter((u) => u.bucket === show) : searched;

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1), pages);
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const href = (next: { show?: DropOffBucket | null; page?: number }) => {
    const params = new URLSearchParams();
    const nextShow = next.show === undefined ? show : next.show;
    if (nextShow) params.set("show", nextShow);
    if (q) params.set("q", q);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const query = params.toString();
    return (query ? `/admin/drop-off?${query}` : "/admin/drop-off") as never;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">Drop-off</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Where each learner stopped, based on the answers they checked and the lessons they finished. Someone who opens a
          lesson and leaves before checking an answer shows as not having started it. Admin accounts are left out.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {BUCKETS.map((b) => {
          const count = searched.filter((u) => u.bucket === b.key).length;
          const selected = show === b.key;
          return (
            <Link
              key={b.key}
              href={href({ show: selected ? null : b.key })}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "rounded-2xl bg-muted/50 p-4 transition-colors hover:bg-muted",
                selected && "bg-muted ring-2 ring-brand"
              )}
            >
              <p className="text-[13px] text-muted-foreground">{b.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{count.toLocaleString()}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{b.note}</p>
            </Link>
          );
        })}
      </div>

      <form action="/admin/drop-off" className="flex gap-2">
        {show && <input type="hidden" name="show" value={show} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          aria-label="Search learners by name or email"
          placeholder="Search by name or email"
          className="h-9 w-full max-w-sm rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button type="submit" className="h-9 rounded-xl bg-muted px-3 text-sm font-medium hover:bg-muted/70">
          Search
        </button>
      </form>

      {visible.length === 0 ? (
        <div className="rounded-2xl bg-muted/50 py-16 text-center">
          <p className="text-sm text-muted-foreground">No learners match.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-muted/50">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Stopped at</th>
                <th className="px-4 py-3 whitespace-nowrap">Came from</th>
                <th className="px-4 py-3">Lessons done</th>
                <th className="px-4 py-3 whitespace-nowrap">Last active</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {visible.map((u) => (
                <tr key={u.userId}>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {u.name}
                      {u.isPro && <span className="ml-2 rounded-xl bg-violet-600 px-1.5 py-0.5 text-[12px] font-semibold text-white">Pro</span>}
                    </p>
                    <p className="text-[13px] text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.lesson && (
                      <p className="font-medium">
                        Chapter {u.lesson.chapter}: {u.lesson.title}
                      </p>
                    )}
                    <p className="text-[13px] text-muted-foreground">{stoppedDetail(u)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.cameFrom ? (
                      <>
                        <p className="font-medium">{u.cameFrom.source}</p>
                        <p className="text-[13px] text-muted-foreground">
                          {[u.cameFrom.channel === "direct" ? null : CHANNEL_LABEL[u.cameFrom.channel as Channel], u.cameFrom.campaign]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {u.lessonsDone} / {u.lessonsTotal}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {u.lastActive && u.daysSinceActive !== null ? (
                      <span title={date(u.lastActive)}>{ago(u.daysSinceActive)}</span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                    {u.bucket === "active" && (
                      <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[12px] font-medium text-brand-foreground">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{date(u.signedUpAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <p>
            Page {page} of {pages} · {rows.length.toLocaleString()} learners
          </p>
          <div className="flex gap-3 font-medium text-foreground">
            {page > 1 && <Link href={href({ page: page - 1 })}>← Previous</Link>}
            {page < pages && <Link href={href({ page: page + 1 })}>Next →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
