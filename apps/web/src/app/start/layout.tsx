import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@Batman/auth";
import { ExcelDashboardShell } from "@/components/excel-dashboard-shell";
import { GuestGate } from "@/components/guest-gate";

/** The app as a visitor without an account sees it: every page to look at, and a prompt to sign in to use them. */
export default async function StartLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (session?.user) redirect("/dashboard");

  return (
    <ExcelDashboardShell>
      <GuestGate>{children}</GuestGate>
    </ExcelDashboardShell>
  );
}
