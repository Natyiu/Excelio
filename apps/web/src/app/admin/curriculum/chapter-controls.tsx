"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setFreeChapterCount, updateChapter } from "@/lib/actions/curriculum-admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useAction() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<void>, done: string) =>
    startTransition(async () => {
      try {
        await fn();
        toast.success(done);
        router.refresh();
      } catch {
        toast.error("Couldn't save. Has the database been updated (pnpm db:push)?");
      }
    });
  return { pending, run };
}

/** Free / Pro switch and a visibility toggle for one chapter. */
export function ChapterControls({ courseId, access, hidden }: { courseId: string; access: "free" | "pro"; hidden: boolean }) {
  const { pending, run } = useAction();
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex rounded-xl border border-border p-0.5 text-[13px] font-semibold">
        {(["free", "pro"] as const).map((a) => (
          <button
            key={a}
            type="button"
            disabled={pending}
            onClick={() => a !== access && run(() => updateChapter(courseId, { access: a }), a === "pro" ? "Now Pro" : "Now free")}
            className={cn("rounded-lg px-3 py-1 capitalize", access === a ? (a === "pro" ? "bg-violet-600 text-white" : "bg-brand text-brand-foreground") : "text-muted-foreground")}
          >
            {a}
          </button>
        ))}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-20 text-[13px]"
        disabled={pending}
        onClick={() => run(() => updateChapter(courseId, { hidden: !hidden }), hidden ? "Shown to learners" : "Hidden from learners")}
      >
        {hidden ? "Show" : "Hide"}
      </Button>
    </div>
  );
}

/** "Make the first N chapters free" quick action. */
export function FreeCountControl({ current, total }: { current: number; total: number }) {
  const { pending, run } = useAction();
  const [n, setN] = useState(current);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm bg-muted/50">
      <span>Make the first</span>
      <input
        type="number"
        min={0}
        max={total}
        value={n}
        onChange={(e) => setN(Number(e.target.value))}
        className="h-9 w-16 rounded-xl border border-border bg-background px-2 text-center"
      />
      <span>chapters free and the rest Pro.</span>
      <Button size="sm" className="h-9 text-sm" disabled={pending} onClick={() => run(() => setFreeChapterCount(n), `First ${n} chapters are now free`)}>
        Apply
      </Button>
    </div>
  );
}
