export type DashboardNotificationItem = {
  id: string;
  notificationId: string;
  title: string;
  description: string;
  tag: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
};
