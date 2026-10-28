export type AdminUserOption = { id: string; name: string | null; email: string };

export type AdminNotificationHistoryItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  senderId: string;
  createdAt: Date;
  recipientCount: number;
  readCount: number;
};
