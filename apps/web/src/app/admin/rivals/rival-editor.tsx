"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createRival, deleteAllRivals, deleteRival, updateRival, type RivalResult } from "@/lib/actions/rivals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { estimateRival } from "@/lib/rival-estimate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

type Level = "beginner" | "intermediate" | "advanced";
export type Chapter = { id: string; label: string; level: Level; lessonXp: number[] };
export type RivalForm = {
  name: string;
  avatarUrl: string;
  level: Level;
  currentChapter: string;
  lessonsCompleted: number;
  totalXp: number;
  weeklyXp: number;
  currentStreak: number;
  active: boolean;
};

const EMPTY: RivalForm = {
  name: "",
  avatarUrl: "",
  level: "beginner",
  currentChapter: "",
  lessonsCompleted: 0,
  totalXp: 0,
  weeklyXp: 0,
  currentStreak: 0,
  active: true,
};

const LEVELS: { id: Level; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function useRun() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<RivalResult>, done: string, after?: () => void) =>
    startTransition(async () => {
      const res = await fn().catch((e) => ({ ok: false as const, error: String(e) }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(done);
      after?.();
      router.refresh();
    });
  return { pending, run };
}

/** "Add rival" button, or an edit dialog when `rival` is given. */
export function RivalEditor({
  chapters,
  rival,
  open: openProp,
  onOpenChange,
}: {
  chapters: Chapter[];
  rival?: RivalForm & { id: string };
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [form, setForm] = useState<RivalForm>(rival ?? EMPTY);
  const { pending, run } = useRun();
  const set = <K extends keyof RivalForm>(k: K, v: RivalForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k: "lessonsCompleted" | "totalXp" | "weeklyXp" | "currentStreak") => ({
    type: "number" as const,
    min: 0,
    inputMode: "numeric" as const,
    value: String(form[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, Math.max(0, Math.floor(Number(e.target.value) || 0))),
  });

  const chaptersForLevel = chapters.filter((c) => c.level === form.level);

  // Fill lessons, XP and streak from the real lessons up to this point in the course.
  const estimate = (level: Level, chapterId: string) => {
    const e = estimateRival(chapters, level, chapterId);
    if (e) setForm((f) => ({ ...f, level, ...e }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () => (rival ? updateRival(rival.id, form) : createRival(form)),
      rival ? `Saved ${form.name}` : `Added ${form.name}`,
      () => {
        setOpen(false);
        if (!rival) setForm(EMPTY);
      }
    );
  };

  return (
    <>
      {!rival && (
        <Button
          onClick={() => {
            // Start from a realistic beginner instead of all zeros
            if (!form.name && form.totalXp === 0) estimate(form.level, form.currentChapter);
            setOpen(true);
          }}
        >
          Add rival
        </Button>
      )}
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{rival ? `Edit ${rival.name}` : "Add a rival"}</DialogTitle>
              <DialogDescription>Learners see rivals on the leaderboard with a “Rival” badge.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="rv-name">Name</Label>
                <Input id="rv-name" required maxLength={40} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sara K." />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="rv-avatar">Avatar image link (optional)</Label>
                <Input id="rv-avatar" type="url" value={form.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rv-level">Level</Label>
                <select
                  id="rv-level"
                  className={selectClass}
                  value={form.level}
                  onChange={(e) => estimate(e.target.value as Level, "")}
                >
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rv-chapter">Current chapter</Label>
                <select id="rv-chapter" className={selectClass} value={form.currentChapter} onChange={(e) => estimate(form.level, e.target.value)}>
                  {!form.currentChapter && <option value="">–</option>}
                  {chaptersForLevel.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-[13px] text-muted-foreground sm:col-span-2">
                <span>Worked out from the real lessons up to this chapter. Change any number.</span>
                <Button type="button" size="sm" variant="outline" onClick={() => estimate(form.level, form.currentChapter)}>
                  Estimate again
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rv-weekly">XP this week</Label>
                <Input id="rv-weekly" {...num("weeklyXp")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rv-total">Total XP</Label>
                <Input id="rv-total" {...num("totalXp")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rv-lessons">Lessons completed</Label>
                <Input id="rv-lessons" {...num("lessonsCompleted")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rv-streak">Day streak</Label>
                <Input id="rv-streak" {...num("currentStreak")} />
              </div>
              <label className="flex items-center gap-3 sm:col-span-2">
                <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
                <span className="text-sm">Show on the leaderboard</span>
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !form.name.trim()}>
                {pending ? "Saving…" : rival ? "Save" : "Add rival"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Edit, show/hide and delete for one rival row. */
export function RivalRowActions({ rival, chapters }: { rival: RivalForm & { id: string }; chapters: Chapter[] }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { pending, run } = useRun();

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setEditing(true)}>
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => updateRival(rival.id, { ...rival, active: !rival.active }), rival.active ? "Hidden" : "Shown")}
      >
        {rival.active ? "Hide" : "Show"}
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => setConfirming(true)}>
        Delete
      </Button>

      {editing && <RivalEditor chapters={chapters} rival={rival} open={editing} onOpenChange={setEditing} />}

      <AlertDialog open={confirming} onOpenChange={(o) => !pending && setConfirming(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {rival.name}?</AlertDialogTitle>
            <AlertDialogDescription>They disappear from every leaderboard. This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                run(() => deleteRival(rival.id), `Deleted ${rival.name}`, () => setConfirming(false));
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

/** Remove every rival at once. */
export function DeleteAllRivals({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useRun();
  return (
    <>
      <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
        Delete all
      </Button>
      <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all {count} rivals?</AlertDialogTitle>
            <AlertDialogDescription>
              The leaderboard will only show real learners. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep them</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                run(() => deleteAllRivals(), "All rivals deleted", () => setOpen(false));
              }}
            >
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
