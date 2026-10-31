import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar, AdminMobileNav } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    // Inside the admin, "primary" buttons and badges use the brand green, like the rest of the app.
    <div
      className="min-h-screen bg-background font-apple text-foreground antialiased"
      style={{ "--primary": "var(--brand)", "--primary-foreground": "var(--brand-foreground)", "--ring": "var(--brand)" } as React.CSSProperties}
    >
      <AdminSidebar />
      <div className="min-w-0 px-4 py-6 md:ml-60 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">
          <AdminMobileNav />
          {children}
        </div>
      </div>
    </div>
  );
}
