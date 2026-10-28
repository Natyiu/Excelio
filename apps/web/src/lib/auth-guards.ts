import { auth } from "@Batman/auth";
import { headers } from "next/headers";

/** Throws if there's no signed-in user; otherwise returns their session. */
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

/** Throws unless the signed-in user is an admin; otherwise returns their session. */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "admin") throw new Error("Forbidden");
  return session;
}
