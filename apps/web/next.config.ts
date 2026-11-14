import "@Batman/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
