import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { pressable } from "@/components/game-ui";

export default function FunctionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-apple text-foreground antialiased">
      <header className="sticky top-0 z-40 border-b-2 border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="inline-flex items-center gap-[0.3em] text-2xl font-bold tracking-tight text-brand">
            <BrandLogo className="h-[1.4em] -rotate-[10deg]" />
            Excelio
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href={"/article" as never} className="px-2 text-[15px] font-semibold text-muted-foreground hover:text-foreground">Articles</Link>
            <Link href={"/learn-excel" as never} className="hidden px-2 text-[15px] font-semibold text-muted-foreground hover:text-foreground sm:block">Guide</Link>
            <Link href={"/start" as never} className={pressable("brand", "px-4 py-2 text-sm")}>Start free</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t-2 border-border py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-1 px-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Excelio</Link>
          <Link href={"/excel-data-analysis" as never} className="hover:text-foreground">Data analysis</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
