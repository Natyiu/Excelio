import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Skipped until a project key is set, so local dev and preview builds without one stay quiet.
if (key) {
  posthog.init(key, {
    // Sent through our own /ingest route (see next.config.ts) so ad blockers don't drop events.
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "https://eu.posthog.com" : "https://us.posthog.com",
    defaults: "2025-05-24",
  });
}
