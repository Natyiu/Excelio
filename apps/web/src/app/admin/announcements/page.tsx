import { listAnnouncements } from "@/lib/actions/announcements";
import { ANNOUNCEMENT_TONES, TONE_STYLE, type AnnouncementTone } from "@/lib/announcement-tones";
import { AnnouncementComposer, AnnouncementRowActions, type AnnouncementForm } from "./announcement-composer";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

/** Admin: write announcements that appear as a card at the top of the learner dashboard. */
export default async function AdminAnnouncementsPage() {
  const rows = await listAnnouncements().catch(() => null);
  const now = new Date();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">Announcements</h1>
        <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
          Published announcements appear as a card at the top of every learner&apos;s dashboard (up to three at a time, newest
          first). Learners can dismiss one; if you edit it, it shows again.
        </p>
      </div>

      {!rows ? (
        <div className="rounded-2xl bg-muted/50 p-6 text-sm">
          <p className="font-semibold">The announcements table isn&apos;t in the database yet.</p>
          <p className="mt-1 text-muted-foreground">
            Run <code className="rounded bg-muted px-1.5 py-0.5">pnpm db:push</code> once from the project folder, then reload this page.
          </p>
        </div>
      ) : (
        <>
          <AnnouncementComposer />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">All announcements</h2>
            {rows.length === 0 ? (
              <p className="rounded-2xl bg-muted/50 py-10 text-center text-sm text-muted-foreground">Nothing written yet.</p>
            ) : (
              <div className="divide-y divide-border/40 overflow-hidden rounded-2xl bg-muted/50">
                {rows.map((a) => {
                  const tone = (ANNOUNCEMENT_TONES as readonly string[]).includes(a.tone) ? (a.tone as AnnouncementTone) : "news";
                  const ended = !!a.endsAt && a.endsAt <= now;
                  const status = !a.published ? "Draft" : ended ? "Ended" : "Live";
                  const form: AnnouncementForm = {
                    title: a.title,
                    message: a.message,
                    tone,
                    ctaLabel: a.ctaLabel ?? "",
                    ctaUrl: a.ctaUrl ?? "",
                    published: a.published,
                    endsAt: a.endsAt ? new Date(a.endsAt.getTime() - a.endsAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
                  };
                  return (
                    <div key={a.id} className="flex flex-wrap items-start gap-4 p-4">
                      <span
                        className="mt-1 h-10 w-10 shrink-0 rounded-xl"
                        style={{ background: `linear-gradient(135deg, ${TONE_STYLE[tone].from}, ${TONE_STYLE[tone].to})` }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{a.title}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              status === "Live" ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{a.message}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground/80">
                          {TONE_STYLE[tone].label} · created {fmt(a.createdAt)}
                          {a.endsAt && ` · ${ended ? "ended" : "ends"} ${fmt(a.endsAt)}`}
                        </p>
                      </div>
                      <AnnouncementRowActions id={a.id} form={form} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
