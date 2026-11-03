import { getAdminFeedback } from "@/lib/actions/feedback";
import { FEEDBACK_CATEGORIES } from "@/lib/feedback-categories";
import { FeedbackCard } from "./feedback-card";
import { FeedbackFilters, type Show } from "./feedback-filters";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

/** Learner feedback: filter it, read it, reply under each message. */
export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; type?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const show: Show = sp.show === "not-replied" || sp.show === "replied" ? sp.show : "all";
  const type = FEEDBACK_CATEGORIES.some((c) => c.value === sp.type) ? sp.type! : "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const data = await getAdminFeedback({
    page,
    limit: PAGE_SIZE,
    category: type,
    replied: show === "not-replied" ? "no" : show === "replied" ? "yes" : undefined,
  }).catch(() => null);

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (show !== "all") q.set("show", show);
    if (type !== "all") q.set("type", type);
    if (p > 1) q.set("page", String(p));
    return `/admin/feedback${q.size ? `?${q}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">Feedback</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Reply under any message. The learner gets a notification.</p>
      </div>

      <FeedbackFilters show={show} type={type} total={data?.total ?? 0} />

      {!data ? (
        <p className="rounded-2xl bg-muted/50 p-6 text-sm text-muted-foreground">Couldn&apos;t load feedback. Check the database connection.</p>
      ) : data.feedback.length === 0 ? (
        <div className="rounded-2xl bg-muted/50 py-16 text-center text-sm text-muted-foreground">
          {show === "not-replied" ? "All caught up. Every message has a reply 🎉" : "No feedback here yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {data.feedback.map((item) => (
            <FeedbackCard
              key={`${item.id}:${item.updatedAt.toISOString()}`}
              item={{
                id: item.id,
                category: item.category,
                message: item.message,
                status: item.status,
                adminNote: item.adminNote,
                createdAt: item.createdAt.toISOString(),
                user: item.user,
              }}
            />
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.currentPage} of {data.pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1) as never} className="rounded-full border px-4 py-1.5 font-medium hover:bg-muted">
                ← Newer
              </Link>
            )}
            {page < data.pages && (
              <Link href={pageHref(page + 1) as never} className="rounded-full border px-4 py-1.5 font-medium hover:bg-muted">
                Older →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
