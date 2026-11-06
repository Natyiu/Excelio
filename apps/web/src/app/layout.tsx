import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import "../index.css";
import Providers from "@/components/providers";
import { getAppSettings } from "@/lib/actions/user";
import { SITE_URL } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Excelio: Learn Excel by Doing";
const DEFAULT_DESCRIPTION =
  "Bite-sized, hands-on Excel lessons in a real spreadsheet. From your first formula to XLOOKUP, dynamic arrays and LAMBDA.";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getAppSettings();
    const title =
      (settings as { metaTitle?: string | null }).metaTitle?.trim() ||
      (settings as { appName?: string }).appName ||
      DEFAULT_TITLE;
    const description =
      (settings as { metaDescription?: string | null }).metaDescription?.trim() ||
      (settings as { appDescription?: string }).appDescription ||
      DEFAULT_DESCRIPTION;
    const appUrl = (settings as { appUrl?: string }).appUrl?.trim();
    let image = (settings as { ogImage?: string | null }).ogImage?.trim();
    if (image && !image.startsWith("http")) {
      const base = appUrl || process.env.NEXT_PUBLIC_APP_URL || "";
      image = base ? `${base.replace(/\/$/, "")}${image.startsWith("/") ? "" : "/"}${image}` : undefined;
    }
    return {
      metadataBase: new URL(SITE_URL),
      title,
      description,
      openGraph: {
        title,
        description,
        url: appUrl || undefined,
        images: image ? [{ url: image }] : undefined,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return {
      metadataBase: new URL(SITE_URL),
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="dfid_AmNAOIzR5jlGvxd91XVYz"
          data-domain="excelio.space"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
