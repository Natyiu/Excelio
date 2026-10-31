import { cookies } from "next/headers";
import { claimGuestLesson } from "@/lib/actions/guest";
import { GUEST_COOKIE } from "@/lib/guest-progress";

/**
 * If this browser finished the guest lesson before signing up, mark it complete and award
 * its XP now, before the dashboard reads progress. Safe to call repeatedly: XP is only
 * ever awarded once per lesson.
 */
export async function claimGuestFromCookie(): Promise<{ xpAwarded: number; lessonTitle: string } | null> {
  const raw = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!raw) return null;
  const [lessonId, hints] = decodeURIComponent(raw).split(":");
  if (!lessonId) return null;
  return claimGuestLesson(lessonId, Number(hints) || 0).catch(() => null);
}
