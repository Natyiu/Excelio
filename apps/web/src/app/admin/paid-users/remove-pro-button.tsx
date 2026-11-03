"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminRemovePro, type RemoveProMode } from "@/lib/actions/admin-subscriptions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Admin controls to cancel a learner's renewal or remove their Pro straight away. */
export function RemoveProButtons({
  userId,
  name,
  lifetime,
  canCancelRenewal,
  periodEnd,
}: {
  userId: string;
  name: string;
  lifetime: boolean;
  /** Recurring plan that will still renew. */
  canCancelRenewal: boolean;
  periodEnd: string;
}) {
  const [mode, setMode] = useState<RemoveProMode | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const end = new Date(periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const confirm = () => {
    if (!mode) return;
    startTransition(async () => {
      const res = await adminRemovePro(userId, mode).catch((e) => ({ ok: false as const, error: String(e) }));
      if (!res.ok) toast.error(res.error);
      else if (res.warning) toast.warning(res.warning, { duration: 12000 });
      else toast.success(mode === "now" ? `Removed Pro from ${name}` : `${name}'s plan won't renew after ${end}`);
      setMode(null);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {canCancelRenewal && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setMode("period_end")}>
          Cancel renewal
        </Button>
      )}
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => setMode("now")}>
        Remove Pro now
      </Button>

      <AlertDialog open={mode !== null} onOpenChange={(o) => !o && !pending && setMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {mode === "now" ? `Remove Pro from ${name}?` : `Cancel ${name}'s renewal?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mode === "period_end"
                ? `Their subscription is cancelled in Polar. They keep Pro until ${end}, then it isn't charged again.`
                : lifetime
                  ? "They lose Pro chapters immediately. This doesn't refund their Lifetime payment; do that in the Polar dashboard if needed."
                  : "Their subscription is revoked in Polar so they aren't charged again, and they lose Pro chapters immediately. This doesn't issue a refund; do that in the Polar dashboard if needed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep Pro</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                confirm();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? "Working…" : mode === "now" ? "Remove Pro" : "Cancel renewal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
