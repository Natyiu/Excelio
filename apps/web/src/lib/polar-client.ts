import { Polar } from "@polar-sh/sdk";

/**
 * The Polar client, configured only from env (POLAR_ACCESS_TOKEN, POLAR_SANDBOX_MODE).
 * Admin settings are deliberately not consulted, so the payment flow has one source of truth.
 * Returns null when no token is set.
 */
export function getPolarClient(): Polar | null {
  const token = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!token) return null;
  const sandbox = process.env.POLAR_SANDBOX_MODE?.trim() !== "false";
  return new Polar({ accessToken: token, ...(sandbox && { server: "sandbox" as const }) });
}
