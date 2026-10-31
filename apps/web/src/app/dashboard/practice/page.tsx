import { redirect } from "next/navigation";

/** Practice opens straight onto its start screen, on the Beginner tab. */
export default function PracticeIndexPage() {
  redirect("/dashboard/practice/beginner" as never);
}
