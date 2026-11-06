import { Panel, SectionTitle, pressable } from "@/components/game-ui";
import { Mascot } from "@/components/mascot";
import { AppearanceRow, ReplayTourRow } from "@/app/dashboard/more/more-actions";
import { MORE_GROUPS, SettingRow } from "@/app/dashboard/more/more-rows";

export default function GuestMorePage() {
  return (
    <div className="space-y-8">
      <Panel className="flex flex-wrap items-center gap-4 p-5">
        <Mascot mood="wave" size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold">You&apos;re browsing as a guest</p>
          <p className="text-[14px] text-muted-foreground">Create a free account to save your progress.</p>
        </div>
        <button type="button" className={pressable("brand", "px-5")}>
          Sign in
        </button>
      </Panel>

      {MORE_GROUPS.map((g) => (
        <section key={g.title}>
          <SectionTitle>{g.title}</SectionTitle>
          <Panel className="divide-y-2 divide-border overflow-hidden">
            {g.rows.map((r) => (
              <SettingRow key={r.href} row={r} />
            ))}
            {g.title === "Help" && <ReplayTourRow />}
          </Panel>
        </section>
      ))}

      <section>
        <SectionTitle>Preferences</SectionTitle>
        <Panel className="divide-y-2 divide-border overflow-hidden">
          <AppearanceRow />
        </Panel>
      </section>
    </div>
  );
}
