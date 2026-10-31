"use client";

import { useTheme } from "next-themes";
import {
  ComputerIcon as Monitor,
  Moon02Icon as Moon,
  PaintBoardIcon as Paint,
  Sun03Icon as Sun,
  Tick02Icon as Tick,
} from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { SettingsCard } from "../settings-ui";

// Each preview is a tiny app window: background, card and an accent bar.
const LIGHT = { bg: "#ffffff", card: "#f1f5f4", line: "#dbe3e0" };
const DARK = { bg: "#131f24", card: "#202f36", line: "#37464f" };

const themes = [
  { id: "light", label: "Light", icon: Sun, halves: [LIGHT, LIGHT] },
  { id: "dark", label: "Dark", icon: Moon, halves: [DARK, DARK] },
  { id: "system", label: "System", icon: Monitor, halves: [LIGHT, DARK] },
] as const;

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <SettingsCard icon={Paint} colour="#db2777" title="Theme" hint="Pick how Excelio looks. System follows your device.">
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => {
          const isActive = mounted && theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={isActive}
              className={cn(
                "group rounded-2xl border-2 border-b-4 p-2 text-left transition-transform active:translate-y-0.5",
                isActive ? "border-brand bg-brand-soft" : "border-border hover:bg-muted/50",
              )}
            >
              <ThemePreview halves={t.halves} />
              <span className="mt-2.5 flex items-center gap-2 px-1 pb-0.5">
                <t.icon className={cn("h-4 w-4", isActive ? "text-brand" : "text-muted-foreground")} />
                <span className={cn("flex-1 text-sm font-bold", isActive ? "text-brand" : "text-foreground")}>{t.label}</span>
                {isActive && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
                    <Tick className="h-3 w-3" />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </SettingsCard>
  );
}

function ThemePreview({ halves }: { halves: readonly [typeof LIGHT, typeof LIGHT] }) {
  return (
    <span className="flex h-20 overflow-hidden rounded-xl border-2 border-border">
      {halves.map((c, i) => (
        <span key={i} className="flex flex-1 flex-col gap-1.5 p-2" style={{ background: c.bg }}>
          {i === 0 || halves[0] !== halves[1] ? (
            <span className="h-2 w-8 rounded-full bg-[#22c55e]" />
          ) : (
            <span className="h-2 w-6 rounded-full" style={{ background: c.line }} />
          )}
          <span className="flex-1 rounded-md" style={{ background: c.card }} />
          <span className="h-1.5 w-3/4 rounded-full" style={{ background: c.line }} />
        </span>
      ))}
    </span>
  );
}
