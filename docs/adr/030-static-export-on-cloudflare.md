# ADR-030: The docs site is a static export, and /themes reads the address on the client

- **Status:** Accepted — **Anuj** chose Cloudflare and the static export; Claude implemented it and decided the details below.
- **Date:** 2026-09-28
- **Principles:** 7

## Context

- Phase 6 puts the site on Cloudflare (BRIEF §13 allowed Vercel or Cloudflare Pages).
- 112 of the 113 routes already prerendered. Only `/themes` was server-rendered on demand, because it read the theme out of `searchParams` while rendering so a shared link painted the right theme on the server.
- Cloudflare offers two shapes for a Next app: plain files on Pages, or the Workers runtime through `@opennextjs/cloudflare`. The adapter does support this version (`next: >=15.5.24 <16 || >=16.3.3`; the site is on 16.3.6), so both were open.
- The site has no forms, no auth, no route handlers, no middleware and no server actions. `/themes` was the only thing asking for a server, and only to avoid one frame of the wrong theme.

## Decision

- **`output: 'export'`.** The build writes `apps/docs/out/`, and that directory is the whole site. No adapter, no Workers runtime, no cold starts, nothing to keep alive.
- **`/themes` reads the address on the client**, in an effect after hydration, and dispatches a new `replace` action. Reading it during render would make the first client render differ from the prerendered HTML — React error #418, the fault `scripts/check-hydration.mjs` exists to catch.
- **The address is not written back until it has been read.** The provider's URL-sync effect is gated on an `addressRead` flag; without it the first commit would write the default state over the parameters the visitor arrived with.
- **No trailing slashes.** Cloudflare Pages resolves `/docs` from `docs.html` as happily as from `docs/index.html`, and `trailingSlash: true` would have changed the shape of every URL on the site, including ones already shared.
- **`scripts/check-theme-links.mjs`** opens five shared `/themes` links, including a malformed one, and fails if a theme doesn't come back. In CI and in `/verify`.
- **No pre-paint script.** It was considered and rejected — see below.

## Alternatives considered

- **`@opennextjs/cloudflare`,** keeping `/themes` server-rendered. It works, but it trades a site that cannot fail at runtime for one that can, to save one frame on one page. A portfolio site is read far more often than a theme link is shared.
- **An inline pre-paint script** that applies the shared theme before first paint, the way dark-mode flashes are usually fixed. Rejected on measurement, not taste: the theme is not a stored value but the output of `generateTheme()` — OKLCH ramps, 48 roles and the contrast solver — rendered into a `<style>` tag by `toCSS()`. A pre-paint script would have to inline the whole theme engine as a blocking script on every visit to `/themes`, including the common one with no parameters, to save one frame on the uncommon one.

## Consequences

- **Good:** the site is files. It cannot 500, it has no runtime to patch, and any static host can serve it. Deploys are an upload.
- **Bad:** opening a shared `/themes` link paints the default preset in the preview panel for one frame before the shared theme replaces it. Only the preview is scoped to the generated theme, so the page chrome never flickers, but the seam is real and it is on the page most worth demoing.
- **Bad:** `next start` no longer works. `pnpm --filter @syntara/docs start` serves the export instead, and `/verify`, CI and `docs/deploy.md` all say so.
- **Revisit when:** a page needs a server for a reason other than reading its own query string — a form, auth, or anything personalised.
