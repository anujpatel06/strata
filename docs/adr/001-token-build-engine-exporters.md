# ADR-001: Token build — the engine owns the exporters

- **Status:** Accepted — Claude recommended, **Anuj** accepted (2026-09-27)
- **Date:** 2026-09-26
- **Principles:** 2, 3, 6

## Context

- The Brand Generator builds and exports themes **in the browser, at runtime**, from any hex a user pastes.
- The three tenants need the same files at build time (`pnpm tokens` → `packages/tokens`).
- Style Dictionary and Terrazzo are built for build pipelines: config files, platforms, file output. Style Dictionary v4 can run in a browser, but bundling it into the generator adds weight and a second model (transforms/formats) for three simple outputs.
- Using a build tool for tenants and the engine for the generator means two code paths writing the same files. They would drift.

## Decision

- `@strata/theme-engine` owns the exporters: `toCSS`, `toDTCG`, `toFigmaFiles` (`src/export/*`).
- `pnpm tokens` runs those same functions over `tenants/*/brand.json`.
- One path: brand input → engine → CSS / DTCG / Figma. Generator download = published package for the same input.
- Zero runtime dependencies.

## Alternatives considered

- **Style Dictionary v4+** — industry default, many platform transforms. Not needed for web-only output; a second source of truth next to the in-browser path.
- **Terrazzo** — DTCG-native, good fit. Same issue: build-time pipeline, separate from what the generator runs.
- **Both (tool for build, engine for browser)** — two implementations of one format; the generator's export could silently differ from the package.

## Consequences

- **Good:** one code path, unit-tested in Vitest; no dependency to explain or upgrade; generator and package cannot disagree.
- **Bad:** we own format correctness (DTCG spec changes, Figma plugin quirks — see ADR-010). No free iOS/Android transforms. Reviewers may expect Style Dictionary — this ADR is the answer.
- **Revisit when:** a second platform (iOS, Android, Flutter) needs output. Then feed the engine's DTCG file into Style Dictionary v4+ or Terrazzo as a downstream step. The engine stays the source.
