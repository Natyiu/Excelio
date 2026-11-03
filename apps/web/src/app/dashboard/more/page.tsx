import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight01Icon as Chevron,
  Mail01Icon as Mail,
  PencilEdit02Icon as Pencil,
  PaintBoardIcon as Paint,
  Settings02Icon as Gear,
  UserCircleIcon as Account,
  UserGroupIcon as Team,
  MessageAdd01Icon as Feedback,
} from "@hugeicons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Panel, SectionTitle } from "@/components/game-ui";
import { AppearanceRow, SignOutButton } from "./more-actions";

type Row = { label: string; hint: string; href: string; icon: ComponentType<{ className?: string }>; colour: string };

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "Account",
    rows: [
      { label: "Edit profile", hint: "Photo, name and bio", href: "/dashboard/settings", icon: Pencil, colour: "#0d9488" },
      { label: "Account settings", hint: "Password, sessions and account deletion", href: "/dashboard/settings/account", icon: Account, colour: "#1d9a52" },
      { label: "Appearance", hint: "Theme and display", href: "/dashboard/settings/appearance", icon: Paint, colour: "#db2777" },
    ],
  },
  {
    title: "Teams",
    rows: [
      { label: "Organizations", hint: "Learn together with your team", href: "/dashboard/organizations", icon: Team, colour: "#0284c7" },
      { label: "Invitations", hint: "Invites waiting for you", href: "/dashboard/invitations", icon: Mail, colour: "#7c3aed" },
    ],
  },
  {
    title: "Help",
    rows: [
      { label: "Tell us your feedback", hint: "Ideas, bugs, anything. We read every message", href: "/dashboard/feedback", icon: Feedback, colour: "#ea580c" },
    ],
  },
];

/** Everything outside the main learning nav: account, teams, appearance and sign-out. */
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

      {GROUPS.map((g) => (
        <section key={g.title}>
          <SectionTitle>{g.title}</SectionTitle>
          <Panel className="divide-y-2 divide-border overflow-hidden">
            {g.rows.map((r) => (
              <SettingRow key={r.href} row={r} />
            ))}
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

function SettingRow({ row }: { row: Row }) {
  const Icon = row.icon;
  return (
    <Link href={row.href as never} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: row.colour, boxShadow: `0 3px 0 color-mix(in oklab, ${row.colour} 60%, black)` }}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{row.label}</span>
        <span className="block truncate text-[13px] text-muted-foreground">{row.hint}</span>
      </span>
      <Chevron className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
