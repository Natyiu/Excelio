export type Invitation = {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organization: { name: string; slug: string };
};
