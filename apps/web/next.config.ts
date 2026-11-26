import "@Batman/env/web";
import type { NextConfig } from "next";

// PostHog region: "us" or "eu". Its events are proxied through /ingest.
const posthogRegion = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";

const nextConfig: NextConfig = {
  // PostHog's API paths end in a slash; without this Next.js would redirect them away.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `https://${posthogRegion}-assets.i.posthog.com/static/:path*` },
      { source: "/ingest/:path*", destination: `https://${posthogRegion}.i.posthog.com/:path*` },
    ];
  },
  typedRoutes: true,
  reactCompiler: true,
  serverExternalPackages: ["geoip-country"],
  // The function articles moved from /article to /blog; keep old links and search results working.
  async redirects() {
    return [
      { source: "/article", destination: "/blog", permanent: true },
      { source: "/article/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
