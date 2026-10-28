import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";
import { getAppSettings } from "@/lib/actions/user";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Batman — The Dark Knight Boilerplate";
const DEFAULT_DESCRIPTION =
  "A production-ready full-stack boilerplate forged in the shadows of Gotham. Next.js, Prisma, Better Auth, and more.";

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
      </body>
    </html>
  );
}
