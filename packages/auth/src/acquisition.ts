import prisma from "@Batman/db";

// Set by apps/web/src/middleware.ts (see apps/web/src/lib/traffic-source.ts).
const SOURCE_COOKIE = "excelio_src";
const CHANNELS = new Set(["direct", "search", "social", "ai", "paid", "email", "referral"]);

// The cookie sits in the visitor's browser, so treat its contents as untrusted.
const text = (value: unknown, max: number) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);

/**
 * Save where a new learner came from. Never throws: a sign-up must not fail over this,
 * and it may run before the table exists (ahead of `pnpm db:push`).
 */
export async function saveAcquisition(userId: string, cookieHeader: string | null | undefined) {
  try {
    const raw = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${SOURCE_COOKIE}=([^;]+)`))?.[1];
    if (!raw) return;

    const visit = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    const channel = text(visit.channel, 20);
    const source = text(visit.source, 100);
    if (!channel || !CHANNELS.has(channel) || !source) return;

    await prisma.userAcquisition.create({
      data: {
        userId,
        channel,
        source,
        campaign: text(visit.campaign, 100),
        referrer: text(visit.referrer, 200),
        landingPage: text(visit.landingPage, 200),
      },
    });
  } catch (err) {
    console.error("[Acquisition] Could not save the sign-up source", err);
  }
}
