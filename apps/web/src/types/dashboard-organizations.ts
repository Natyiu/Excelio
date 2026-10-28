export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: string | Date;
  members?: { id: string; userId: string; role: string; user?: { name: string; email: string; image?: string | null } }[];
};
