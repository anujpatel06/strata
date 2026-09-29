# ADR-034: The wire validator is compiled at build time, so the site needs no 'unsafe-eval'

- **Status:** Accepted — **Claude** (pending Anuj's review).
- **Date:** 2026-09-29
- **Principles:** 7

## Context

- The CSP added with the Cloudflare config (ADR-030) broke `/docs/server-driven-ui` on the first real deploy. The demo validates a screen in the browser with ajv, and ajv turns a JSON Schema into a validator with `new Function` the first time it is used. A policy without `'unsafe-eval'` forbids that, the call threw, and the page never hydrated at all.
- **Nothing applies `apps/docs/public/_headers` locally or in CI.** `serve` ignores it, so the policy had never been enforced anywhere it was tested. It reached production unseen.
- The first fix — a scoped exception for that one path — **did not work, and the check used to confirm it could not tell.** Cloudflare Pages sends the header from *every* matching rule, so the page received two `Content-Security-Policy` headers: the site-wide one and the exception. A browser given two enforces both, so the stricter one still blocked eval. `curl | grep unsafe-eval` found the permissive header and reported success.
- The demo has a live JSON editor, so validation genuinely has to run in the browser against arbitrary input. Validating only the shipped examples at build time would not do.

## Decision

- **`scripts/generate.ts` compiles the screen validator** with ajv's standalone mode and writes `src/validator.generated.js`. `validateScreen` imports it. The schemas are fixed and only the document varies, so there is nothing left to compile at run time and the browser just runs a function.
- **The generator uses the same ajv options as `createAjv()`** — `strict`, `allErrors`, `verbose`, `discriminator` — because `formatErrors` reads fields that `verbose` adds. Proved equivalent before the change: the runtime and precompiled validators agreed on all three shipped examples and four malformed documents, verdict and error count.
- **`SYNTARA_KEYWORDS` moves to `contract.ts`**, re-exported from `validate.ts` so the public API is unchanged. The generator needs it, and `validate.ts` now imports the file the generator writes — importing it from there was a cycle.
- **No path needs an exception, so `_headers` has one rule again.**
- **`scripts/check-csp.mjs`** loads every route with the policy read out of `_headers` and fails on a page the policy breaks. It reads the real file, so the check and the deployment cannot drift.

## Alternatives considered

- **`'unsafe-eval'` site-wide.** One line. It gives up the main thing a CSP is for, across every page, to serve one demo.
- **Keep the scoped exception.** It does not work, per the two-header behaviour above.
- **Drop the CSP.** Loses a real protection because of one page.
- **Validate on a server.** There is no server: the site is a static export (ADR-030).

## Consequences

- **Good:** the strict policy covers the whole site with no exception, and a CSP that breaks a page now fails a check instead of a deploy.
- **Good:** the browser no longer compiles schemas, so the first validation on that page is cheaper.
- **Bad:** `src/validator.generated.js` is ~377KB of generated JavaScript in the repo, and it has to be regenerated whenever the schemas change. `test/generate.test.ts` already fails on stale generated output.
- **Bad:** ajv is still bundled for `createAjv()`, which the tests and tools use, so the page does not get smaller. Splitting that into its own entry point would be a separate change.
- **Revisit when:** the schemas grow enough that the generated file is a problem, or `createAjv` moves out of the browser path.
