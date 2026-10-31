"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  SentIcon as Send,
  Attachment01Icon as Paperclip,
  Cancel01Icon as X,
  UserGroupIcon as Users,
  Clock01Icon as Clock,
  EyeIcon as Eye,
  ArrowLeft02Icon as ChevronLeft,
  ArrowRight02Icon as ChevronRight,
  Search01Icon as Search,
  Loading03Icon as Loader2,
  PlusSignIcon as Plus,
} from "@hugeicons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  sendNotification,
  sendNotificationToAll,
  getAdminNotificationHistory,
  searchUsers,
} from "@/lib/actions/notifications";
import { NOTIFICATION_TAGS } from "@/lib/notification-tags";
import { uploadFile } from "@/lib/supabase";
import type {
  AdminUserOption as UserOption,
  AdminNotificationHistoryItem as HistoryItem,
} from "@/types/admin-notifications";

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

export default function AdminNotificationsPage() {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("general");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userSearching, setUserSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    loadHistory(1);
  }, []);

  const doUserSearch = useCallback(async (query: string) => {
    setUserSearching(true);
    try {
      const result = await searchUsers(query);
      setUsers(result);
    } catch {
      // ignore
    } finally {
      setUserSearching(false);
    }
  }, []);

  useEffect(() => {
    if (sendToAll) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      doUserSearch(userSearch);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [userSearch, sendToAll, doUserSearch]);

  async function loadHistory(page: number) {
    const result = await getAdminNotificationHistory({ page, limit: 10 });
    setHistory(result.notifications as unknown as HistoryItem[]);
    setHistoryPages(result.pages);
    setHistoryPage(page);
    setHistoryTotal(result.total);
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  const filteredUsers = users;

  async function handleSend() {
    if (!title.trim()) return toast.error("Title is required");
    if (!description.trim()) return toast.error("Description is required");
    if (!sendToAll && selectedUsers.length === 0) {
      return toast.error("Select at least one recipient");
    }

    startTransition(async () => {
      try {
        let attachmentUrl: string | undefined;
        let attachmentName: string | undefined;

        if (attachment) {
          const path = `notifications/${Date.now()}-${attachment.name}`;
          const result = await uploadFile("attachments", path, attachment);
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          attachmentUrl = result.url;
          attachmentName = attachment.name;
        }

        if (sendToAll) {
          await sendNotificationToAll({
            title: title.trim(),
            description: description.trim(),
            tag,
            attachmentUrl,
            attachmentName,
          });
        } else {
          await sendNotification({
            title: title.trim(),
            description: description.trim(),
            tag,
            attachmentUrl,
            attachmentName,
            recipientIds: selectedUsers,
          });
        }

        toast.success("Notification sent");
        setTitle("");
        setDescription("");
        setTag("general");
        setAttachment(null);
        setSelectedUsers([]);
        setSendToAll(true);
        setCreateOpen(false);
        loadHistory(1);
      } catch {
        toast.error("Failed to send notification");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Notifications</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Compose and send messages to your users.
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 text-sm gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3 w-3" />
          Create message
        </Button>
      </div>

      {/* Create message dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Create message</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="notif-title" className="text-[13px] font-medium">
                  Title
                </Label>
                <Input
                  id="notif-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title..."
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notif-tag" className="text-[13px] font-medium">
                  Tag
                </Label>
                <Select value={tag} onValueChange={setTag}>
                  <SelectTrigger id="notif-tag" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TAGS.map((t) => (
                      <SelectItem key={t} value={t} className="text-sm">
                        <span className="capitalize">{t}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-desc" className="text-[13px] font-medium">
                Description
              </Label>
              <Textarea
                id="notif-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write the notification body..."
                rows={4}
                className="text-sm resize-none"
              />
            </div>

            {/* Attachment */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">
                Attachment (optional)
              </Label>
              {attachment ? (
                <div className="flex items-center gap-2 border border-input rounded-xl p-2.5 bg-muted/20">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">
                    {attachment.name}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border border-dashed border-input rounded-xl p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to attach a file
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAttachment(file);
                    }}
                  />
                </label>
              )}
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-to-all"
                  checked={sendToAll}
                  onCheckedChange={(c) => setSendToAll(!!c)}
                />
                <Label
                  htmlFor="send-to-all"
                  className="text-[13px] font-medium cursor-pointer"
                >
                  Send to all users
                </Label>
              </div>

              {!sendToAll && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="p-2 border-b border-border/60 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="h-9 text-sm pl-8"
                    />
                    {userSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground animate-spin" />
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border/30">
                    {filteredUsers.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted/30 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedUsers.includes(u.id)}
                          onCheckedChange={() => toggleUser(u.id)}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {u.name ?? "Unnamed"}
                          </p>
                          <p className="text-[12px] text-muted-foreground truncate">
                            {u.email}
                          </p>
                        </div>
                      </label>
                    ))}
                    {filteredUsers.length === 0 && !userSearching && (
                      <p className="p-3 text-sm text-muted-foreground text-center">
                        {userSearch ? "No users found" : "Type to search users..."}
                      </p>
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <div className="p-2 border-t border-border/60 bg-muted/30">
                      <p className="text-[12px] text-muted-foreground">
                        {selectedUsers.length} user
                        {selectedUsers.length !== 1 ? "s" : ""} selected
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSend}
              disabled={isPending}
              size="sm"
              className="h-9 text-sm gap-1.5"
            >
              <Send className="h-3 w-3" />
              {isPending ? "Sending..." : "Send Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History section */}
      <div className="rounded-2xl bg-muted/50">
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-semibold">Sent History</p>
            <p className="text-[12px] text-muted-foreground">
              {historyTotal} notification{historyTotal !== 1 ? "s" : ""} sent
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Send className="h-8 w-8 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              No notifications sent yet
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/30">
              {history.map((item) => (
                <div key={item.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold truncate">
                          {item.title}
                        </h3>
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-px ${TAG_COLORS[item.tag] ?? TAG_COLORS.general}`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-[13px] text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      {item.attachmentName && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Paperclip className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[12px] text-muted-foreground">
                            {item.attachmentName}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-[12px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="flex items-center gap-0.5 text-[12px] text-muted-foreground">
                          <Users className="h-2.5 w-2.5" />
                          {item.recipientCount}
                        </span>
                        <span className="flex items-center gap-0.5 text-[12px] text-muted-foreground">
                          <Eye className="h-2.5 w-2.5" />
                          {item.readCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {historyPages > 1 && (
              <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">
                  Page {historyPage} of {historyPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    disabled={historyPage <= 1}
                    onClick={() => loadHistory(historyPage - 1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    disabled={historyPage >= historyPages}
                    onClick={() => loadHistory(historyPage + 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
