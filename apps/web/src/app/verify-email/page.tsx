import { auth } from "@Batman/auth";
import prisma from "@Batman/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { VerifyEmailForm } from "@/components/verify-email-form";
import { BrandLogo } from "@/components/brand-logo";

export default async function VerifyEmailPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });

  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: { emailVerificationEnabled: true, maintenanceMode: true },
  });

  if (
    settings?.maintenanceMode &&
    (session.user.role as string) !== "admin"
  ) {
    redirect("/maintenance");
  }

  if (!settings?.emailVerificationEnabled || user?.emailVerified) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 flex h-12 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-[0.3em] text-xl font-bold tracking-tight text-brand">
            <BrandLogo />
            Excelio
          </Link>
          <Link
            href="/login"
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-lg font-semibold tracking-tight">
            Verify your email
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            We sent a verification link to <strong>{session.user.email}</strong>.
            Click the link to verify your account and access the app.
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-4">
            Didn&apos;t receive the email? Check your spam folder or resend below.
          </p>
          <VerifyEmailForm email={session.user.email ?? ""} />
        </div>
      </main>
    </div>
  );
}
