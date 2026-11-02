# API surface

Two ways data moves between client and server here. Default to server actions; only reach for
a route handler when you genuinely need one (see below).

## Server actions — the default

`lib/actions/*.ts`, one file per domain (full table in [architecture.md](./architecture.md)).
Every file starts with `"use server"`. Next.js enforces that a `"use server"` file can only
export `async function`s — no consts, no types-as-values, no sync helpers exported alongside
them (unexported sync helpers in the same file are fine).

Canonical shape, copy this for a new one:

```ts
"use server";

import prisma from "@Batman/db";
import { requireAdmin } from "@/lib/auth-guards";

export async function doSomething(input: SomeType) {
  await requireAdmin(); // omit for a public action — see legal.ts / waitlist.ts's public reads
  // ... prisma call, return plain data (no Prisma model instances with methods — already true
  // by default, just don't wrap the return in a class)
}
```

Call it directly from a client component like a normal async function — no fetch, no
serialization code to write yourself.

## Route handlers — only for these cases

`app/api/*/route.ts`. Used when the caller isn't a React component that can call a server
action directly:

- `api/auth/[...all]/route.ts` — better-auth's own catch-all handler. Don't touch; it's
  wired up by the `@Batman/auth` package itself.
- `api/upload/route.ts` — receives `FormData` (a `File`), which server actions handle
  awkwardly. See [storage.md](./storage.md).
- `api/webhooks/polar/route.ts` — an external service (Polar) POSTs here directly; it has to
  be a real HTTP endpoint with signature verification, not a server action.

If your new endpoint is being called from `apps/web`'s own UI and doesn't involve a raw file
upload or a third-party webhook, it should almost certainly be a server action instead.

## Webhooks

`api/webhooks/polar/route.ts` handles `subscription.*` and `order.*` events from Polar (billing).
It verifies the Standard Webhooks signature itself with `node:crypto` (trying both the UTF-8 and
the base64-decoded `whsec_` key, since SDK 0.46's `validateEvent()` only knows the former) before
trusting the payload.

Payments are configured **only from env**, never from admin settings: `POLAR_ACCESS_TOKEN`,
`POLAR_SANDBOX_MODE`, `POLAR_WEBHOOK_SECRET`, and the plan ids `POLAR_PRODUCT_ID_MONTHLY` /
`_YEARLY` / `_LIFETIME` (`lib/polar-client.ts`, `lib/pro-access.ts`). The `AppSettings.polar*`
columns still exist but nothing reads them.

## Middleware is a no-op

`apps/web/src/middleware.ts` exists but does nothing (`return NextResponse.next()`). All auth
gating happens in layouts (`app/admin/layout.tsx`, `app/dashboard/layout.tsx`), which check the
session server-side and `redirect()` — not in middleware. If you're adding a new protected
route group, add the check to that group's `layout.tsx`, following the existing ones, not to
`middleware.ts`.
