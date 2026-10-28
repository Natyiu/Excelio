export type AdminBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  author: { name: string; email: string } | null;
};
