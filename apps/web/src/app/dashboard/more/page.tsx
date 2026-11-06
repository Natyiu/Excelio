import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Settings02Icon as Gear } from "@hugeicons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Panel, SectionTitle } from "@/components/game-ui";
import { AppearanceRow, ReplayTourRow, SignOutButton } from "./more-actions";
import { MORE_GROUPS, SettingRow } from "./more-rows";

/** Everything outside the main learning nav: account, help, appearance and sign-out. */
export default async function MorePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const isAdmin = (user as { role?: string } | undefined)?.role === "admin";

  return (
    <div className="space-y-8">
      {/* Account card */}
      <Link
        href="/dashboard/profile"
        className="group flex items-center gap-4 rounded-3xl border-2 border-b-[5px] border-border bg-card p-5 transition-colors hover:border-brand"
      >
        <Avatar className="h-16 w-16 border-4 border-brand-soft">
          <AvatarImage src={user?.image || undefined} />
          <AvatarFallback className="bg-brand-soft text-xl font-bold text-brand">{user?.name?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold">{user?.name}</p>
          <p className="truncate text-[14px] text-muted-foreground">{user?.email}</p>
        </div>
        <span className="text-sm font-bold text-brand group-hover:underline">View profile</span>
      </Link>

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
          {isAdmin && <SettingRow row={{ label: "Admin panel", hint: "Manage the platform", href: "/admin", icon: Gear, colour: "#475569" }} />}
        </Panel>
      </section>

      <SignOutButton />
    </div>
  );
}
