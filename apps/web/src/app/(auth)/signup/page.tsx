import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthConfig } from "@/lib/actions/user";
import { SignUpForm } from "@/components/sign-up-form";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ claim?: string }> }) {
  const { claim } = await searchParams;
  const authConfig = await getAuthConfig();
  if (!authConfig.signupsEnabled) {
    redirect("/login?message=signups-disabled");
  }

  return (
    <div>
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold tracking-tight">{claim ? "Claim your XP" : "Create your free account"}</h1>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          {claim ? "Sign up free to keep your progress." : "Learn Excel by doing, for free."}
        </p>
      </div>

      <SignUpForm />

      <p className="mt-4 text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link href={claim ? "/login?claim=1" : "/login"} className="font-bold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
