import { describe, expect, it } from "vitest";
import { classifyVisit } from "./traffic-source";

function visit(referrer: string | null, query = "", landingPath = "/") {
  return classifyVisit({ referrer, params: new URLSearchParams(query), siteHost: "www.excelio.space", landingPath });
}

describe("classifyVisit", () => {
  it("calls a visit with no referrer direct", () => {
    expect(visit(null)).toMatchObject({ channel: "direct", source: "Direct", referrer: null });
  });

  it.each([
    ["https://www.google.com/", "search", "Google"],
    ["https://www.google.co.uk/", "search", "Google"],
    ["https://www.bing.com/search", "search", "Bing"],
    ["https://l.instagram.com/", "social", "Instagram"],
    ["https://lm.facebook.com/", "social", "Facebook"],
    ["https://www.tiktok.com/", "social", "TikTok"],
    ["https://t.co/abc", "social", "X"],
    ["https://t.me/channel", "social", "Telegram"],
    ["https://www.youtube.com/", "social", "YouTube"],
    ["android-app://com.linkedin.android/", "social", "LinkedIn"],
    ["android-app://com.google.android.googlequicksearchbox/", "search", "Google"],
    ["https://chatgpt.com/", "ai", "ChatGPT"],
    ["https://gemini.google.com/", "ai", "Gemini"],
    ["https://mail.google.com/", "email", "Gmail"],
  ])("recognises %s", (referrer, channel, source) => {
    expect(visit(referrer)).toMatchObject({ channel, source });
  });

  it("doesn't mistake a lookalike domain for a known site", () => {
    expect(visit("https://notgoogle.com/")).toMatchObject({ channel: "referral", source: "notgoogle.com" });
    expect(visit("https://google.com.evil.example/")).toMatchObject({ channel: "referral" });
  });

  it("names any other website as a referral", () => {
    expect(visit("https://www.someblog.com/post")).toMatchObject({
      channel: "referral",
      source: "someblog.com",
      referrer: "someblog.com",
    });
  });

  it("ignores a referrer from this site, with or without www", () => {
    expect(visit("https://www.excelio.space/pricing")).toBeNull();
    expect(visit("https://excelio.space/")).toBeNull();
  });

  it("lets campaign tags override the referrer", () => {
    expect(visit("https://www.google.com/", "utm_source=instagram&utm_campaign=launch")).toMatchObject({
      channel: "social",
      source: "Instagram",
      campaign: "launch",
    });
  });

  it("understands short names and paid or email mediums", () => {
    expect(visit(null, "utm_source=ig")).toMatchObject({ channel: "social", source: "Instagram" });
    expect(visit(null, "utm_source=fb&utm_medium=cpc")).toMatchObject({ channel: "paid", source: "Facebook" });
    expect(visit(null, "utm_source=google&utm_medium=paid_search")).toMatchObject({ channel: "paid", source: "Google" });
    expect(visit(null, "utm_source=weekly&utm_medium=email")).toMatchObject({ channel: "email", source: "weekly" });
  });

  it("keeps an unknown campaign source as written", () => {
    expect(visit(null, "utm_source=partner-site")).toMatchObject({ channel: "referral", source: "partner-site" });
  });

  it("uses click ids when the referrer is hidden", () => {
    expect(visit(null, "fbclid=abc")).toMatchObject({ channel: "social", source: "Facebook" });
    expect(visit(null, "gclid=abc")).toMatchObject({ channel: "paid", source: "Google" });
  });

  it("treats a malformed referrer as no referrer", () => {
    expect(visit("not a url")).toMatchObject({ channel: "direct" });
  });

  it("caps long values and records the landing page", () => {
    const r = visit(null, `utm_source=x&utm_campaign=${"c".repeat(500)}`, "/pricing");
    expect(r?.campaign).toHaveLength(100);
    expect(r?.landingPage).toBe("/pricing");
  });
});
