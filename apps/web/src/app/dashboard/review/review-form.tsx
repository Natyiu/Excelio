"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loading03Icon as Loader, StarIcon as Star, Tick02Icon as Tick } from "@hugeicons/react";
import { submitTestimonial } from "@/lib/actions/testimonials";
import { Field, SettingsCard, fieldClass } from "@/app/dashboard/settings/settings-ui";
import { pressable } from "@/components/game-ui";
import { cn } from "@/lib/utils";

export function ReviewForm({
  initial,
}: {
  initial: { quote: string; displayName: string; location: string; approved: boolean } | null;
}) {
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [consent, setConsent] = useState(Boolean(initial));
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await submitTestimonial({ quote, displayName, location, consent: consent as true });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border-2 border-b-[5px] border-border bg-card p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_4px_0_var(--brand-deep)]">
          <Tick className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-xl font-bold">Thank you!</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">We&apos;ll review it shortly. Once it&apos;s approved it may appear on our homepage.</p>
      </div>
    );
  }

  return (
    <SettingsCard
      icon={Star}
      colour="#d97706"
      title="Your review"
      hint={initial?.approved ? "Your review is live. Editing it sends it back for a quick check." : "A sentence or two about what Excelio has helped you with."}
      footer={
        <button type="button" onClick={submit} disabled={pending} className={pressable("brand", "px-6")}>
          {pending ? <Loader className="h-4 w-4 animate-spin" /> : initial ? "Update review" : "Send review"}
        </button>
      }
    >
      <Field id="quote" label="What would you tell a friend about Excelio?" note={`${quote.trim().length}/400`}>
        <textarea
          id="quote"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          maxLength={400}
          rows={4}
          placeholder="e.g. Typing the formulas myself is what finally made XLOOKUP click."
          className={cn(fieldClass, "h-auto resize-none py-3")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="displayName" label="Show my name as">
          <input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} placeholder="First name, last initial" className={fieldClass} />
        </Field>
        <Field id="location" label="Where you're from">
          <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={60} placeholder="City, Country" className={fieldClass} />
        </Field>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-border p-3.5 text-[14px]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--brand)]" />
        <span>I agree that Excelio may show this review, with the name and place above, on its website.</span>
      </label>
    </SettingsCard>
  );
}
