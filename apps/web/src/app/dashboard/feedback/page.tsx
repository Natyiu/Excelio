import { getUserFeedback } from "@/lib/actions/feedback";
import { getSessionCached } from "@/lib/request-cache";
import { FEEDBACK_CATEGORIES } from "@/lib/feedback-categories";
import { Mascot } from "@/components/mascot";
import { Panel, SectionTitle } from "@/components/game-ui";
import { cn } from "@/lib/utils";
import { FeedbackForm } from "./feedback-form";

const STATUS: Record<string, { label: string; className: string }> = {
  open: { label: "Sent", className: "bg-muted text-muted-foreground" },
  reviewed: { label: "Read", className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  planned: { label: "Planned", className: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  resolved: { label: "Done", className: "bg-brand-soft text-brand" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

const categoryLabel = (v: string) => FEEDBACK_CATEGORIES.find((c) => c.value === v)?.label ?? v;
const date = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Learners send feedback here and see what happened to what they sent before. */
export default async function FeedbackPage() {
  const [sent, session] = await Promise.all([getUserFeedback().catch(() => []), getSessionCached()]);
  const firstName = session?.user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <div className="flex items-end gap-3">
        <Mascot mood="teach" size={72} className="hidden sm:block" />
        <div>
          <h1 className="text-3xl font-bold">{firstName ? `Hey ${firstName}, tell us your feedback` : "Tell us your feedback"}</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Found a bug, stuck on a lesson, or have an idea? Tell us. We read every message.
          </p>
        </div>
      </div>

      <FeedbackForm firstName={firstName} />

      {sent.length > 0 && (
        <section>
          <SectionTitle>What you&apos;ve sent</SectionTitle>
          <div className="space-y-3">
            {sent.map((f) => {
              const s = STATUS[f.status] ?? STATUS.open!;
              return (
                <Panel key={f.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="font-semibold">{categoryLabel(f.category)}</span>
                    <span className="text-muted-foreground">· {date(f.createdAt)}</span>
                    <span className={cn("ml-auto rounded-full px-2.5 py-0.5 text-[12px] font-bold", s.className)}>{s.label}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-[15px]">{f.message}</p>
                  {f.adminNote && (
                    <div className="mt-3 rounded-xl bg-brand-soft px-4 py-3">
                      <p className="text-[12px] font-bold uppercase tracking-wide text-brand">Reply from Excelio</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-[15px]">{f.adminNote}</p>
                    </div>
                  )}
                </Panel>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
