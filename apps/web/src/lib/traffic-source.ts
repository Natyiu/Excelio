/**
 * Works out where a visitor came from. Runs in middleware, so it stays free of database
 * and Node imports. `packages/auth/src/acquisition.ts` reads the cookie set from this.
 */
export const SOURCE_COOKIE = "excelio_src";

export type Channel = "direct" | "search" | "social" | "ai" | "paid" | "email" | "referral";

export const CHANNEL_LABEL: Record<Channel, string> = {
  direct: "Direct",
  search: "Search",
  social: "Social",
  ai: "AI assistant",
  paid: "Paid ads",
  email: "Email",
  referral: "Other website",
};

export type TrafficSource = {
  channel: Channel;
  source: string;
  campaign: string | null;
  referrer: string | null;
  landingPage: string;
};

type Known = { name: string; channel: Channel; hosts: string[]; aliases?: string[] };

// First match wins, so subdomains like gemini.google.com come before google.com.
// Hosts include Android app ids, which is what in-app browsers send as the referrer.
const KNOWN: Known[] = [
  { name: "ChatGPT", channel: "ai", hosts: ["chatgpt.com", "chat.openai.com"], aliases: ["openai"] },
  { name: "Claude", channel: "ai", hosts: ["claude.ai"] },
  { name: "Gemini", channel: "ai", hosts: ["gemini.google.com"] },
  { name: "Perplexity", channel: "ai", hosts: ["perplexity.ai"] },
  { name: "Copilot", channel: "ai", hosts: ["copilot.microsoft.com"] },
  { name: "Gmail", channel: "email", hosts: ["mail.google.com", "com.google.android.gm"] },
  { name: "Outlook", channel: "email", hosts: ["outlook.live.com", "outlook.office.com"] },
  { name: "YouTube", channel: "social", hosts: ["youtube.com", "youtu.be", "com.google.android.youtube"], aliases: ["yt"] },
  { name: "Google", channel: "search", hosts: ["google.com", "com.google.android.googlequicksearchbox"] },
  { name: "Bing", channel: "search", hosts: ["bing.com"] },
  { name: "DuckDuckGo", channel: "search", hosts: ["duckduckgo.com"], aliases: ["ddg"] },
  { name: "Yahoo", channel: "search", hosts: ["yahoo.com"] },
  { name: "Brave Search", channel: "search", hosts: ["search.brave.com"] },
  { name: "Ecosia", channel: "search", hosts: ["ecosia.org"] },
  { name: "Yandex", channel: "search", hosts: ["yandex.ru", "yandex.com"] },
  { name: "Baidu", channel: "search", hosts: ["baidu.com"] },
  { name: "Facebook", channel: "social", hosts: ["facebook.com", "fb.com", "fb.me", "com.facebook.katana"], aliases: ["fb"] },
  { name: "Instagram", channel: "social", hosts: ["instagram.com", "com.instagram.android"], aliases: ["ig"] },
  { name: "Threads", channel: "social", hosts: ["threads.net", "threads.com"] },
  { name: "TikTok", channel: "social", hosts: ["tiktok.com", "com.zhiliaoapp.musically"], aliases: ["tt"] },
  { name: "X", channel: "social", hosts: ["x.com", "twitter.com", "t.co", "com.twitter.android"], aliases: ["twitter"] },
  { name: "LinkedIn", channel: "social", hosts: ["linkedin.com", "lnkd.in", "com.linkedin.android"] },
  { name: "Reddit", channel: "social", hosts: ["reddit.com", "com.reddit.frontpage"] },
  { name: "Pinterest", channel: "social", hosts: ["pinterest.com", "pin.it"] },
  { name: "Telegram", channel: "social", hosts: ["t.me", "telegram.org", "org.telegram.messenger"] },
  { name: "WhatsApp", channel: "social", hosts: ["whatsapp.com", "wa.me", "com.whatsapp"] },
  { name: "Snapchat", channel: "social", hosts: ["snapchat.com"] },
  { name: "Discord", channel: "social", hosts: ["discord.com", "discord.gg"] },
  { name: "Quora", channel: "social", hosts: ["quora.com"] },
];

// Ad and share links add these, and they survive when an in-app browser hides the referrer.
const CLICK_IDS: { param: string; name: string; channel: Channel }[] = [
  { param: "gclid", name: "Google", channel: "paid" },
  { param: "msclkid", name: "Bing", channel: "paid" },
  { param: "ttclid", name: "TikTok", channel: "paid" },
  { param: "fbclid", name: "Facebook", channel: "social" },
];

const clip = (value: string | null, max: number) => value?.trim().slice(0, max) || null;
const bareHost = (host: string) => host.toLowerCase().replace(/^www\./, "");

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return bareHost(new URL(url).host) || null;
  } catch {
    return null;
  }
}

function findByHost(host: string): Known | undefined {
  // Every country's Google (google.co.uk, google.de) counts as Google.
  const normalized = /^google\.(com?\.)?[a-z]{2,3}$/.test(host) ? "google.com" : host;
  return KNOWN.find((k) => k.hosts.some((h) => normalized === h || normalized.endsWith(`.${h}`)));
}

function findByName(name: string): Known | undefined {
  const lower = name.toLowerCase();
  return KNOWN.find((k) => k.name.toLowerCase() === lower || k.aliases?.includes(lower));
}

function channelFromMedium(medium: string): Channel | null {
  if (/^(cpc|ppc|cpm|ads?)$|paid/.test(medium)) return "paid";
  if (/mail|newsletter/.test(medium)) return "email";
  if (/social/.test(medium)) return "social";
  if (/^(organic|search)$/.test(medium)) return "search";
  return null;
}

/**
 * Where this visit came from. Campaign tags beat click ids, which beat the referrer. Returns
 * null for a referrer on this same site: that's someone already browsing, not an arrival.
 */
export function classifyVisit(input: {
  referrer: string | null;
  params: URLSearchParams;
  siteHost: string | null;
  landingPath: string;
}): TrafficSource | null {
  const { referrer, params, siteHost, landingPath } = input;
  const host = hostOf(referrer);
  if (host && siteHost && host === bareHost(siteHost)) return null;

  const base = {
    campaign: clip(params.get("utm_campaign"), 100),
    referrer: clip(host, 200),
    landingPage: clip(landingPath, 200) ?? "/",
  };

  const utmSource = clip(params.get("utm_source"), 100);
  if (utmSource) {
    const known = findByName(utmSource) ?? findByHost(bareHost(utmSource));
    const channel = channelFromMedium((params.get("utm_medium") ?? "").toLowerCase());
    return { ...base, channel: channel ?? known?.channel ?? "referral", source: known?.name ?? utmSource };
  }

  const clickId = CLICK_IDS.find((c) => params.has(c.param));
  if (clickId) return { ...base, channel: clickId.channel, source: clickId.name };

  if (!host) return { ...base, channel: "direct", source: "Direct" };

  const known = findByHost(host);
  return { ...base, channel: known?.channel ?? "referral", source: known?.name ?? host };
}
