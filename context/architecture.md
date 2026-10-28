# Architecture

## Monorepo layout

```
apps/
  web/                the product (this is what these docs describe)
  marketing/           seller-only — selling Batman itself, not part of the product
packages/
  auth/                better-auth config
  db/                  Prisma client + schema
  email/               sendEmail()
  env/                 validated env vars
  config/              shared tsconfig.base.json
  create-bb/           the CLI buyers run to scaffold a new project — seller infra, not shipped
```

pnpm workspace, Turborepo for task orchestration (`turbo.json`). `pnpm install` at the root
wires everything via `workspace:*`.

## `apps/web/src` layout

```
app/                Next.js App Router routes. Route groups: (auth), admin/, dashboard/, etc.
components/          shared, cross-route components. components/ui/ = shadcn primitives.
lib/actions/         server actions ("use server"), one file per domain — see below
lib/*.ts             other shared utilities (email, notify, session helpers, subscriptions)
types/               ambient .d.ts files for packages with no types of their own
```

Route-local components (a sidebar, a shell, a dialog only that route uses) live next to the
`page.tsx` that uses them, not in `components/`. Example: `app/admin/admin-sidebar.tsx`,
`app/dashboard/dashboard-shell.tsx`. Reach for `components/` only when something is actually
shared across routes.

## Server actions: one file per domain

`lib/actions/*.ts` — every file starts with `"use server"` and exports only async functions
(a Next.js constraint: non-async exports from a `"use server"` file are a build error). Files
are organized by **domain**, not by which page calls them:

| File | Owns |
|---|---|
| `admin` guard | see `lib/auth-guards.ts` — not an actions file, see below |
| `api-keys.ts` | reading/writing third-party credentials (Admin > API Keys) |
| `blog.ts` | posts |
| `dashboard.ts` | admin overview + analytics stats |
| `feedback.ts` | user feedback submissions |
| `legal.ts` | privacy/terms content (public read) |
| `notifications.ts` | the in-app notification system |
| `polar.ts` | Polar checkout/subscription actions |
| `site-settings.ts` | the `AppSettings` singleton — public reads + admin writes |
| `user.ts` | profile, account settings |
| `waitlist.ts` | waitlist signup (public) + admin listing |

When you need a new server action, check this table first. A function belongs in the file for
its *domain* (what data it touches), not the file named after the page that happens to call
it — `getWaitlistEntries` lives in `waitlist.ts` even though only an admin page calls it.

This structure replaced a single `admin.ts` that had grown to 628 lines mixing eight unrelated
domains (legal content, settings, API keys, waitlist, dashboard stats — all in one file) purely
because everything in it happened to require an admin session. "Requires admin" is an
implementation detail (see [auth.md](./auth.md)'s `requireAdmin()`), not a domain — don't
recreate that file.

## Auth guards live once, in `lib/auth-guards.ts`

```ts
import { requireAdmin } from "@/lib/auth-guards";

export async function someAdminAction() {
  await requireAdmin(); // throws "Unauthorized" or "Forbidden" — never write this check inline
  // ...
}
```

`requireAuth()` and `requireAdmin()` are defined once and imported everywhere. Don't
re-implement a `const session = await auth.api.getSession(...)` check inline — five different
action files used to each carry their own copy of this exact check before it was consolidated.

## Settings: one row, `AppSettings`

Nearly every configurable behavior (feature toggles, third-party keys, email templates,
maintenance mode, waitlist/countdown copy) lives on a single `AppSettings` row with a fixed
id (`"default"`). See [db.md](./db.md) for the model and [api.md](./api.md) for the
read/write pattern. Don't add a new table for a single global setting — add a column to
`AppSettings` and read it the way `site-settings.ts` and `api-keys.ts` already do.

## Tooling

- `pnpm run check-types` — runs `tsc --noEmit` in every package via Turborepo. This is the
  real type-safety gate; trust it.
- `pnpm run lint` (or `pnpm --filter web run lint`) — ESLint, flat config at
  `apps/web/eslint.config.mjs`, built on `eslint-config-next`.
- `apps/web/tsconfig.json` extends `packages/config/tsconfig.base.json`, which turns on
  `noUnusedLocals`, `noUnusedParameters`, and `noUncheckedIndexedAccess`. Array/object index
  access (`arr[i]`) is typed `T | undefined` — either narrow it (a length check, an `if`) or
  assert with `!` when the surrounding logic already guarantees it's in bounds.
