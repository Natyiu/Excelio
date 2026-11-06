# Database

Postgres via Prisma. Client and schema live in `packages/db`, imported everywhere as:

```ts
import prisma from "@Batman/db";
```

## Schema is split by domain, not one file

`packages/db/prisma/schema/*.prisma` — Prisma supports multiple schema files in one schema
directory, and this repo uses that: one file per domain instead of one giant `schema.prisma`.

| File | Models |
|---|---|
| `schema.prisma` | generator + datasource only, no models |
| `app.prisma` | `AppSettings` |
| `acquisition.prisma` | `UserAcquisition` (where a learner first came from) |
| `auth.prisma` | `User`, `Session`, `Account`, `Verification` (better-auth's tables) |
| `blog.prisma` | `Post` |
| `feedback.prisma` | `Feedback` |
| `notification.prisma` | `Notification`, `NotificationRecipient` |
| `organization.prisma` | `Organization`, `Member`, `Invitation` |
| `polar.prisma` | `Subscription` |
| `waitlist.prisma` | `WaitlistEntry` |
| `marketing.prisma` | `License`, `LicenseRedemption` — **seller-only**, part of `apps/marketing`, not the product |

Adding a model for a new feature domain: add a new `packages/db/prisma/schema/<domain>.prisma`
file rather than appending to an existing one, unless the model is genuinely part of an
existing domain.

## The `AppSettings` singleton

One row, fixed id, holds nearly every piece of runtime-configurable behavior — feature flags,
third-party API keys, email copy, maintenance mode, waitlist/countdown content, session
timeout, and more. Every read/write goes through the same shape:

```ts
const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
// ...
await prisma.appSettings.upsert({
  where: { id: "default" },
  update: data,
  create: { id: "default", ...data },
});
```

See `lib/actions/site-settings.ts` for the canonical read (public, no auth) and write (admin
only) pair, and `lib/actions/api-keys.ts` for how third-party credentials are stored on this
same row with masking on read (`mask()`) and a "don't overwrite unless it actually changed"
guard on write (`unmasked()`) — copy that pattern for any new secret field rather than storing
it in plaintext or adding a new table.

`packages/auth` reads this row through its own 10-second cache (`getSettings()` in
`packages/auth/src/settings-cache.ts`) since auth hooks run on nearly every request — call
`invalidateSettingsCache()` (exported from `@Batman/auth`) after any admin write so the change
is visible immediately instead of waiting out the cache. `site-settings.ts`'s
`updateAppSettings` already does this — follow that example for any new settings writer.

## Workflow

```
pnpm db:push       push schema changes to the dev database (no migration file)
pnpm db:migrate     generate + apply a migration
pnpm db:generate    regenerate the Prisma client after a schema change
pnpm db:studio      Prisma Studio
```

The generated client lives at `packages/db/prisma/generated` (gitignored, regenerated on
install via `packages/db`'s `postinstall`).
