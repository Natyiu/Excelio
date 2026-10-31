"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, pressable } from "@/components/game-ui";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Notification01Icon as Bell,
  Attachment01Icon as Paperclip,
  Tick01Icon as Check,
  Download01Icon as Download,
  ArrowLeft02Icon as ChevronLeft,
  ArrowRight02Icon as ChevronRight,
  InboxIcon as Inbox,
  FilterIcon as Filter,
} from "@hugeicons/react";
import { getUserNotifications, markNotificationsSeen } from "@/lib/actions/notifications";
import { NOTIFICATION_TAGS } from "@/lib/notification-tags";
import type { DashboardNotificationItem as NotificationItem } from "@/types/dashboard-notifications";

const TAG_COLORS: Record<string, string> = {
  general: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  announcement: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  update: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  maintenance: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  security: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  billing: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  feature: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  urgent: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function NotificationsPage() {
  const router = useRouter();
  const mounted = useMounted();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [tagFilter, setTagFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagFilter, unreadOnly]);

  async function load(page: number) {
    const result = await getUserNotifications({
      tag: tagFilter === "all" ? undefined : tagFilter,
      unreadOnly,
      page,
      limit: 15,
    });
    const items = result.notifications as unknown as NotificationItem[];
    setNotifications(items);
    setTotal(result.total);
    setPages(result.pages);
    setCurrentPage(result.currentPage);

    // Seeing a notification counts as reading it. They stay highlighted as "New"
    // for this visit; the sidebar badge refreshes right away.
    const unseen = items.filter((n) => !n.read).map((n) => n.id);
    if (unseen.length) {
      await markNotificationsSeen(unseen);
      router.refresh();
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  function timeAgo(date: Date) {
    const now = new Date();
    const d = new Date(date);
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">
            Notifications
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {total} notification{total !== 1 ? "s" : ""}{" "}
            {unreadCount > 0 && (
              <span className="font-bold text-brand">
                — {unreadCount} new
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground">
            Filter
          </span>
        </div>
        {/* Drawn only in the browser: the dropdown's generated ids otherwise differ from the server's. */}
        {mounted ? (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="h-10 w-40 rounded-full border text-sm font-semibold">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {NOTIFICATION_TAGS.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="capitalize">{t}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span aria-hidden className="h-10 w-40 rounded-full border border-border" />
        )}
        <button
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-bold transition-colors",
            unreadOnly ? "border-transparent bg-brand-soft text-brand" : "border-border text-muted-foreground hover:bg-muted"
          )}
          onClick={() => setUnreadOnly(!unreadOnly)}
        >
          <Bell className="h-4 w-4" />
          Unread only
        </button>
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title="No notifications"
          description={unreadOnly ? "You've read all your notifications." : "You're all caught up."}
        />
      ) : (
        <Panel className="divide-y divide-border overflow-hidden">
          {notifications.map((n) => {
            const isExpanded = expandedId === n.id;
            return (
              <div
                key={n.id}
                className={cn("transition-colors", !n.read && "bg-brand-soft/50")}
              >
                <button
                  onClick={() => {
                    toggleExpand(n.id);
                  }}
                  className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Unread indicator */}
                    <div className="pt-1 shrink-0">
                      {!n.read ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                      ) : (
                        <div className="h-2.5 w-2.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3
                          className={cn("truncate text-[15px]", !n.read ? "font-bold" : "font-semibold text-muted-foreground")}
                        >
                          {n.title}
                        </h3>
                        <span
                          className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", TAG_COLORS[n.tag] ?? TAG_COLORS.general)}
                        >
                          {n.tag}
                        </span>
                        {n.attachmentUrl && (
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {n.description}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pl-11 space-y-3">
                    <div className="border-l-2 border-border pl-3">
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                        {n.description}
                      </p>
                    </div>

                    {n.attachmentUrl && (
                      <a
                        href={n.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={pressable("outline", "px-3 py-2 normal-case")}
                      >
                        <Download className="h-4 w-4" />
                        <span>{n.attachmentName ?? "Download attachment"}</span>
                      </a>
                    )}

                    <div className="flex items-center gap-2">
                      {!n.read ? (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-foreground">
                          New
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <Check className="h-2.5 w-2.5" />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Panel>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            Page {currentPage} of {pages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              disabled={currentPage <= 1}
              onClick={() => load(currentPage - 1)}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              disabled={currentPage >= pages}
              onClick={() => load(currentPage + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
