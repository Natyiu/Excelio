"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createAnnouncement,
  deleteAnnouncement,
  setAnnouncementPublished,
  updateAnnouncement,
  type AnnouncementResult,
} from "@/lib/actions/announcements";
import { ANNOUNCEMENT_TONES, TONE_STYLE, type AnnouncementTone } from "@/lib/announcement-tones";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type AnnouncementForm = {
  title: string;
  message: string;
  tone: AnnouncementTone;
  ctaLabel: string;
  ctaUrl: string;
  published: boolean;
  /** datetime-local value, or "" */
  endsAt: string;
};

const EMPTY: AnnouncementForm = { title: "", message: "", tone: "news", ctaLabel: "", ctaUrl: "", published: true, endsAt: "" };

function useRun() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<AnnouncementResult>, done: string, after?: () => void) =>
    startTransition(async () => {
      const res = await fn().catch((e) => ({ ok: false as const, error: String(e) }));
      if (!res.ok) return void toast.error(res.error);
      toast.success(done);
      after?.();
      router.refresh();
    });
  return { pending, run };
}

/** The form plus a live preview of the learner's card. Edits an existing one when `id` is given. */
function Editor({ id, initial, onDone }: { id?: string; initial: AnnouncementForm; onDone?: () => void }) {
  const [form, setForm] = useState(initial);
  const { pending, run } = useRun();
  const set = <K extends keyof AnnouncementForm>(k: K, v: AnnouncementForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // datetime-local is local time; send it as a full ISO time.
    const data = { ...form, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : "" };
    run(
      () => (id ? updateAnnouncement(id, data) : createAnnouncement(data)),
      id ? "Announcement saved" : form.published ? "Published! Learners will see it on their dashboard." : "Saved as a draft",
      () => {
        if (!id) setForm(EMPTY);
        onDone?.();
      }
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="an-title">Title</Label>
          <Input id="an-title" required maxLength={80} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. New: Advanced challenges are live!" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="an-message">Message</Label>
          <Textarea
            id="an-message"
            required
            maxLength={600}
            rows={4}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="What do you want learners to know?"
          />
          <p className="text-right text-[12px] text-muted-foreground">{600 - form.message.length} left</p>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Style</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ANNOUNCEMENT_TONES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={form.tone === t}
                onClick={() => set("tone", t)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 p-2 text-left text-[13px] font-semibold transition-colors",
                  form.tone === t ? "border-foreground" : "border-transparent bg-muted/60 hover:bg-muted"
                )}
              >
                <span className="h-6 w-6 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${TONE_STYLE[t].from}, ${TONE_STYLE[t].to})` }} />
                {TONE_STYLE[t].label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="an-cta">Button text (optional)</Label>
            <Input id="an-cta" maxLength={30} value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="e.g. Try it" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-url">Button link</Label>
            <Input id="an-url" value={form.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} placeholder="/dashboard/daily-challenge" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-ends">Stop showing after (optional)</Label>
            <Input id="an-ends" type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
          </div>
          <label className="flex items-center gap-3 self-end pb-2">
            <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} />
            <span className="text-sm">{form.published ? "Publish now" : "Save as draft"}</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          {onDone && (
            <Button type="button" variant="outline" disabled={pending} onClick={onDone}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={pending || !form.title.trim() || !form.message.trim()}>
            {pending ? "Saving…" : id ? "Save changes" : form.published ? "Publish" : "Save draft"}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Live preview: what learners see</p>
        <AnnouncementBar
          preview
          items={[{
            id: "preview",
            version: 0,
            title: form.title,
            message: form.message,
            tone: form.tone,
            ctaLabel: form.ctaLabel || null,
            ctaUrl: form.ctaUrl || null,
            createdAt: new Date().toISOString(),
          }]}
        />
        <p className="text-[12px] text-muted-foreground">
          Learners see this as a thin strip pinned to the top of every page. Clicking it shows the full message.
        </p>
      </div>
    </div>
  );
}

/** "Write an announcement" panel at the top of the admin page. */
export function AnnouncementComposer() {
  return (
    <section className="rounded-2xl border border-border p-5">
      <h2 className="mb-4 text-lg font-semibold">Write an announcement</h2>
      <Editor initial={EMPTY} />
    </section>
  );
}

/** Edit, publish/unpublish and delete for one announcement in the list. */
export function AnnouncementRowActions({ id, form }: { id: string; form: AnnouncementForm }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { pending, run } = useRun();

  return (
    <div className="flex shrink-0 gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setEditing(true)}>
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => setAnnouncementPublished(id, !form.published), form.published ? "Unpublished" : "Published")}
      >
        {form.published ? "Unpublish" : "Publish"}
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => setConfirming(true)}>
        Delete
      </Button>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit announcement</DialogTitle>
            <DialogDescription>Saving shows it again to learners who dismissed the old version.</DialogDescription>
          </DialogHeader>
          {editing && <Editor id={id} initial={form} onDone={() => setEditing(false)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirming} onOpenChange={(o) => !pending && setConfirming(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{form.title}”?</AlertDialogTitle>
            <AlertDialogDescription>It disappears from every learner&apos;s dashboard. This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                run(() => deleteAnnouncement(id), "Deleted", () => setConfirming(false));
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
