# Deploying the docs site

The site is a **static export** — plain files, no server, no adapter, no runtime. `pnpm --filter @syntara/docs build`
writes `apps/docs/out/`, and that directory is the whole site. Any static host can serve it; these notes are for
Cloudflare Pages (ADR-030).

## Cloudflare Pages settings

Create a Pages project from the GitHub repository and set:

| Setting | Value |
|---|---|
| Framework preset | **None** (not "Next.js" — that preset expects a server) |
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @syntara/docs build` |
| Build output directory | `apps/docs/out` |
| Root directory | *(leave empty — the build runs from the repo root)* |

Environment variables, for **both** Production and Preview:

| Name | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_SITE_URL` | the origin this deployment answers on, with no trailing slash |

`NEXT_PUBLIC_SITE_URL` is read at build time by `apps/docs/lib/site.ts`. It sets `metadataBase` (so Open Graph and
canonical URLs are absolute) and replaces `{{SITE_URL}}` in code blocks. Left unset it falls back to
`http://localhost:3000`, which would ship localhost URLs into the page metadata — set it before the first
production deploy. On preview deployments Cloudflare gives each build its own subdomain, so either set it to the
project's stable preview alias or accept that preview metadata points at production.

## What is already in the repo

- `apps/docs/public/_headers` — security headers and immutable caching for `/_next/static/*`. Cloudflare Pages
  reads this from the deployed root; Next copies `public/` into the export unchanged.
- `output: 'export'` in `apps/docs/next.config.mjs`.

## Checking a build the way CI does

`next start` does **not** work with `output: 'export'`. Serve the export instead:

```sh
pnpm --filter @syntara/docs build
pnpm --filter @syntara/docs start &        # serve apps/docs/out on :3000 — note the PID
node scripts/check-hydration.mjs
node scripts/check-theme-links.mjs
node scripts/axe-sweep.mjs
node scripts/check-overlay-exit.mjs
kill <that PID>
```

All four refuse to run unless the server is answering with the build in `apps/docs/.next/BUILD_ID`, so a stale
server left on port 3000 can't quietly stand in for the one you just built. If one of them says the build ids
differ, find the process actually holding the port — it may be an orphan whose parent you already killed:

```sh
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

## Things to know before the first deploy

- **Every route prerenders.** Nothing may read `searchParams`, `cookies()` or `headers()` while rendering. `/themes`
  keeps its state in the address and reads it on the client after hydration (see
  `apps/docs/components/themes/themes-provider.tsx`); `scripts/check-theme-links.mjs` guards that shared links
  still restore their theme.
- **The npm packages are not published.** The site says so. When they go out, drop the `note` on the homepage's
  `InstallCommand` and the `badge: 'Not on npm yet'` entries in `apps/docs/components/home/sections.tsx`, and the
  callout at the top of `apps/docs/content/docs/installation.mdx`.
- **Fonts come from Google Fonts** at runtime. The CSP in `_headers` allows `fonts.googleapis.com` and
  `fonts.gstatic.com` and nothing else.
