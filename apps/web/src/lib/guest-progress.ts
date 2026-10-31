/**
 * A lesson finished before signing up, remembered in this browser so its XP can be
 * claimed once the learner has an account. Only the lesson id and hints used are kept;
 * the server decides how much XP it's worth.
 */
export interface GuestLesson {
  lessonId: string;
  hintCount: number;
  finishedAt: string;
}

const KEY = "gridmaster:guest-lesson";
/** Same lesson, as a cookie, so the server can claim it before the dashboard renders. */
export const GUEST_COOKIE = "gm_guest_lesson";

export function saveGuestLesson(lessonId: string, hintCount: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ lessonId, hintCount, finishedAt: new Date().toISOString() } satisfies GuestLesson));
  } catch {
    // Private mode or storage blocked.
  }
  try {
    document.cookie = `${GUEST_COOKIE}=${encodeURIComponent(`${lessonId}:${hintCount}`)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  } catch {
    // Private mode or storage blocked: the learner just won't get the XP carried over.
  }
}

export function readGuestLesson(): GuestLesson | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestLesson>;
    return typeof parsed.lessonId === "string" ? { lessonId: parsed.lessonId, hintCount: Number(parsed.hintCount) || 0, finishedAt: String(parsed.finishedAt ?? "") } : null;
  } catch {
    return null;
  }
}

export function clearGuestLesson() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
  try {
    document.cookie = `${GUEST_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // nothing to clear
  }
}

/** XP for a lesson: full reward without hints, 70% (at least 5) with them. Matches the server. */
export function lessonXp(xpReward: number, hintCount: number) {
  return hintCount === 0 ? xpReward : Math.max(Math.floor(xpReward * 0.7), 5);
}
