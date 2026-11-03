"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitFeedback } from "@/lib/actions/feedback";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_MAX_LENGTH,
} from "@/lib/feedback-categories";
import { Panel, pressable } from "@/components/game-ui";
import { Mascot } from "@/components/mascot";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Learner-facing form: pick what kind of feedback it is, write it, send. */
export function FeedbackForm({ firstName }: { firstName?: string }) {
  const [thanked, setThanked] = useState(false);
  const [category, setCategory] = useState<string>("improvement");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const left = FEEDBACK_MAX_LENGTH - message.length;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    startTransition(async () => {
      try {
        await submitFeedback({ category, message });
        setMessage("");
        setThanked(true);
        router.refresh();
      } catch {
        toast.error("Couldn't send it. Please try again.");
      }
    });
  };

  return (
    <>
      <Dialog open={thanked} onOpenChange={setThanked}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <div className="relative flex justify-center bg-brand-soft pb-2 pt-8">
            {/* a little burst of confetti behind the mascot */}
            {[
              ["18%", "22%", "#f59e0b"],
              ["78%", "18%", "var(--brand)"],
              ["12%", "70%", "#ec4899"],
              ["86%", "64%", "#0ea5e9"],
              ["30%", "8%", "#22c55e"],
              ["66%", "6%", "#f97316"],
            ].map(([left, top, c], i) => (
              <span
                key={i}
                aria-hidden
                className="absolute h-2 w-3 animate-bounce rounded-sm"
                style={{
                  left,
                  top,
                  background: c,
                  animationDelay: `${i * 0.15}s`,
                  rotate: `${i * 40}deg`,
                }}
              />
            ))}
            <Mascot mood="cheer" size={130} />
          </div>
          <div className="space-y-2 px-6 pb-6 pt-2 text-center">
            <DialogTitle className="text-2xl font-extrabold">
              Thanks{firstName ? `, ${firstName}` : ""}! 🎉
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed">
              Your feedback is on its way to the Excelio team. We read every
              message, and when we reply you&apos;ll see it right here on this
              page.
            </DialogDescription>
            <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setThanked(false)}
                className={pressable("outline")}
              >
                Close
              </button>
              <Link href="/dashboard" className={pressable("brand")}>
                Back to learning
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Panel className="p-5">
        <form onSubmit={send} className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">
              What is it about?
            </legend>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={category === c.value}
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    category === c.value
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="feedback-message"
              className="mb-2 block text-sm font-semibold"
            >
              Your message
            </label>
            <textarea
              id="feedback-message"
              required
              rows={5}
              maxLength={FEEDBACK_MAX_LENGTH}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                category === "bug"
                  ? "What happened, and what did you expect? Which lesson or page?"
                  : "Tell us what you think. What would make Excelio better for you?"
              }
              className="w-full resize-y rounded-xl border-2 border-border bg-background px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand"
            />
            <p
              className={cn(
                "mt-1 text-right text-[12px]",
                left < 100 ? "text-amber-600" : "text-muted-foreground",
              )}
            >
              {left} characters left
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending || !message.trim()}
              className={pressable("brand")}
            >
              {pending ? "Sending…" : "Send feedback"}
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}
