# AI search (GEO)

What actually gets Excelio cited: pages that are indexed, crawlable as text, and answer a real
question well. Google says AI Overviews and AI Mode need no special markup or files.

## What's in place

- `/learn-excel`: public guide built from the curriculum (`lib/excel-guide.ts`). Free chapters get
  a page per lesson; Pro chapters are an outline; hidden chapters are left out. It follows
  Admin → Curriculum, and lesson addresses come from titles, so renaming a lesson changes its URL.
- `/llms.txt`: optional map for tools that read it. Google says it has no effect on rankings.
- `robots.ts` allows every crawler. `OAI-SearchBot` controls ChatGPT search and `GPTBot` controls
  training; blocking one doesn't block the other.

## Measuring

There is no reliable "AI ranking", and a readiness score isn't one. Once a month, run these in
ChatGPT, Perplexity, Gemini and Google (AI Overview), logged out, and record the date, tool, query,
locale, whether Excelio is mentioned or linked, and which sites are cited instead:

1. What is the best way to learn Excel online?
2. Best free interactive Excel course for beginners
3. Excel course with hands-on practice instead of videos
4. Apps like Duolingo for learning Excel
5. What is the order of operations in Excel?
6. How do I make a cell reference absolute in Excel?

Answers vary run to run, so compare trends across months, not single results. AI referrals show
up in DataFast, and in Admin → Insights under "AI assistant" for people who sign up. Google counts
AI Overview clicks inside normal Search Console Web traffic, so they can't be separated there.
