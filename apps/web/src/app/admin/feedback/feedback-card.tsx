"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateFeedbackStatus } from "@/lib/actions/feedback";
import { FEEDBACK_CATEGORIES } from "@/lib/feedback-categories";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type FeedbackCardItem = {
  id: string;
  category: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null } | null;
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** One message with its reply. Reply in the box underneath and press Send (or Enter). */
export function FeedbackCard({ item }: { item: FeedbackCardItem }) {
  const replied = !!item.adminNote?.trim();
  const [editing, setEditing] = useState(false);
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const category = FEEDBACK_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category;
  const name = item.user?.name ?? "Deleted user";
  const firstName = name.split(/\s+/)[0];

  const send = () => {
    const text = reply.trim();
    if (!text || pending) return;
    startTransition(async () => {
      try {
        // Replying marks a new message as read; the stored status is otherwise kept.
        await updateFeedbackStatus(item.id, item.status === "open" ? "reviewed" : item.status, text);
        toast.success(`Reply sent to ${firstName}`);
        setEditing(false);
        router.refresh();
      } catch {
        toast.error("Couldn't send. Please try again.");
      }
    });
  };

  const showBox = !replied || editing;

  return (
    <article className="rounded-2xl border border-border bg-background p-4">
      {/* Who, when, what kind, replied or not */}
      <header className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={item.user?.image || undefined} />
          <AvatarFallback className="bg-muted text-sm font-semibold">{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">
            {name} <span className="font-normal text-muted-foreground">· {category} · {timeAgo(item.createdAt)}</span>
          </p>
          <p className="truncate text-[12px] text-muted-foreground">{item.user?.email}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold",
            replied ? "bg-brand-soft text-brand" : "bg-orange-500/15 text-orange-700 dark:text-orange-300"
          )}
        >
          {replied ? "✓ Replied" : "Not replied yet"}
        </span>
      </header>

      {/* Their message */}
      <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-muted/60 px-4 py-3 text-[15px]">{item.message}</p>

      {/* What you replied */}
      {replied && !editing && (
        <div className="mt-2 flex items-start gap-3 rounded-xl border border-brand/30 bg-brand-soft/60 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-brand">You replied</p>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px]">{item.adminNote}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setReply(item.adminNote ?? "");
              setEditing(true);
            }}
            className="shrink-0 text-[13px] font-medium text-brand hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      {/* Reply box */}
      {showBox && (
        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={`Reply to ${firstName}…`}
            autoFocus={editing}
            className="h-10 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-[15px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand"
          />
          {editing && (
            <button type="button" onClick={() => setEditing(false)} className="h-10 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={pending || !reply.trim()}
            className="h-10 shrink-0 rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:brightness-110 disabled:opacity-40"
          >
            {pending ? "Sending…" : editing ? "Save" : "Send"}
          </button>
        </form>
      )}
    </article>
  );
}
