export type AdminFeedbackItem = {
  id: string;
  userId: string;
  category: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; email: string; image: string | null } | null;
};
