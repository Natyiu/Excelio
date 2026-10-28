"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Logout01Icon as LogOut,
  SecurityCheckIcon as ShieldCheck,
  Notification01Icon as Bell,
  Settings01Icon as Settings,
  Building02Icon as Building2,
  CodeIcon as Code,
  ArrowUpRight01Icon as ArrowUpRight,
  MessageAdd01Icon as MessageSquarePlus,
  Sun03Icon as Sun,
  Moon02Icon as Moon,
  UserIcon as User,
  CreditCardIcon as CreditCard,
} from "@hugeicons/react";
import { FeedbackDialog } from "@/components/feedback-dialog";

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

  function cycle() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      onClick={cycle}
      title={mounted ? `Theme: ${theme}` : undefined}
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function DashboardShell({
  children,
  session,
  unreadNotifications = 0,
}: {
  children: React.ReactNode;
  session: typeof authClient.$Infer.Session;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const isAdmin = session.user.role === "admin";
  const isHome = pathname === "/dashboard";
  const userImage = session.user.image;
  const userName = session.user.name ?? "";
  const userEmail = session.user.email ?? "";
  const initial = userName.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex h-11 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <BatLogo className="h-4 w-auto text-foreground" />
            </Link>
            {!isHome && (
              <nav className="hidden sm:flex items-center gap-0.5 text-xs">
                <Link
                  href={"/dashboard" as never}
                  className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                >
                  Home
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <Link href={"/pricing" as never}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Button>
            </Link>
            <Link href={"/dashboard/notifications" as never} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-3.5 w-3.5" />
              </Button>
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold px-0.5">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>

            <ThemeToggle />

            <div className="w-px h-4 bg-border mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-1.5 py-1 px-1 hover:bg-muted/50 transition-colors rounded-sm cursor-pointer outline-none">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={userImage ?? undefined} />
                      <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">
                      {userName}
                    </span>
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/dashboard/settings";
                  }}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/dashboard/settings/account";
                  }}
                >
                  <User className="h-3.5 w-3.5" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/dashboard/settings/appearance";
                  }}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Appearance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  Send Feedback
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        window.location.href = "/admin";
                      }}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          window.location.href = "/";
                        },
                      },
                    })
                  }
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {children}
      </main>
    </div>
  );
}

export function DashboardHome({
  userName,
  organizationsEnabled = false,
}: {
  userName?: string;
  organizationsEnabled?: boolean;
}) {
  const firstName = userName?.split(" ")[0] ?? "there";

  const features = [
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      desc: "In-app messaging with tags, filters, and read tracking",
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      desc: "Profile, account, appearance, and password",
    },
    {
      label: "Pro",
      href: "/dashboard/pro",
      icon: CreditCard,
      desc: "Subscription-protected premium features",
    },
    ...(organizationsEnabled
      ? [
          {
            label: "Organizations",
            href: "/dashboard/organizations",
            icon: Building2,
            desc: "Teams, members, roles, and invitations",
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-4xl relative">
      <div className="mb-6">
        <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest mb-1">
          User Dashboard
        </p>
        <h1 className="text-xl font-semibold tracking-tight">
          Hey, {firstName}
        </h1>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          These are the features that come built-in. Build your product
          on top of them.
        </p>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-3">
          Features included
        </p>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${features.length}, minmax(0, 1fr))` }}
        >
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href as never}
              className="flex flex-col justify-between gap-2 p-3 group border border-dashed border-border/40 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <f.icon className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors" />
                <ArrowUpRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground/80 transition-colors" />
              </div>
              <div>
                <p className="text-xs font-medium group-hover:text-foreground transition-colors">
                  {f.label}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-snug">
                  {f.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border border-dashed border-border/40 px-4 py-4 mb-16">
        <div className="flex items-start gap-2">
          <Code className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-foreground/80">
              Start building
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Edit{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">
                app/dashboard/page.tsx
              </code>{" "}
              to replace this page with your product&apos;s home experience.
              The layout, auth, and features above are ready to use.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Feedback */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50">
        <div className="bg-background border border-border/40 shadow-xl overflow-hidden flex items-center">
          <FeedbackDialog />
        </div>
      </div>
    </div>
  );
}
