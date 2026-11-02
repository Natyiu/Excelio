import { cn } from "@/lib/utils";

/**
 * The Excelio mark shown before the wordmark. Sized in `em` so it scales with the text
 * next to it, so the logo and the word stay in proportion. To make the pair bigger, raise
 * the font size on the parent rather than the logo's height. Pair with `gap-[0.3em]`.
 */
export function BrandLogo({ className }: { className?: string }) {
  return <img src="/logo.png" alt="" aria-hidden className={cn("h-[1.2em] w-auto shrink-0", className)} />;
}
