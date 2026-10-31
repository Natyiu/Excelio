"use client";

import { useEffect } from "react";

/** On load, scrolls the element with `targetId` to the top of the page — used to land on the current chapter. */
export function ScrollIntoView({ targetId }: { targetId: string }) {
  useEffect(() => {
    document.getElementById(targetId)?.scrollIntoView({ block: "start" });
  }, [targetId]);
  return null;
}
