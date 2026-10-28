# Email

One function, one place. [Resend](https://resend.com), wrapped in `packages/email`:

```ts
import { sendEmail } from "@Batman/email";

const sent = await sendEmail(to, subject, html);
if (!sent) {
  // sendEmail already logged the reason (no API key, Resend error, etc.) — don't re-throw,
  // let the calling flow continue. A failed email should never fail the action that sent it.
}
```

`sendEmail` returns `boolean`, not a thrown error — every existing caller treats a failed send
as non-fatal (log and continue), and new callers should too. See `lib/actions/blog.ts` or
`lib/actions/user.ts` for examples of "send an email, don't block the action on it failing."

## Where the API key comes from

Same admin-override-then-env pattern as every other credential in this app: `AppSettings`'s
`resendApiKey`/`resendFromEmail` first, falling back to `RESEND_API_KEY`/`RESEND_FROM_EMAIL`.
If neither is set, `sendEmail` logs and returns `false` — it never throws for missing config.

## This package exists so there's exactly one implementation

`packages/auth` (password reset, email verification, org invites) and `apps/web` (blog
notifications, feedback replies, billing, admin-triggered emails) both need to send email.
Before `packages/email` existed, each had its own copy of the API-key resolution logic; they
drifted. Any new email-sending code — in either place — should call `sendEmail` from
`@Batman/email`, not touch the `resend` package directly.

## Templates are inline HTML strings

There's no template engine — callers build the HTML as a template literal at the call site
(see `packages/auth/src/index.ts`'s `sendResetPassword` for the shortest example, or
`lib/actions/user.ts` for a longer one). Keep new emails consistent with that style rather
than introducing a templating library for one new email.

## Notifications are a separate system

In-app notifications (the bell icon, `Notification`/`NotificationRecipient` models) are
unrelated to email — see `lib/notify.ts` (`notifyAdmins`/`notifyUser`) for those. A feature
often wants both: an email *and* an in-app notification. Send them as two separate calls, one
to `sendEmail`, one to `notifyUser`/`notifyAdmins` — don't conflate the two.
