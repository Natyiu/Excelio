"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Message01Icon as Chat,
  Megaphone01Icon as Megaphone,
  CrownIcon as Crown,
  SparklesIcon as Sparkles,
  Alert02Icon as Alert,
  Notification01Icon as Bell,
  ArrowRight01Icon as Arrow,
  Download01Icon as Download,
} from "@hugeicons/react";
import { getUserNotifications, markAllNotificationsRead, markNotificationsSeen } from "@/lib/actions/notifications";
import { Mascot } from "@/components/mascot";
import { Panel } from "@/components/game-ui";
import { cn } from "@/lib/utils";
import type { DashboardNotificationItem as NotificationItem } from "@/types/dashboard-notifications";

const PAGE_SIZE = 20;

/** Icon and colour for each kind of notification, so it's clear at a glance what it is. */
const KIND: Record<string, { icon: React.ComponentType<{ className?: string }>; tile: string; label: string }> = {
  feedback: { icon: Chat, tile: "bg-orange-500/15 text-orange-600 dark:text-orange-300", label: "Reply to your feedback" },
  announcement: { icon: Megaphone, tile: "bg-violet-500/15 text-violet-600 dark:text-violet-300", label: "Announcement" },
  billing: { icon: Crown, tile: "bg-purple-500/15 text-purple-600 dark:text-purple-300", label: "Billing" },
  update: { icon: Sparkles, tile: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300", label: "What's new" },
  feature: { icon: Sparkles, tile: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300", label: "What's new" },
  maintenance: { icon: Alert, tile: "bg-amber-500/15 text-amber-600 dark:text-amber-300", label: "Heads up" },
  security: { icon: Alert, tile: "bg-rose-500/15 text-rose-600 dark:text-rose-300", label: "Security" },
  urgent: { icon: Alert, tile: "bg-rose-500/15 text-rose-600 dark:text-rose-300", label: "Important" },
  general: { icon: Bell, tile: "bg-muted text-muted-foreground", label: "Excelio" },
};

// Titles may start with an emoji ("💬 We replied…"); the icon already says that.
const stripEmoji = (s: string) => s.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, "");

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  // Ids that were unread when they arrived: they stay highlighted for this visit.
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  async function load(nextPage: number, append: boolean) {
    const res = await getUserNotifications({ unreadOnly, page: nextPage, limit: PAGE_SIZE });
    const list = res.notifications as unknown as NotificationItem[];
    setItems((prev) => (append && prev ? [...prev, ...list] : list));
    setTotal(res.total);
    setPage(res.currentPage);
    setPages(res.pages);

    // Seeing a notification counts as reading it; the bell badge updates right away.
    const unseen = list.filter((n) => !n.read).map((n) => n.id);
    if (unseen.length) {
      setFresh((f) => new Set([...f, ...unseen]));
      await markNotificationsSeen(unseen);
      router.refresh();
    }
  }

  useEffect(() => {
    // Loading from the server, then storing the result, is what this effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly]);

  const newCount = fresh.size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {items === null ? "Loading…" : newCount > 0 ? `${newCount} new since your last visit` : "You're all caught up."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <nav className="inline-flex rounded-full bg-muted p-1" aria-label="Show">
            {[
              { id: false, label: "All" },
              { id: true, label: "Unread" },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setUnreadOnly(t.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  unreadOnly === t.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
          {unreadOnly && total > 0 && (
            <button
              type="button"
              onClick={async () => {
                await markAllNotificationsRead();
                router.refresh();
                void load(1, false);
              }}
              className="text-sm font-semibold text-brand hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {items === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Panel className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Mascot mood="wave" size={96} />
          <p className="mt-2 text-lg font-bold">{unreadOnly ? "No unread notifications" : "Nothing here yet"}</p>
          <p className="max-w-sm text-[15px] text-muted-foreground">
            Replies to your feedback, announcements and news about your account will show up here.
          </p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <NotificationCard key={n.id} n={n} isNew={fresh.has(n.id)} />
          ))}
          {page < pages && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => load(page + 1, true)}
                className="rounded-full border-2 border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
              >
                Show older
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationCard({ n, isNew }: { n: NotificationItem; isNew: boolean }) {
  const kind = KIND[n.tag] ?? KIND.general!;
  const Icon = kind.icon;
  const [open, setOpen] = useState(false);
  const long = n.description.length > 220;
  const internal = !!n.attachmentUrl?.startsWith("/");

  return (
    <Panel className={cn("flex gap-4 p-4 transition-colors", isNew && "border-brand/40 bg-brand-soft/40")}>
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", kind.tile)}>
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-muted-foreground">{kind.label}</p>
            <h2 className="mt-0.5 text-[16px] font-bold leading-snug">{stripEmoji(n.title)}</h2>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground">
            {isNew && <span className="h-2 w-2 rounded-full bg-brand" aria-label="New" />}
            {timeAgo(n.createdAt)}
          </span>
        </div>

        {n.description && (
          <p className={cn("mt-1 whitespace-pre-wrap break-words text-[15px] text-foreground/80", long && !open && "line-clamp-3")}>
            {n.description}
          </p>
        )}
        {long && (
          <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 text-sm font-semibold text-brand hover:underline">
            {open ? "Show less" : "Show more"}
          </button>
        )}

        {n.attachmentUrl &&
          (internal ? (
            <Link
              href={n.attachmentUrl as never}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-foreground shadow-[0_3px_0_var(--brand-deep)] transition hover:brightness-110 active:translate-y-[3px] active:shadow-none"
            >
              {n.attachmentName ?? "Open"} <Arrow className="h-4 w-4" />
            </Link>
          ) : (
            <a
              href={n.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-border px-4 py-1.5 text-sm font-semibold hover:bg-muted"
            >
              <Download className="h-4 w-4" /> {n.attachmentName ?? "Download"}
            </a>
          ))}
      </div>
    </Panel>
  );
}
