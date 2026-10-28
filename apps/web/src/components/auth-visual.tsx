const BAT_PATH =
  "M50 0C50 0 42 14 30 18C18 22 0 18 0 18C0 18 12 28 20 32C28 36 50 40 50 40C50 40 72 36 80 32C88 28 100 18 100 18C100 18 82 22 70 18C58 14 50 0 50 0Z";

const VARIANTS = {
  auth: {
    quote: "The night is darkest just before the deploy.",
    lines: [
      { prompt: true, text: "better-auth.signIn()" },
      { text: "✓ session created" },
      { text: "✓ redirecting to /dashboard" },
    ],
  },
  payment: {
    quote: "Even Wayne Enterprises needs recurring revenue.",
    lines: [
      { prompt: true, text: "polar.checkout()" },
      { text: "✓ payment confirmed" },
      { text: "✓ subscription active" },
    ],
  },
} as const;

export function AuthVisual({ variant = "auth" }: { variant?: keyof typeof VARIANTS }) {
  const { quote, lines } = VARIANTS[variant];

  return (
    <div className="relative h-full w-full overflow-hidden bg-foreground/2 dark:bg-foreground/4">
      <div className="bg-grid" />
      <div className="matrix-rain" />
      <div className="matrix-rain-2" />
      <div className="bg-glow" />

      {/* Ghost bat watermark — the one big shape in the composition */}
      <svg
        viewBox="0 0 100 40"
        fill="currentColor"
        aria-hidden
        className="ghost-drift absolute -bottom-[8%] -right-[12%] h-[65%] w-auto text-foreground/[0.035] dark:text-foreground/[0.06]"
      >
        <path d={BAT_PATH} />
      </svg>

      {/* Terminal centerpiece */}
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <div className="w-full max-w-[280px] border border-border/50 bg-background/70 backdrop-blur-[2px] shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-border/50 px-3 py-2">
            <span aria-hidden className="size-2 rounded-full bg-[#ff5f56]" />
            <span aria-hidden className="size-2 rounded-full bg-[#ffbd2e]" />
            <span aria-hidden className="size-2 rounded-full bg-[#27c93f]" />
          </div>
          <div className="px-3.5 py-3 font-mono text-[11px] leading-relaxed">
            {lines.map((line, i) => (
              <p
                key={i}
                className="term-line-in text-foreground/70"
                style={{ animationDelay: `${i * 0.5 + 0.3}s` }}
              >
                {"prompt" in line && line.prompt ? (
                  <>
                    <span className="text-foreground/40 select-none">$ </span>
                    {line.text}
                  </>
                ) : (
                  <span className="text-foreground/50">{line.text}</span>
                )}
              </p>
            ))}
            <p
              className="term-line-in text-foreground/40"
              style={{ animationDelay: `${lines.length * 0.5 + 0.3}s` }}
            >
              <span className="term-cursor">▊</span>
            </p>
          </div>
        </div>
      </div>

      {/* Edge fades so the panel blends into the divider/border */}
      <div className="absolute inset-y-0 left-0 w-16 bg-linear-to-r from-background to-transparent" />
      <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent" />

      <div className="absolute bottom-8 left-8 right-8">
        <p className="text-[10px] font-mono text-foreground/35 dark:text-foreground/60 italic leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}
