import { redirect } from "next/navigation";

/** Onboarding was removed: learners go straight to their dashboard. */
export default function OnboardingPage() {
  redirect("/dashboard");
}
