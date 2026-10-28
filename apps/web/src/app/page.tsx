"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { ArrowRight01Icon as ArrowRight, Wrench01Icon as Wrench } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { SetupWizard } from "@/components/setup-wizard";
import { getSetupStatus } from "@/lib/actions/setup";
import { getAppSettings } from "@/lib/actions/user";
import { getSiteSettings } from "@/lib/actions/site-settings";
import { useMounted } from "@/lib/use-mounted";
import type { SetupState } from "@/types/home";

const WaitlistPage = dynamic(() => import("@/components/waitlist-page").then((m) => ({ default: m.WaitlistPage })), {
  ssr: true,
});

const CountdownPage = dynamic(() => import("@/components/countdown-page").then((m) => ({ default: m.CountdownPage })), {
  ssr: true,
});

const CountdownWaitlistPage = dynamic(
  () => import("@/components/countdown-waitlist-page").then((m) => ({ default: m.CountdownWaitlistPage })),
  { ssr: true }
);

export default function Page() {
  const [siteSettings, setSiteSettings] = useState<Awaited<ReturnType<typeof getSiteSettings>> | "loading">("loading");

  useEffect(() => {
    getSiteSettings().then(setSiteSettings);
  }, []);

  if (siteSettings === "loading") {
    return <StarterSkeleton />;
  }
  if (siteSettings?.countdown && siteSettings?.waitlist) {
    return (
      <CountdownWaitlistPage
        countdown={siteSettings.countdown}
        waitlist={siteSettings.waitlist}
      />
    );
  }
  if (siteSettings?.countdown) {
    return <CountdownPage settings={siteSettings.countdown} />;
  }
  if (siteSettings?.waitlist) {
    return <WaitlistPage settings={siteSettings.waitlist} />;
  }
  return <StarterPage />;
}

function StarterPage() {
  const [state, setState] = useState<SetupState>("loading");

  useEffect(() => {
    getSetupStatus().then((status) => {
      setState(status.configured ? "ready" : "wizard");
    });
  }, []);

  if (state === "loading") return <StarterSkeleton />;

  if (state === "wizard") {
    return <SetupWizard onComplete={() => setState("ready")} />;
  }

  return <ReadyPage onRerunSetup={() => setState("wizard")} />;
}

function ReadyPage({ onRerunSetup }: { onRerunSetup: () => void }) {
  const [supportEmail, setSupportEmail] = useState<string>("");

  useEffect(() => {
    getAppSettings().then((data) => {
      const email = (data as Record<string, unknown>).supportEmail as string;
      setSupportEmail(email ?? "");
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 flex h-12 items-center justify-between">
          <div className="flex items-center gap-2">
            <BatLogo className="h-3.5 w-auto text-foreground" />
            <span className="text-[11px] font-semibold tracking-widest uppercase">
              Batman
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <a href="https://batman.roggy.site/docs" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-[11px] h-7 text-muted-foreground">
                Docs
              </Button>
            </a>
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="text-[11px] h-7 text-muted-foreground">
                Blog
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="text-[11px] h-7 text-muted-foreground">
                Pricing
              </Button>
            </Link>
            {/* <Link href="/login">
              <Button variant="ghost" size="sm" className="text-[11px] h-7 text-muted-foreground">
                Sign in
              </Button>
            </Link> */}
            <Link href="/signup">
              <Button size="sm" className="text-[11px] h-7 bg-foreground text-background hover:bg-foreground/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full py-16">
          <div className="mb-8">
            <BatLogo className="h-6 w-auto text-foreground mb-6" />
            <h1 className="text-xl font-semibold tracking-tight mb-2">
              Your app starts here. ( landing page )
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Auth, database, file storage, notifications, admin dashboard —
              already wired. Replace this page and start building your product.
            </p>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
              Stack
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STACK.map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-2 py-1 border border-border/40 text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
              Next steps
            </p>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/30 border border-border/30">
                <span className="text-muted-foreground/40 select-none">$</span>
                <span className="text-foreground/80">pnpm db:generate && pnpm db:push</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/30 border border-border/30">
                <span className="text-muted-foreground/40 select-none">$</span>
                <span className="text-foreground/80">pnpm dev</span>
              </div>
            </div>
          </div>

          <div className="border border-dashed border-border/40 px-3.5 py-3">
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
              Edit{" "}
              <code className="bg-muted/50 px-1 py-px font-mono text-[9px]">app/page.tsx</code>{" "}
              to replace this landing page with your own. Your <code className="bg-muted/50 px-1 py-px font-mono text-[9px]">.env</code> is configured.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link href="/signup">
              <Button
                size="sm"
                className="text-xs h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                Create Account
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                Sign In
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 gap-1 text-muted-foreground/50 ml-auto"
              onClick={onRerunSetup}
            >
              <Wrench className="h-3 w-3" />
              Re-run setup
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-4">
        <div className="max-w-2xl flex justify-between mx-auto px-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/40">
          <span>Batman</span>
         <div className="flex items-center gap-x-3">
         <Link href="/legal/privacy" className="hover:text-muted-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-muted-foreground transition-colors">
            Terms
          </Link>
          {supportEmail && (
            <a href={`mailto:${supportEmail}`} className="hover:text-muted-foreground transition-colors">
              Contact
            </a>
          )}
         </div>
        </div>
      </footer>
    </div>
  );
}

// -- Shared --

const STACK = [
  "Next.js",
  "TypeScript",
  "Tailwind",
  "shadcn/ui",
  "Better Auth",
  "Prisma",
  "PostgreSQL",
  "Supabase",
  "Polar",
  "Resend",
  "Vercel AI SDK",
  "Zod",
  "Tiptap",
  "Recharts",
  "Turborepo",
];

function BatLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 40"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 0C50 0 42 14 30 18C18 22 0 18 0 18C0 18 12 28 20 32C28 36 50 40 50 40C50 40 72 36 80 32C88 28 100 18 100 18C100 18 82 22 70 18C58 14 50 0 50 0Z" />
    </svg>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Toggle theme"
    >
      {mounted && theme === "dark" ? (
        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.17 3.17l1.42 1.42M11.41 11.41l1.42 1.42M3.17 12.83l1.42-1.42M11.41 4.59l1.42-1.42" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
          <path d="M13.5 8.5a5.5 5.5 0 0 1-6-6 5.5 5.5 0 1 0 6 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function StarterSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 flex h-12 items-center justify-between">
          <div className="h-3.5 w-20 bg-muted/40 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-14 bg-muted/40 animate-pulse" />
            <div className="h-7 w-20 bg-muted/40 animate-pulse" />
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full py-16 space-y-6">
          <div className="space-y-3">
            <div className="h-6 w-10 bg-muted/40 animate-pulse" />
            <div className="h-5 w-48 bg-muted/40 animate-pulse" />
            <div className="h-3 w-full bg-muted/30 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-12 bg-muted/30 animate-pulse" />
            <div className="flex flex-wrap gap-1.5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-6 w-16 bg-muted/30 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
