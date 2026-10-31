"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";

export function LoginPageContent({
  signupsEnabled,
}: {
  signupsEnabled: boolean;
}) {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const claim = searchParams.get("claim");

  return (
    <div>
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold tracking-tight">{claim ? "Claim your XP" : "Welcome back"}</h1>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          {claim ? "Log in to keep your progress." : "Log in to keep your streak going."}
        </p>
        {message === "signups-disabled" && (
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
            Registration is currently closed.
          </p>
        )}
      </div>

      <SignInForm />

      {signupsEnabled ? (
        <p className="mt-4 text-center text-[13px] text-muted-foreground">
          New to Excelio?{" "}
          <Link href={claim ? "/signup?claim=1" : "/signup"} className="font-bold text-brand hover:underline">
            Create an account
          </Link>
        </p>
      ) : (
        <p className="mt-4 text-center text-[13px] text-muted-foreground">
          Registration is currently closed.
        </p>
      )}
    </div>
  );
}
