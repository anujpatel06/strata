# ADR-011: Distribution — npm package and shadcn-compatible registry from one source

- **Status:** Accepted — decided by Anuj (2026-09-26)
- **Date:** 2026-09-26
- **Principles:** 2, 6, 7

## Context

- Anuj set the bar at ui.shadcn.com. shadcn's distribution model ("open code": the CLI copies component source into your project) is how many teams now adopt UI.
- Enterprise design systems usually ship a versioned package, because deprecations, codemods and adoption metrics need a version to point at (BRIEF §7).
- One team rarely needs only one of these. Product teams want to own and tweak code; platform teams want upgrades they can govern.

## Decision

- **One source:** `packages/react/src/ui/*.tsx` + `.module.css`, flat, sibling-relative imports only, and one `meta/<name>.meta.json` per component.
- **npm:** `@strata/react` built with Vite library mode (ESM, `preserveModules`, `'use client'` kept, `dist/styles.css`, `.d.ts`).
- **Registry:** `pnpm registry` writes shadcn registry items to `apps/docs/public/r/`, so `npx shadcn@latest add @strata/<name>` works. The items are components (`registry:ui`), token files per tenant, `@strata/strata` (base tokens + ThemeScope), and `theme-<tenant>` items that re-skin any shadcn project (the shadcn bridge).
- Tailwind is not required by Strata components.

## Alternatives considered

- **Registry only (shadcn way):** fastest adoption, but no versions, so no deprecations or codemods. The governance story would be weaker.
- **npm only:** classic and easy to govern, but it misses the adoption path Anuj asked for.

## Consequences

- **Good:** teams choose ownership or upgrades. The registry was verified with shadcn CLI 4.21 (URL installs, namespaced installs, dependencies, theme merge).
- **Bad:** two artefacts to test. Registry installs are forks: once someone copies the code, our deprecations reach them only as docs, not codemods. Registry dependencies are absolute URLs baked at build time (`STRATA_REGISTRY_URL`).
