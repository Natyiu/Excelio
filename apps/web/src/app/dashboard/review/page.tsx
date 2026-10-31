import Link from "next/link";
import { ArrowLeft01Icon as Back } from "@hugeicons/react";
import { getMyTestimonial } from "@/lib/actions/testimonials";
import { Mascot } from "@/components/mascot";
import { ReviewForm } from "./review-form";

/** Learners leave (or edit) a review here; approved ones appear on the homepage. */
export default async function ReviewPage() {
  const mine = await getMyTestimonial().catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
          <Back className="h-4 w-4" /> Learn
        </Link>
        <div className="flex items-center gap-4">
          <Mascot mood="cheer" size={72} />
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Enjoying Excelio?</h1>
            <p className="text-[15px] text-muted-foreground">Your words help other people decide to start learning Excel.</p>
          </div>
        </div>
      </div>
      <ReviewForm
        initial={mine ? { quote: mine.quote, displayName: mine.displayName, location: mine.location, approved: mine.approved } : null}
      />
    </div>
  );
}
