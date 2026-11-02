import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in and private areas have nothing for search engines.
      disallow: ["/dashboard", "/admin", "/api", "/onboarding", "/verify-email", "/reset-password", "/maintenance"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
