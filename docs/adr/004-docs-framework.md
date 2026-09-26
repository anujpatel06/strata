# ADR-004: Docs framework

- **Status:** Proposed — Claude recommended, pending Anuj. Decide before Phase 6.
- **Date:** 2026-09-26
- **Principles:** 6

## Context

- The docs site holds: getting started, live token values per tenant, component pages generated from `meta.json`, the Brand Generator (live), ADRs, changelog, governance and the `/story` page.
- Mostly content with a few interactive islands.
- Target: Lighthouse ≥95 for performance and accessibility (BRIEF §12).

## Decision (recommended)

- **Astro Starlight** with React islands.
- Content in Markdown/MDX; ADRs and `docs/log.md` render as-is.
- Brand Generator and live examples mount as React islands (`client:visible`).
- Static output → Vercel or Cloudflare Pages.
- Starlight's theme is mapped to Strata tokens, so the docs are styled with Strata.

## Alternatives considered

- **Next.js** — Anuj knows it; first-class on Vercel. Ships more JS by default on content pages, and docs chrome (sidebar, search, table of contents) is ours to build.
- **Storybook-only docs** — strong for component states (we ship Storybook in Phase 2 anyway). Weak for governance, ADRs and a narrative `/story` page.

## Consequences

- **Good:** fast static pages; search, sidebar and RTL support out of the box; content-first authoring.
- **Bad:** a second framework next to the Vite apps; Anuj is less familiar with Astro; mapping Starlight's theme to Strata tokens is extra work.
- **Revisit when:** docs need server features (auth, per-user data). Not planned.
