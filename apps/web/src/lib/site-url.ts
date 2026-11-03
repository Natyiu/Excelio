/**
 * The public site URL, for canonical links, the sitemap and structured data.
 * Uses NEXT_PUBLIC_APP_URL, then BETTER_AUTH_URL, then the production domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.BETTER_AUTH_URL?.trim() ||
  "https://www.excelio.space"
).replace(/\/$/, "");
