# Auth

[better-auth](https://better-auth.com), configured in `packages/auth/src/index.ts` and
consumed everywhere as:

```ts
import { auth } from "@Batman/auth";
```

## `packages/auth` file layout

The config used to be one 318-line file mixing five concerns. It's now split so each concern
has one home:

| File | Owns |
|---|---|
| `index.ts` | the `betterAuth()` call itself — config and wiring only |
| `settings-cache.ts` | `getSettings()` / `invalidateSettingsCache()` — 10s-cached `AppSettings` read |
| `session-config.ts` | resolves session length + email-verification-required at boot (see caveat below) |
| `google-credentials.ts` | `getGoogleCredentials()` — resolves Google OAuth creds from settings or env |
| `notifications.ts` | `notifyFirstAdmin` / `notifyWelcome` / `notifyPasswordChanged`, called from auth hooks |
| `permissions.ts` | the access-control statement and `admin`/`user` roles (better-auth's `admin` plugin) |

If you're adding something to the auth config that isn't "wire a betterAuth option," it
probably belongs in a new file here, not inline in `index.ts`.

## Session config is resolved once at boot, not per request

`session-config.ts`'s `resolveSessionConfig()` runs once when `packages/auth` is loaded — it's
a top-level `await`, not something re-evaluated per request. **A change to session timeout or
"require email verification" in Admin > General takes effect on the next server restart, not
immediately.** This is a real constraint of better-auth's config shape (`session.expiresIn` and
`emailVerification.requireEmailVerification` are static values, not functions), not a bug —
don't try to "fix" it by moving the read into a request-scoped path; know it and design around
it (e.g. tell the admin a restart is needed) if you're touching this.

## Guards: `requireAuth()` / `requireAdmin()`

Defined once in `apps/web/src/lib/auth-guards.ts`, used by every server action that needs a
signed-in or admin user:

```ts
import { requireAdmin } from "@/lib/auth-guards";

export async function someAdminAction() {
  await requireAdmin(); // throws Error("Unauthorized") or Error("Forbidden")
}
```

Use these, not a fresh `auth.api.getSession({ headers: await headers() })` call — that used to
be copy-pasted into five separate action files before this existed.

> `apps/web/src/lib/session.ts` (`getSession`/`requireSession`/`isAdmin`) is a second,
> unused implementation of the same idea — nothing in the app imports it. Don't copy from it;
> if you're touching auth guards, `auth-guards.ts` is the one actually in use.

## Roles & permissions

Two roles — `admin` and `user` — defined in `permissions.ts` via better-auth's `admin` plugin
access-control API (`createAccessControl` / `ac.newRole`). The first user to ever sign up is
auto-promoted to `admin` (see the `databaseHooks.user.create.after` hook in `index.ts`); every
signup after that gets `AppSettings.defaultUserRole` (default `"user"`).

`session.user.role === "admin"` is the check `requireAdmin()` makes — if you need a permission
finer than "is admin," extend the `statement` in `permissions.ts` rather than hand-rolling a
new role check elsewhere.

## Organizations

The better-auth `organization` plugin is enabled in `index.ts` (multi-tenant teams, invites).
Gated behind `AppSettings.organizationsEnabled` / `.invitesEnabled` — check those before
assuming the feature is on. Invitation emails go through `sendInvitationEmail` in the plugin
config, using [email.md](./email.md)'s `sendEmail()`.

## Emails triggered by auth itself

Password reset, email verification, and org-invitation emails are sent directly from
`packages/auth/src/index.ts`'s better-auth callbacks (`sendResetPassword`,
`sendVerificationEmail`, `sendInvitationEmail`), using `sendEmail()` from `@Batman/email` — see
[email.md](./email.md). Any other email (notifications, digests, receipts) belongs in
`apps/web`, not here — `packages/auth` should only send emails better-auth itself triggers.
