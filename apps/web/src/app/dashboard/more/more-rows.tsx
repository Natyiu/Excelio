import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight01Icon as Chevron,
  PencilEdit02Icon as Pencil,
  PaintBoardIcon as Paint,
  UserCircleIcon as Account,
  MessageAdd01Icon as Feedback,
  Note01Icon as CheatSheet,
} from "@hugeicons/react";

export type MoreRow = { label: string; hint: string; href: string; /** Where a guest goes instead. */ guestHref?: string; icon: ComponentType<{ className?: string }>; colour: string };

export const MORE_GROUPS: { title: string; rows: MoreRow[] }[] = [
  {
    title: "Reference",
    rows: [
      { label: "Cheat sheet", hint: "Every formula and keyboard shortcut", href: "/dashboard/cheat-sheet", guestHref: "/start/cheat-sheet", icon: CheatSheet, colour: "#0284c7" },
    ],
  },
  {
    title: "Account",
    rows: [
      { label: "Edit profile", hint: "Photo, name and bio", href: "/dashboard/settings", icon: Pencil, colour: "#0d9488" },
      { label: "Account settings", hint: "Password, sessions and account deletion", href: "/dashboard/settings/account", icon: Account, colour: "#1d9a52" },
      { label: "Appearance", hint: "Theme and display", href: "/dashboard/settings/appearance", icon: Paint, colour: "#db2777" },
    ],
  },
  {
    title: "Help",
    rows: [
      { label: "Tell us your feedback", hint: "Ideas, bugs, anything. We read every message", href: "/dashboard/feedback", icon: Feedback, colour: "#ea580c" },
    ],
  },
];

export function SettingRow({ row, guest = false }: { row: MoreRow; guest?: boolean }) {
  const Icon = row.icon;
  return (
    <Link href={((guest && row.guestHref) || row.href) as never} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50">
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
