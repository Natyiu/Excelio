# File storage

Supabase Storage. Three pieces, each with one job:

```
lib/supabase-server.ts   getSupabaseAdmin() — server-only client, service-role key
lib/supabase.ts          uploadFile() / deleteFile() / buildPublicUrl() — client-safe helpers
app/api/upload/route.ts  the actual upload/delete endpoint (POST / DELETE)
```

Upload is a route handler, not a server action, because it receives a `File` via `FormData` —
server actions can take `FormData`, but the client-side helper here already wraps it as a
plain `fetch`, so keep using that helper rather than switching this one flow to a server
action.

## Uploading a file — the pattern every caller uses

```ts
import { uploadFile } from "@/lib/supabase";

const path = `avatars/${session.user.id}/${Date.now()}-${file.name}`;
const result = await uploadFile("avatars", path, file);
if ("error" in result) {
  toast.error(result.error);
  return;
}
// result.url is the public URL
```

See `dashboard/settings/page.tsx` or `onboarding/page.tsx` for full examples (avatars),
`admin/blog/page.tsx` for post images, `admin/notifications/page.tsx` for notification
attachments.

## Buckets in use

| Bucket | Used for |
|---|---|
| `avatars` | user profile pictures |
| `uploads` | blog post images, general admin content images |
| `attachments` | notification attachments |

Buckets aren't provisioned by code — they're created in the Supabase dashboard. Adding a new
upload surface with a new bucket name means creating that bucket in Supabase first.

## Credentials

`getSupabaseAdmin()` resolves the Supabase URL + service-role key from `AppSettings` first,
falling back to `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` env vars — the same
admin-override-then-env pattern as every other third-party credential (see `api-keys.ts` in
[db.md](./db.md)). It caches the constructed client for 30 seconds; call sites don't need to
worry about re-creating it. If storage isn't configured (`getSupabaseAdmin()` returns `null`),
the upload route returns a clear error rather than throwing — match that if you add a new
storage-backed endpoint.

## Server-side vs. client-side URLs

`buildPublicUrl()` in `lib/supabase.ts` builds a public object URL from a bucket + path
without hitting the network — use it when you already have the Supabase URL and just need to
construct a link (e.g. rendering an existing avatar path). Use `uploadFile()`'s returned
`url` when you've just uploaded something and want the URL Supabase actually assigned.
