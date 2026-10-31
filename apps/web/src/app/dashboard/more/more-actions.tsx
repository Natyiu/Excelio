"use client";

import { useTheme } from "next-themes";
import { Logout03Icon as Logout, Moon02Icon as Moon, Sun03Icon as Sun } from "@hugeicons/react";
import { authClient } from "@/lib/auth-client";
import { useMounted } from "@/lib/use-mounted";
import { pressable } from "@/components/game-ui";
import { cn } from "@/lib/utils";

/** A dark-mode row with a real switch. */
export function AppearanceRow() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const Icon = isDark ? Moon : Sun;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-[0_3px_0_#1e293b]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Dark mode</span>
        <span className="block text-[13px] text-muted-foreground">{isDark ? "On" : "Off"}</span>
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", isDark ? "bg-brand" : "bg-muted")}>
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left]", isDark ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() =>
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = "/";
            },
          },
        })
      }
      className={pressable("danger", "w-full py-3")}
    >
      <Logout className="h-5 w-5" />
      Sign out
    </button>
  );
}
