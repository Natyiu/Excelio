import type { getSiteSettings } from "@/lib/actions/site-settings";

export type CountdownSiteSettings = NonNullable<
  Awaited<ReturnType<typeof getSiteSettings>>["countdown"]
>;

export type WaitlistSiteSettings = NonNullable<
  Awaited<ReturnType<typeof getSiteSettings>>["waitlist"]
>;

export type WaitlistPageProps = {
  settings: WaitlistSiteSettings;
};
