import Link from "next/link";
import type { ReactNode } from "react";
import { Mascot, type MascotMood } from "@/components/mascot";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

/**
 * The centred card layout for account pages (sign up, log in, onboarding, plans):
 * the Excelio wordmark, Gridley above a 3D card, on the landing page's soft green grid.
 */
export function BrandCardLayout({
  children,
  aside,
  mood = "wave",
  wide = false,
}: {
  children: ReactNode;
  /** Shown top-right in the header, e.g. a "Back to home" link. */
  aside?: ReactNode;
  mood?: MascotMood;
  /** A wider card, for pages with more content (onboarding, plans). */
  wide?: boolean;
}) {
  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-brand-soft/50 font-apple text-foreground">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:72px_32px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
      />

      <header className="relative">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="inline-flex items-center gap-[0.3em] text-2xl font-bold tracking-tight text-brand">
            <BrandLogo />
            Excelio
          </Link>
          {aside}
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-2">
        <div className={cn("w-full", wide ? "max-w-lg" : "max-w-[380px]")}>
          <div className="flex justify-center">
            <Mascot mood={mood} size={76} className="relative z-10 -mb-3" />
          </div>
          <div className="rounded-3xl border-2 border-b-[5px] border-border bg-card px-6 pb-5 pt-6">{children}</div>
        </div>
      </main>

      <footer className="relative pb-3">
        <div className="flex items-center justify-center gap-5 text-[12px] text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Excelio</span>
          <Link href="/legal/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-foreground">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
