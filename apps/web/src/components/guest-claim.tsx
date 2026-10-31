"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { claimGuestLesson } from "@/lib/actions/guest";
import { clearGuestLesson, readGuestLesson } from "@/lib/guest-progress";

/**
 * Finishes carrying over a lesson done before signing up. Usually the server has already
 * claimed it (`claimed`); this just celebrates and tidies up. If the cookie was missing,
 * it claims from this browser's storage instead.
 */
export function GuestClaim({ claimed }: { claimed?: { xpAwarded: number; lessonTitle: string } | null }) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const celebrate = (res: { xpAwarded: number; lessonTitle: string } | null) => {
      clearGuestLesson();
      if (res && res.xpAwarded > 0) {
        toast.success(`+${res.xpAwarded} XP claimed`, { description: `"${res.lessonTitle}" is saved to your account.` });
        // The stats rail was drawn alongside the page; refresh it once.
        router.refresh();
      }
    };

    if (claimed) {
      celebrate(claimed);
      return;
    }
    const pending = readGuestLesson();
    if (!pending) return;
    claimGuestLesson(pending.lessonId, pending.hintCount)
      .then(celebrate)
      .catch(() => {
        // Leave it stored; it'll be tried again on the next visit.
      });
  }, [claimed, router]);

  return null;
}
