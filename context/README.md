# Context — read this before touching code

This folder is the map. Each file below covers one concern in depth; this page just tells
you which one to open. Skim this, then open only the file(s) relevant to your task — don't
read all of them up front.

| File | Read it when you're touching... |
|---|---|
| [architecture.md](./architecture.md) | Any new feature — where files go, naming, the monorepo layout |
| [db.md](./db.md) | Prisma models, migrations, the `AppSettings` singleton |
| [auth.md](./auth.md) | Login/session logic, roles, permissions, `packages/auth` |
| [api.md](./api.md) | A server action, an API route, or a webhook |
| [storage.md](./storage.md) | File upload/download, Supabase Storage |
| [email.md](./email.md) | Anything that sends an email |
| [design.md](./design.md) | UI components, styling, forms, loading states |
| [geo.md](./geo.md) | Public guide pages, llms.txt, AI search, how to measure it |

## What this repo is

Batman is a Next.js SaaS boilerplate sold as a starting point for other people's products.
Two things ship together in this monorepo:

- **`apps/web`** — the actual product (auth, admin dashboard, billing, blog, notifications,
  organizations, file storage). This is what buyers keep and build on. **Everything in this
  `context/` folder is about `apps/web` and the `packages/*` it depends on.**
- **`apps/marketing`** — the landing page and purchase flow for *selling* Batman itself. It's
  seller-only infrastructure, stripped out of what buyers actually download. Don't use it as
  a reference for `apps/web` conventions — it's a different, unrelated app that happens to
  live in the same monorepo.

## The five packages

```
apps/web         the product — Next.js App Router, all the UI and routes
packages/auth     better-auth config: session, roles, org invites, auth-triggered emails
packages/db       Prisma client + schema (schema is split by domain, see db.md)
packages/email    sendEmail() — the one place Resend is called from
packages/env      typed, validated env vars (@Batman/env/server, @Batman/env/web)
```

`apps/web` depends on all four packages. The packages depend on each other in one direction
only: `auth` → `email` → `db` → `env`. Never import `apps/web` code from a package — packages
must stay usable without the web app existing.

## The rule that matters most: one action file per domain

`apps/web/src/lib/actions/*.ts` holds every server action, one file per domain (`blog.ts`,
`feedback.ts`, `waitlist.ts`, `dashboard.ts`, `api-keys.ts`, `legal.ts`, `site-settings.ts`,
`notifications.ts`, `polar.ts`, `user.ts`). Before adding a function, check if a file for that
domain already exists — extend it. Only create a new file for a genuinely new domain. This
used to be violated (one `admin.ts` held eight unrelated domains) and it made the codebase
harder to navigate for exactly the reason you're reading this doc to avoid — see
[architecture.md](./architecture.md) for the full convention.

## Writing code here: match what's already there

Before writing a new admin page, action, or component, find the closest existing example and
copy its shape — this codebase is consistent enough that "the file next to it" is almost
always the right template. `design.md` and `api.md` both point to canonical examples for
exactly this reason. Don't introduce a new pattern (a new form library, a new state-fetching
approach, a new file layout) when an established one already does the job.
