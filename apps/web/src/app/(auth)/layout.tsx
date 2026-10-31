import { auth } from "@Batman/auth";
import prisma from "@Batman/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandCardLayout } from "@/components/brand-card-layout";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: { emailVerificationEnabled: true, maintenanceMode: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });
    if (settings?.emailVerificationEnabled && user && !user.emailVerified) {
      redirect("/verify-email");
    }
    if (
      settings?.maintenanceMode &&
      (session.user.role as string) !== "admin"
    ) {
      redirect("/maintenance");
    }
    redirect("/dashboard");
  }

  return (
    <BrandCardLayout aside={<Link href="/" className="text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground">Back to home</Link>}>
      {children}
    </BrandCardLayout>
  );
}
