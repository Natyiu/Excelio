import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";


export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 flex h-12 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-[0.3em] text-xl font-bold tracking-tight text-brand">
            <BrandLogo />
            Excelio
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/blog"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/login"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/40 py-4">
        <div className="max-w-2xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/40">
          <span>&copy; {new Date().getFullYear()} Excelio</span>
          <Link href="/legal/privacy" className="hover:text-muted-foreground/60 transition-colors">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-muted-foreground/60 transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
