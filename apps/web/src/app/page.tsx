import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight01Icon as Arrow,
  CheckmarkCircle02Icon as Check,
  FireIcon as Flame,
  FlashIcon as Zap,
  Award01Icon as Award,
  RankingIcon as Ranking,
  CursorPointer01Icon as Pointer,
} from "@hugeicons/react";
import { COURSES } from "@/data/lessons";
import { getApprovedTestimonials } from "@/lib/actions/testimonials";
import { FEATURED_TESTIMONIALS } from "@/data/testimonials";
import { LEVELS } from "@/components/level-picker";
import { Mascot } from "@/components/mascot";
import { SheetDemo } from "@/components/learning/sheet-demo";
import { pressable } from "@/components/game-ui";
import { ACHIEVEMENT_ICONS, achievementColour } from "@/components/achievement-icons";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { SITE_URL } from "@/lib/site-url";

// The demo in the "learn by doing" section: a receipt that gets totalled.
const DEMO = [
  "| Item | Qty | Price | Total |",
  "| Coffee | 3 | 4 | |",
  "| Bagel | 2 | 3 | |",
  "| Juice | 4 | 5 | |",
  "cell C3: Every cell has an address, like C3",
  "type D2 =B2*C2: A formula starts with = and does the maths",
  "fill D2 D4: Copy it down and the references follow",
  "type D5 =SUM(D2:D4): SUM adds up a whole range",
];

// The functions shown under the hero button, in the sheet's reference colours.
const TOPICS = [
  { fn: "SUM", label: "Formulas and SUM", colour: "#22a95b" },
  { fn: "IF", label: "IF, AND and OR", colour: "#a855f7" },
  { fn: "XLOOKUP", label: "Lookups", colour: "#f59e0b" },
  { fn: "FILTER", label: "Dynamic arrays", colour: "#0ea5e9" },
  { fn: "LAMBDA", label: "Your own functions", colour: "#ef4444" },
];

const STEPS: { title: string; body: string; mood: "teach" | "think" | "cheer" }[] = [
  { title: "See it", body: "Gridley shows you one idea at a time, acted out on a real sheet.", mood: "teach" },
  { title: "Try it", body: "Type the formula yourself. The sheet checks your answer as you go.", mood: "think" },
  { title: "Keep it", body: "Earn XP, grow your streak and clear challenges so it sticks.", mood: "cheer" },
];

// The three stages with their lesson and chapter counts, for the numbers section.
const STAGES = LEVELS.map((l) => {
  const chapters = COURSES.filter((c) => c.difficulty === l.id);
  return { ...l, chapters: chapters.length, lessons: chapters.reduce((n, c) => n + c.lessons.length, 0) };
});

// Accent colours for the testimonial cards, in turn.
const QUOTE_COLOURS = [{ base: "#1d9a52" }, { base: "#f59e0b" }, { base: "#7c3aed" }];

// The three reasons in the "Why Excelio" section.
const REASONS = [
  {
    icon: Pointer,
    title: "Learn by doing, not watching",
    body: "Type every Excel formula into a real spreadsheet instead of scrolling through video tutorials. VLOOKUP and XLOOKUP click because you've used them yourself.",
    tag: "Beginner friendly",
    colour: { base: "#1d9a52", deep: "#0d6b37" },
  },
  {
    icon: Flame,
    title: "Five minutes a day",
    body: "Bite-sized Excel lessons, practice exercises and daily challenges turn learning Excel into a habit you'll actually keep.",
    tag: "Daily habit",
    colour: { base: "#d97706", deep: "#92400e" },
  },
  {
    icon: Zap,
    title: "Skills you'll use at work",
    body: "From IF and SUMIFS to FILTER, dynamic arrays and LAMBDA, learn the Excel skills employers ask for and build reports in minutes, not afternoons.",
    tag: "Beginner to advanced",
    colour: { base: "#7c3aed", deep: "#5b21b6" },
  },
];

// Colours for the A, B, C step badges.
const STEP_COLOURS = [
  { base: "#1d9a52", deep: "#0d6b37" },
  { base: "#7c3aed", deep: "#5b21b6" },
  { base: "#d97706", deep: "#92400e" },
];

const lessonCount = COURSES.reduce((n, c) => n + c.lessons.length, 0);

const SEO_TITLE = "Learn Excel Online Free: Interactive Excel Course | Excelio";
const SEO_DESCRIPTION = `Learn Excel online, free to start: ${lessonCount} interactive lessons in a real spreadsheet. Excel formulas, IF, VLOOKUP, XLOOKUP and more, beginner to advanced.`;

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: [
    "learn Excel",
    "learn Excel online",
    "learn Excel online free",
    "Excel course",
    "free Excel course",
    "online Excel course",
    "Excel training",
    "Excel tutorial",
    "Excel formulas",
    "Excel for beginners",
    "advanced Excel",
    "Excel practice",
    "Excel exercises",
    "VLOOKUP",
    "XLOOKUP",
    "Excel functions",
  ],
  alternates: { canonical: "/" },
  openGraph: { title: SEO_TITLE, description: SEO_DESCRIPTION, type: "website", url: "/", siteName: "Excelio" },
  twitter: { card: "summary_large_image", title: SEO_TITLE, description: SEO_DESCRIPTION },
};

/** Course details for search engines (schema.org), built from the real curriculum. */
const COURSE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Learn Excel Online: Beginner to Advanced Excel Course",
  description: SEO_DESCRIPTION,
  url: `${SITE_URL}/`,
  inLanguage: "en",
  provider: { "@type": "Organization", name: "Excelio", sameAs: SITE_URL },
  educationalLevel: "Beginner to Advanced",
  teaches: COURSES.map((c) => c.title),
  hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `${lessonCount} lessons` },
  // The first chapters are free; Pro unlocks the rest.
  offers: { "@type": "Offer", category: "Partially Free", price: 0, priceCurrency: "USD" },
};

/** Who publishes the site, and the site itself, for search engines. */
const SITE_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Excelio",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Excelio",
    url: SITE_URL,
  },
];

/** Questions people search for, answered on the page and marked up as an FAQ. */
const FAQS = [
  {
    q: "What is the best way to learn Excel online?",
    a: "By using it. Watching tutorials feels productive, but formulas only stick once you type them yourself. Excelio puts every lesson inside a real spreadsheet, so you practise Excel formulas and functions from the first minute instead of watching someone else do it.",
  },
  {
    q: "Can I learn Excel online for free?",
    a: "Yes. The first chapters of the Excelio Excel course are free, with no credit card: Excel basics, entering data and your first formulas. Excelio Pro unlocks the full course, from lookups and dynamic arrays to LAMBDA and Power Query.",
  },
  {
    q: "Is this Excel course good for beginners?",
    a: "Yes. It starts from zero: what a cell, row and column are, how to enter data and how to write your first formula. Each lesson teaches one idea at a time, so complete beginners can follow along without feeling lost.",
  },
  {
    q: "How long does it take to learn Excel?",
    a: `Most people learn the Excel basics in a week of short daily practice. Each Excelio lesson takes about five minutes, and the full course has ${lessonCount} lessons across ${COURSES.length} chapters, so you can go from beginner to advanced Excel in a few weeks at your own pace.`,
  },
  {
    q: "Which Excel formulas and functions will I learn?",
    a: "The ones you'll use at work: SUM, AVERAGE, IF, AND, OR, COUNTIF, SUMIFS, VLOOKUP, XLOOKUP and INDEX MATCH, plus sorting, filtering, removing duplicates, conditional formatting, Excel tables, dynamic arrays like FILTER, SORT and UNIQUE, and LET and LAMBDA.",
  },
  {
    q: "Do I need Microsoft Excel installed?",
    a: "No. Every lesson runs in a spreadsheet in your browser, on a computer or phone. What you learn works the same in Microsoft Excel, Excel for the web and Microsoft 365, and most formulas work in Google Sheets too.",
  },
  {
    q: "How is Excelio different from Excel video tutorials?",
    a: "There are no videos to sit through. Instead of watching a tutorial and forgetting it, you solve short Excel exercises, get instant feedback on your formula, and build the habit with streaks, XP and daily challenges.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

/** Footer link columns. Only pages that exist; add contact details or socials here when you have them. */
const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Learn",
    links: [
      { label: "Start learning free", href: "/try" },
      { label: "How it works", href: "#how" },
      { label: "Curriculum", href: "#path" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms of use", href: "/legal/terms" },
    ],
  },
];

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  // Returning learners skip the landing page and go straight to their Learn path.
  if (session?.user) redirect("/dashboard");
  const signedIn = false;
  // Real reviews only; none are shown until an admin approves them.
  const approved = await getApprovedTestimonials(3).catch(() => []);
  const testimonials = [...FEATURED_TESTIMONIALS, ...approved].slice(0, 3);
  // Same wording for everyone; signed-in visitors just land on their dashboard.
  // Signed-out visitors go straight into the first lesson; they sign up at the end to claim the XP.
  const start = { href: signedIn ? "/dashboard" : "/try", label: "Start learning for free" };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([COURSE_SCHEMA, ...SITE_SCHEMA, FAQ_SCHEMA]) }} />
    <div className="min-h-screen overflow-x-clip bg-background font-apple text-foreground antialiased">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b-2 border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="inline-flex items-center gap-[0.3em] text-[30px] font-bold tracking-tight text-brand">
            <BrandLogo className="h-[1.5em] -rotate-[10deg]" />
            Excelio
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#path" className="hidden px-3 py-2 text-[15px] font-semibold text-muted-foreground hover:text-foreground sm:block">
              Curriculum
            </a>
            {!signedIn && (
              <Link href="/login" className={pressable("outline", "hidden px-4 py-2 text-sm sm:inline-flex")}>
                Sign in
              </Link>
            )}
            <Link href={start.href as never} className={pressable("brand", "px-4 py-2 text-sm")}>
              {start.label}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero: centred promise, one big button, then the product itself ── */}
        {/* On wide screens the hero is at most one screen tall: the demo window runs off the bottom edge,
            so the next section only appears once you scroll. */}
        <section className="relative overflow-hidden bg-brand-soft/60 lg:max-h-[calc(100svh-4rem)]">
          <GridBackdrop />
          <div className="relative mx-auto max-w-6xl px-4 pt-16 text-center md:px-6 md:pt-24 lg:pt-[clamp(2.5rem,7vh,6rem)]">
            <h1 className="mx-auto max-w-4xl text-balance text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[68px]">
              Learn{" "}
              <span className="whitespace-nowrap">
                <BrandLogo className="mr-[0.14em] inline-block h-[0.95em] -rotate-[10deg] align-[-0.12em]" />
                <span className="relative inline-block text-brand">
                  <span aria-hidden className="absolute inset-x-[-4px] bottom-[0.08em] h-[0.38em] rounded-md bg-brand/20" />
                  <span className="relative">Excel</span>
                </span>
              </span>{" "}
              by actually using it.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              A free-to-start, interactive Excel course for beginners to advanced. Bite-sized lessons inside a real spreadsheet: type
              the formula, see it work, and remember it, from your first cell to XLOOKUP and LAMBDA.
            </p>

            <Link href={start.href as never} className={pressable("brand", "mt-9 px-12 py-4 text-lg font-bold md:px-16 md:text-xl")}>
              {start.label}
            </Link>

            {/* What you'll learn, written the way you'll type it */}
            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
              <span className="mr-1 font-serif text-lg font-bold italic text-brand">fx</span>
              {TOPICS.map((t) => (
                <span
                  key={t.fn}
                  title={t.label}
                  className="rounded-lg border-2 bg-card px-3 py-1.5 font-mono text-[15px] font-semibold"
                  style={{ borderColor: t.colour, boxShadow: `0 3px 0 ${t.colour}` }}
                >
                  <span className="text-muted-foreground">=</span>
                  <span style={{ color: t.colour }}>{t.fn}</span>
                  <span className="text-muted-foreground">()</span>
                </span>
              ))}
              <span className="font-mono text-[15px] font-semibold text-muted-foreground">and more</span>
            </div>

            {/* The product: a live demo, with Gridley presenting it */}
            <div className="relative mx-auto mt-14 max-w-4xl lg:mt-[clamp(2rem,6vh,3.5rem)]">
              <Mascot mood="teach" size={150} className="absolute -left-40 top-24 hidden lg:block" />
              <FloatChip className="-right-28 top-10 hidden text-amber-500 lg:flex" icon={Zap}>
                +10 XP
              </FloatChip>
              <FloatChip className="-right-36 top-28 hidden text-orange-500 lg:flex" icon={Flame}>
                7 day streak
              </FloatChip>
              <div className="rounded-t-3xl border-2 border-b-0 border-border bg-card p-3 pb-0 text-left shadow-[0_-8px_40px_rgb(0_0_0/0.08)] md:p-4 md:pb-0">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  <span className="ml-2 truncate text-[13px] font-semibold text-muted-foreground">Your first formula</span>
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-foreground">
                    <Pointer className="h-3 w-3" /> Live
                  </span>
                </div>
                {/* Scaled up on wide screens so the cells and formula read at a glance */}
                <div className="overflow-x-auto lg:[zoom:1.25]">
                  <SheetDemo lines={DEMO} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── By the numbers: a compact strip, each stat a "cell" with the formula that counts it ── */}
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:gap-0 md:divide-x-2 md:divide-dashed md:divide-border md:px-6">
            <StatCell formula="=COUNTA(Lessons)" value={lessonCount} label="hands-on lessons" />
            <StatCell formula="=ROWS(Chapters)" value={COURSES.length} label="chapters" />
            <StatCell formula={'=COUNTIF(Lessons,"video")'} value={0} label="videos to sit through" />
          </div>
        </section>

        {/* ── Why Excelio ── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-24 md:px-6">
            <SectionHeading
              eyebrow="Why Excelio"
              title="The fastest way to learn Excel online"
              sub="Excel training that has you practising in a real spreadsheet, not watching a video player."
            />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {REASONS.map((r) => (
                <div key={r.title} className="flex flex-col rounded-2xl border-2 border-b-[5px] border-border bg-card p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                      style={{ background: r.colour.base, boxShadow: `0 3px 0 ${r.colour.deep}` }}
                    >
                      <r.icon className="h-6 w-6" />
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[12px] font-bold"
                      style={{ background: `color-mix(in oklab, ${r.colour.base} 15%, transparent)`, color: r.colour.base }}
                    >
                      {r.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{r.title}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials: real reviews from learners, approved in Admin → Testimonials ── */}
        {testimonials.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-6xl px-4 py-24 md:px-6">
              <SectionHeading eyebrow="Learners" title="What Excel learners are saying" sub="From people learning Excel online with Excelio." />
              <div className={cn("mx-auto mt-14 grid gap-5", testimonials.length === 1 ? "max-w-md" : testimonials.length === 2 ? "max-w-3xl md:grid-cols-2" : "md:grid-cols-3")}>
                {testimonials.map((t, i) => {
                  const c = QUOTE_COLOURS[i % QUOTE_COLOURS.length]!;
                  return (
                    <figure
                      key={t.id}
                      className="flex flex-col rounded-2xl border-2 border-b-[5px] border-t-[6px] border-border bg-card p-7"
                      style={{ borderTopColor: c.base }}
                    >
                      <span aria-hidden className="font-serif text-6xl leading-none" style={{ color: `color-mix(in oklab, ${c.base} 30%, transparent)` }}>
                        &ldquo;
                      </span>
                      <blockquote className="-mt-4 text-[16px] leading-relaxed text-foreground/85">&ldquo;{t.quote}&rdquo;</blockquote>
                      <figcaption className="mt-6">
                        <span className="block font-bold">— {t.displayName}</span>
                        <span className="block text-[13px] font-bold uppercase tracking-wide text-brand">{t.location}</span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── How it works ── */}
        <section id="how" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-24 md:px-6">
            <SectionHeading eyebrow="How it works" title="Learn Excel in five minutes a day" sub="Every Excel lesson follows the same simple loop: see it, try it, keep it." />
            <ol className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, i) => {
                const c = STEP_COLOURS[i]!;
                return (
                  <li key={step.title} className="relative">
                    {/* arrow to the next step */}
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute -right-[22px] top-[88px] z-10 hidden h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-card text-muted-foreground md:flex"
                      >
                        <Arrow className="h-4 w-4" />
                      </span>
                    )}
                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-b-[5px] border-border bg-card">
                      <div
                        className="relative flex h-52 items-center justify-center overflow-hidden"
                        style={{ background: `color-mix(in oklab, ${c.base} 10%, var(--card))` }}
                      >
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 opacity-60 [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]"
                          style={{ backgroundImage: `radial-gradient(color-mix(in oklab, ${c.base} 35%, transparent) 1.5px, transparent 1.5px)` }}
                        />
                        <div className="relative">{i === 0 ? <SeeItVisual /> : i === 1 ? <TryItVisual /> : <KeepItVisual />}</div>
                      </div>
                      <div className="flex-1 border-t-2 border-border p-6">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[15px] font-bold text-white"
                            style={{ background: c.base, boxShadow: `0 3px 0 ${c.deep}` }}
                          >
                            {"ABC"[i]}
                          </span>
                          <h3 className="text-xl font-bold">{step.title}</h3>
                        </div>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ── Motivation: one panel, four quiet cells ── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-24 md:px-6">
            <SectionHeading eyebrow="Stay motivated" title="Excel practice you'll actually keep up" sub="Small wins every day add up to real Excel skills." />
            <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 [&>*]:min-w-0">
              <Feature icon={Flame} colour="#ea580c" title="Streaks" body="Practise a little each day and keep the chain going.">
                <StreakWeek />
              </Feature>
              <Feature icon={Award} colour="#d97706" title="Badges" body="Unlock badges as you hit milestones.">
                <BadgeShelf />
              </Feature>
              <Feature icon={Zap} colour="#1d9a52" title="Daily quests" body="Three small goals, fresh every day.">
                <QuestList />
              </Feature>
              <Feature icon={Ranking} colour="#0284c7" title="Weekly league" body="See how you stack up against other learners.">
                <MiniLeague />
              </Feature>
            </div>
          </div>
        </section>

        {/* ── Learning path: the whole course, laid out like a sheet ── */}
        <section id="path" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-24 md:px-6">
            <SectionHeading eyebrow="Curriculum" title="The Excel course, beginner to advanced" sub="Three stages, from Excel basics and formulas to lookups, dynamic arrays, LAMBDA and Power Query." />
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {STAGES.map((st) => {
                const chapters = COURSES.filter((c) => c.difficulty === st.id);
                return (
                  <div key={st.id} className="overflow-hidden rounded-2xl border-2 border-b-[5px] border-border bg-card">
                    <div className="flex items-center justify-between gap-3 px-4 py-3.5 text-white" style={{ background: st.base }}>
                      <p className="text-lg font-bold">{st.label}</p>
                      <p className="rounded-full bg-black/15 px-2.5 py-0.5 text-[12px] font-semibold">{st.lessons} lessons</p>
                    </div>
                    <ol className="py-1.5">
                      {chapters.map((c, i) => (
                        <li key={c.id} className="flex items-center gap-3 px-4 py-2 text-[14px]">
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[12px] font-bold"
                            style={{ background: `color-mix(in oklab, ${st.base} 16%, transparent)`, color: st.base }}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{c.title}</span>
                          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">{c.lessons.length}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ: answers the questions people search for ── */}
        <section id="faq" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-24 md:px-6">
            <SectionHeading eyebrow="FAQ" title="Learning Excel: your questions answered" sub="Everything you need to know before you start." />
            <div className="mt-12 space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="group rounded-2xl border-2 border-b-[5px] border-border bg-card px-5 py-4 open:border-brand/40 sm:px-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                    <h3>{f.q}</h3>
                    <span aria-hidden className="shrink-0 text-2xl leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final call ── */}
        <section className="border-t border-border">
          <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center md:py-28">
            <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Start learning Excel for free today.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Your first formula is a minute away. No credit card, nothing to install.</p>
            <Link
              href={start.href as never}
              className="group mt-10 flex w-full max-w-lg items-center gap-3 rounded-full border-2 border-border bg-card p-1.5 pb-2.5 pl-6 text-left shadow-[0_4px_0_var(--border)] transition-colors hover:border-brand"
            >
              <span className="font-serif text-lg font-bold italic text-brand">fx</span>
              <span className="min-w-0 flex-1 truncate font-mono text-[15px]">
                =START(<span className="text-brand">&quot;Excel&quot;</span>)
              </span>
              <span className={pressable("brand", "shrink-0 px-5 py-2.5 font-bold")}>
                {start.label} <Arrow className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer: link columns, then the logo and name in giant faded type ── */}
      <footer className="overflow-hidden bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 pt-16 md:px-6">
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[16px] font-semibold">{col.title}</p>
                <ul className="mt-4 space-y-3 text-[14px] text-white/90">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href as never} className="transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-14 flex flex-col gap-2 border-t border-white/25 pt-8 text-[15px] text-white/95 sm:flex-row sm:items-center sm:justify-between">
            <p>Learn Excel online by actually using it.</p>
            <p>© {new Date().getFullYear()} Excelio. All rights reserved.</p>
          </div>
        </div>

        {/* Giant logo and name, fading into the green. Decorative: the name is already above. */}
        <div aria-hidden className="pointer-events-none mx-auto mt-10 flex max-w-6xl select-none items-end justify-center gap-[0.04em] px-4 text-[clamp(72px,23vw,240px)] font-extrabold leading-[0.8] tracking-tighter md:px-6 [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]">
          <img src="/logo.png" alt="" className="h-[0.82em] w-auto shrink-0 -rotate-[8deg] opacity-80" />
          <span className="bg-gradient-to-b from-white/80 to-white/35 bg-clip-text pb-[0.06em] pr-[0.05em] text-transparent">Excelio</span>
        </div>
      </footer>
    </div>
    </>
  );
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[13px] font-bold uppercase tracking-wide text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-[44px] md:leading-tight">{title}</h2>
      <p className="mt-3 text-lg text-muted-foreground">{sub}</p>
    </div>
  );
}

/** A stat shown as a spreadsheet cell: the result in a selected cell, the formula beneath its label. */
function StatCell({ formula, value, label }: { formula: string; value: number; label: string }) {
  return (
    <div className="flex items-center justify-center gap-4 md:px-6">
      <span className="relative inline-flex min-w-20 shrink-0 justify-center rounded-xl border-[3px] border-brand bg-brand-soft/50 px-3 py-0.5">
        <span className="text-4xl font-extrabold tabular-nums text-brand">{value}</span>
        {/* Excel's fill handle */}
        <span aria-hidden className="absolute -bottom-[6px] -right-[6px] h-3 w-3 rounded-full border-2 border-background bg-brand" />
      </span>
      <div className="min-w-0">
        <p className="font-bold leading-snug">{label}</p>
        <p className="mt-0.5 whitespace-nowrap font-mono text-[12px] text-muted-foreground">
          <span className="font-serif text-[13px] font-bold italic text-brand">fx</span> {formula}
        </p>
      </div>
    </div>
  );
}

/** Faint spreadsheet grid that fades out from the centre. */
function GridBackdrop() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:72px_32px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
    />
  );
}

function FloatChip({ className, icon: Icon, children }: { className: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <span
      className={cn(
        "absolute flex items-center gap-1.5 rounded-2xl border-2 border-b-4 border-border bg-card px-3 py-2 text-sm font-bold shadow-sm",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-foreground">{children}</span>
    </span>
  );
}


// ── How it works visuals ──

/** A mini sheet with column B picked out, and Gridley pointing at it. */
function SeeItVisual() {
  return (
    <div className="flex items-end gap-2">
      <div className="grid w-44 grid-cols-[1.4rem_repeat(3,1fr)] overflow-hidden rounded-lg border-2 border-border bg-card font-mono text-[11px] text-muted-foreground shadow-[0_4px_0_var(--border)]">
        {["", "A", "B", "C"].map((h) => (
          <span
            key={h || "corner"}
            className={cn("border-b border-r border-border bg-muted/60 py-1 text-center last:border-r-0", h === "B" && "bg-[#1d9a52] font-bold text-white")}
          >
            {h}
          </span>
        ))}
        {[1, 2, 3, 4].map((r) => (
          <div key={r} className="contents">
            <span className="border-b border-r border-border bg-muted/60 py-1.5 text-center">{r}</span>
            {[0, 1, 2].map((col) => (
              <span key={col} className={cn("border-b border-r border-border last:border-r-0", col === 1 && "bg-[#1d9a52]/15")} />
            ))}
          </div>
        ))}
      </div>
      <Mascot mood="teach" size={64} className="-mb-1" />
    </div>
  );
}

/** A formula with coloured references, and the cell it fills, marked correct. */
function TryItVisual() {
  return (
    <div className="w-56 space-y-3">
      <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2 font-mono text-[15px] shadow-[0_3px_0_var(--border)]">
        <span className="font-serif text-sm font-bold italic text-[#7c3aed]">fx</span>
        <span>
          =<span className="font-bold text-[#1d9a52]">B2</span>*<span className="font-bold text-[#7c3aed]">C2</span>
        </span>
        <span aria-hidden className="h-4 w-0.5 animate-pulse bg-foreground" />
      </div>
      <div className="flex items-center justify-center gap-2 font-mono text-[14px]">
        <span className="rounded-md border-2 border-[#1d9a52] bg-card px-2.5 py-1">3</span>
        <span className="text-muted-foreground">×</span>
        <span className="rounded-md border-2 border-[#7c3aed] bg-card px-2.5 py-1">4</span>
        <span className="text-muted-foreground">=</span>
        <span className="relative rounded-md border-[3px] border-[#1d9a52] bg-[#1d9a52]/15 px-2.5 py-0.5 font-bold text-[#1d9a52]">
          12
          <span aria-hidden className="absolute -bottom-[6px] -right-[6px] h-2.5 w-2.5 rounded-full border-2 border-card bg-[#1d9a52]" />
        </span>
      </div>
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9a52] px-3 py-1 text-[13px] font-bold text-white shadow-[0_3px_0_#0d6b37]">
          <Check className="h-4 w-4" /> Correct!
        </span>
      </div>
    </div>
  );
}

/** XP earned and a streak growing. */
function KeepItVisual() {
  return (
    <div className="flex w-52 flex-col items-center gap-3">
      <span className="flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2 text-2xl font-extrabold text-white shadow-[0_4px_0_#b45309]">
        <Zap className="h-6 w-6" /> +10 XP
      </span>
      <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2 shadow-[0_3px_0_var(--border)]">
        <Flame className="h-5 w-5 text-orange-500" />
        <span className="flex gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={cn("h-2.5 w-4 rounded-full", i < 5 ? "bg-orange-500" : "bg-muted")} />
          ))}
        </span>
        <span className="text-[13px] font-bold text-orange-500">5</span>
      </div>
    </div>
  );
}

// ── Motivation cells ──

function Feature({
  icon: Icon,
  colour,
  title,
  body,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  colour: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border-2 border-b-[5px] border-border bg-card p-5 sm:p-7">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
        style={{ background: colour, boxShadow: `0 3px 0 color-mix(in oklab, ${colour} 60%, black)` }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-[15px] text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-1 flex-col justify-end">{children}</div>
    </div>
  );
}

function StreakWeek() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => (
        <div key={i} className="text-center">
          <span
            className={cn("block h-7 rounded-md", i < 5 ? "bg-orange-500 shadow-[0_3px_0_#9a3412]" : i === 5 ? "border-2 border-dashed border-orange-400" : "bg-muted")}
          />
          <span className="mt-1.5 block text-[11px] text-muted-foreground">{d}</span>
        </div>
      ))}
    </div>
  );
}

function BadgeShelf() {
  const slugs = ["first-lesson", "three-day-streak", "lookup-specialist", "xp-500", "ten-lessons", "daily-challenge"];
  return (
    <div className="flex flex-wrap gap-2.5">
      {slugs.map((slug, i) => {
        const Icon = ACHIEVEMENT_ICONS[slug] ?? Award;
        const got = i < 4;
        const c = achievementColour(slug);
        return (
          <span
            key={slug}
            className={cn("flex h-11 w-11 items-center justify-center rounded-full", got ? "text-white" : "bg-muted text-muted-foreground/50")}
            style={got ? { background: c.base, boxShadow: `0 3px 0 ${c.deep}` } : { boxShadow: "0 3px 0 var(--border)" }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        );
      })}
    </div>
  );
}

function QuestList() {
  const quests = [
    { label: "Earn 20 XP", done: 20, of: 20 },
    { label: "Finish 2 lessons", done: 1, of: 2 },
    { label: "Clear a challenge", done: 0, of: 1 },
  ];
  return (
    <ul className="space-y-3">
      {quests.map((q) => (
        <li key={q.label} className="flex items-center gap-3 text-[13px]">
          <span className="w-32 shrink-0">{q.label}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-brand" style={{ width: `${(q.done / q.of) * 100}%` }} />
          </span>
          <span className="w-9 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
            {q.done}/{q.of}
          </span>
        </li>
      ))}
    </ul>
  );
}

function MiniLeague() {
  const rows = [
    { name: "Maya", xp: 480, medal: "#f5b301" },
    { name: "Daniel", xp: 415, medal: "#b8c2cc" },
    { name: "You", xp: 390, medal: "#d9822b", me: true },
  ];
  return (
    <ul className="space-y-1 text-[14px]">
      {rows.map((r, i) => (
        <li key={r.name} className={cn("flex items-center gap-3 rounded-lg px-2 py-1.5", r.me && "bg-[#0284c7]/15")}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-black text-white" style={{ background: r.medal }}>
            {i + 1}
          </span>
          <span className={cn("flex-1 font-semibold", r.me && "text-[#0284c7]")}>{r.name}</span>
          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">{r.xp} XP</span>
        </li>
      ))}
    </ul>
  );
}
