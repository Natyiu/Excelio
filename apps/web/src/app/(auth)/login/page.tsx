import type { Metadata } from "next";
import { Suspense } from "react";
import { getAuthConfig } from "@/lib/actions/user";
import { LoginPageContent } from "@/components/login-page-content";

export const metadata: Metadata = {
  title: "Sign in | Excelio",
  description: "Sign in to Excelio to keep learning Excel and keep your streak going.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage() {
  const authConfig = await getAuthConfig();

  return (
    <Suspense fallback={<div className="h-8" />}>
      <LoginPageContent signupsEnabled={authConfig.signupsEnabled} />
    </Suspense>
  );
}
