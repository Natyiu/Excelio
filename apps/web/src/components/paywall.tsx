"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Cancel01Icon as Close, Loading03Icon as Loader } from "@hugeicons/react";
import { createCheckoutSession } from "@/lib/actions/polar";
import { PRO_LIFETIME, PRO_MONTHLY, PRO_YEARLY, PRO_YEARLY_PER_MONTH, YEARLY_SAVING_PERCENT, money, type Billing } from "@/lib/plans";
import { Mascot } from "@/components/mascot";
import { pressable } from "@/components/game-ui";
import { cn } from "@/lib/utils";

/**
 * The Pro paywall: two ways to pay, one Upgrade button. `products` are the Polar product
 * ids for each billing period; when one is missing, Upgrade explains payments aren't set up.
 */
export function Paywall({
  products,
  initialBilling = "yearly",
  heading = "Unlock the rest of the course",
  sub = "You've finished the free chapters. Go Pro to keep learning, from Named Ranges all the way to LAMBDA.",
  closeHref = "/dashboard",
}: {
  products: Partial<Record<Billing, string>>;
  initialBilling?: Billing;
  heading?: string;
  sub?: string;
  closeHref?: string;
}) {
  const [billing, setBilling] = useState<Billing>(initialBilling);
  const [loading, setLoading] = useState(false);

  const options: { id: Billing; title: string; note: string; price: string; per: string; badge?: string }[] = [
    {
      id: "yearly",
      title: "Yearly",
      note: `${money(PRO_YEARLY)}, billed once a year`,
      price: money(PRO_YEARLY_PER_MONTH),
      per: "/month",
      badge: `Most popular · Save ${YEARLY_SAVING_PERCENT}%`,
    },
    { id: "lifetime", title: "Lifetime", note: "Pay once, yours forever", price: money(PRO_LIFETIME), per: " one-time" },
    { id: "monthly", title: "Monthly", note: "Flexible, cancel anytime", price: money(PRO_MONTHLY), per: "/month" },
  ];

  async function upgrade() {
    const productId = products[billing];
    if (!productId) {
      toast.error("Payments aren't set up yet. Please try again later.");
      return;
    }
    setLoading(true);
    try {
      const result = await createCheckoutSession(productId, window.location.origin);
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.error ?? "Couldn't start checkout");
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-brand-soft/50 px-4 py-12">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:72px_32px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <Link
        href={closeHref as never}
        aria-label="Close"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Close className="h-6 w-6" />
      </Link>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center">
          <Mascot mood="trophy" size={130} />
        </div>
        <div className="mt-2 rounded-3xl border-2 border-b-[6px] border-border bg-card p-6 sm:p-8">
          <p className="text-[13px] font-bold uppercase tracking-wide text-brand">Excelio Pro</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{sub}</p>

          <div role="radiogroup" aria-label="Billing period" className="mt-6 space-y-3">
            {options.map((o) => {
              const on = billing === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setBilling(o.id)}
                  className={cn(
                    "relative flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 px-4 py-4 text-left transition-colors",
                    on ? "border-brand bg-brand-soft" : "border-border hover:bg-muted/50"
                  )}
                >
                  {o.badge && (
                    <span className="absolute -top-3 right-4 rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-bold text-brand-foreground">
                      {o.badge}
                    </span>
                  )}
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", on ? "border-brand" : "border-border")}>
                    {on && <span className="h-3 w-3 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-bold">{o.title}</span>
                    <span className="block text-[14px] text-muted-foreground">{o.note}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="text-xl font-extrabold tabular-nums">{o.price}</span>
                    <span className="text-[13px] text-muted-foreground">{o.per}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <button type="button" onClick={upgrade} disabled={loading} className={pressable("brand", "mt-6 w-full py-3.5 text-lg font-bold")}>
            {loading ? <Loader className="h-5 w-5 animate-spin" /> : "Upgrade"}
          </button>
          <p className="mt-4 text-center text-[13px] text-muted-foreground">
            {billing === "lifetime" ? "One payment, no renewals. Secure checkout." : "Cancel anytime. Secure checkout."}
          </p>
        </div>
      </div>
    </div>
  );
}
