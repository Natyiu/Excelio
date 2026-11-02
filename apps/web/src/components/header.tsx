"use client";
import Link from "next/link";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { BrandLogo } from "@/components/brand-logo";


export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-6">
          <Link href="/" className="inline-flex items-center gap-[0.3em] text-xl font-bold tracking-tight text-brand">
            <BrandLogo />
            Excelio
          </Link>
          <nav className="flex gap-4">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                href={to}
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <div className="border-b border-border/30" />
    </div>
  );
}
