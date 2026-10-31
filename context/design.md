# UI & design conventions

Tailwind v4 + [shadcn/ui](https://ui.shadcn.com), dark-mode-capable via `next-themes`.

## Icons: hugeicons, not lucide

Every icon in `apps/web` is imported from `@hugeicons/react`, aliased to a short local name at
the import site — e.g. `import { UserGroupIcon as Users } from "@hugeicons/react";` — so the
rest of the file just renders `<Users className="h-4 w-4" />`, same as any other icon library.
`lucide-react` isn't a dependency of `apps/web` at all; don't reintroduce it for a new icon —
find (or pick) a hugeicons name and alias it the same way. shadcn's generated primitives
(`components/ui/*`) follow this too (see `dialog.tsx`'s `X` close icon) — if you regenerate a
primitive with `npx shadcn add`, it'll come back importing from `lucide-react` and need the
same alias swap.

## Component layers — know which one you're adding to

```
components/ui/          shadcn primitives (button, dialog, input, table, ...). Don't hand-edit
                         these beyond what `npx shadcn add` generates — if you need a variant,
                         compose around the primitive rather than forking it.
components/*.tsx         shared across multiple routes (feedback-dialog, skeletons, header)
app/<route>/*.tsx        route-local — only that route uses it (admin-sidebar.tsx,
                         dashboard-shell.tsx). This is the default for a new component; only
                         promote something to components/ once a second route needs it too.
```

## Styling

- `cn(...)` from `lib/utils.ts` (clsx + tailwind-merge) for every conditional className —
  don't hand-concatenate class strings.
- Design tokens live in `src/index.css` as CSS custom properties in oklch, with a `:root`
  (light) and `.dark` block — reference them via Tailwind's generated utilities
  (`bg-background`, `text-muted-foreground`, `border-border`), never a raw hex/oklch value in
  a component.
- `--radius: 0.875rem` — the theme is soft and rounded (Apple-like). shadcn primitives derive
  their corners from it; don't reintroduce `rounded-none`.
- Learner-facing pages (`/dashboard/**`) build on `components/game-ui.tsx`: `Panel` (rounded-3xl
  card, hairline border, `shadow-soft`), `pressable()` (pill buttons), `ProgressBar`, `IconTile`
  (tinted rounded square), `PageHeader`, `SectionTitle`, `EmptyState`. Use those instead of
  hand-rolling cards or buttons so every page stays consistent. Brand colours are the
  `brand`, `brand-soft` and `brand-deep` tokens.

## Theme toggle: use `useMounted()`, not a local effect

Reading `theme` from `next-themes` before the client has hydrated causes a mismatch (the
server always renders the default theme). The old fix, copy-pasted into seven different
components, was:

```ts
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
```

Use the shared hook instead — same result, no duplicated effect, and it doesn't trip the
"no setState in effects" lint rule the way the pattern above does:

```ts
import { useMounted } from "@/lib/use-mounted";

const mounted = useMounted();
const isActive = mounted && theme === "dark";
```

## Loading states: a `<Domain>Skeleton>` component, not a spinner

Every data-fetching page renders a matching skeleton from `components/skeletons.tsx`
(`OverviewSkeleton`, `ApiKeysSkeleton`, `FeatureTogglesSkeleton`, `OrganizationsSkeleton`, ...)
while `loading` is true, shaped to roughly match the loaded layout. Add a new one there,
following an existing skeleton's shape, rather than a generic spinner — it's the established
convention for every admin/dashboard page.

## Forms: plain `useState`, except auth

Almost every form in this app (admin settings, API keys, profile, feedback) is a plain
`useState<FormData>` object with a local `update(field, value)` setter and manual submit
handling — see `components/setup-wizard.tsx` or `app/admin/api-keys/page.tsx` for the pattern.

`@tanstack/react-form` is a dependency, but it's only used by `sign-in-form.tsx` and
`sign-up-form.tsx` (auth forms with real field-level validation needs). Don't reach for it for
a new admin settings form — match the plain-`useState` pattern everything else uses.

## Feedback: `sonner` toasts

`import { toast } from "sonner"` — `toast.success(...)` / `toast.error(...)` after a server
action resolves. Every mutation in the admin UI follows this; there's no separate inline
error-message convention to introduce.

## Rich text

Blog post bodies use Tiptap (`@tiptap/react` + starter-kit + image/link/placeholder
extensions) — see `components/rich-text-editor.tsx`. It's the only rich-text surface in the
app; don't add a second editor for a new content field without a real reason.
