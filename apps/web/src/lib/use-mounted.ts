"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True once the client has hydrated, false during SSR and the first client
 * render. Used to defer theme-dependent UI until it's safe to read `theme`
 * without a hydration mismatch.
 *
 * Implemented via useSyncExternalStore rather than `useState` + `useEffect(()
 * => setMounted(true), [])` — the effect version calls setState synchronously
 * from the effect body, which is exactly the pattern React's "no setState in
 * effects" lint rule flags. useSyncExternalStore's server/client snapshots
 * give the same one-render-after-hydration behavior without it.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
