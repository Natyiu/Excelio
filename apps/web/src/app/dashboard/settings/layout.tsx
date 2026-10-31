"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft01Icon as Back } from "@hugeicons/react";

// Each settings page is opened from its own row on the More page, so there's no tab bar here.
const TITLES: Record<string, string> = {
  "/dashboard/settings": "Edit profile",
  "/dashboard/settings/account": "Account settings",
  "/dashboard/settings/appearance": "Appearance",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/more"
          className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Back className="h-4 w-4" /> More
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight">{TITLES[pathname] ?? "Settings"}</h1>
      </div>

      <div>{children}</div>
    </div>
  );
}
