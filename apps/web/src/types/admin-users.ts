export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  image: string | null;
  createdAt: Date;
};

export type UserSortField = "name" | "email" | "createdAt" | "role";
export type UserSortDir = "asc" | "desc";
