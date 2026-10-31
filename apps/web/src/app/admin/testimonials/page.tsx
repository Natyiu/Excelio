import { getAdminTestimonials } from "@/lib/actions/testimonials";
import { TestimonialActions } from "./testimonial-actions";

/** Approve learners' reviews before they appear on the homepage. */
export default async function AdminTestimonialsPage() {
  const items = await getAdminTestimonials();
  const waiting = items.filter((t) => !t.approved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">Testimonials</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Reviews from learners. Approved ones appear on the homepage with the name and place they gave.
          {waiting > 0 && <span className="ml-1 font-semibold text-foreground">{waiting} waiting for review.</span>}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No reviews yet. Learners are invited to write one after finishing 5 lessons.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t.id} className="rounded-2xl p-4 bg-muted/50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{t.displayName}</span> · {t.location} · {t.lessonsDone} lessons ·{" "}
                    {new Date(t.createdAt).toLocaleDateString()}
                    {!t.consent && <span className="ml-1 text-destructive">· no consent to publish</span>}
                  </p>
                </div>
                <span
                  className={
                    t.approved
                      ? "shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background"
                      : "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                  }
                >
                  {t.approved ? "Live" : "Waiting"}
                </span>
              </div>
              <TestimonialActions id={t.id} approved={t.approved} canPublish={t.consent} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
