# ADR-037: Publish the repository open source and list the site as a 21st.dev template

- **Status:** Accepted — decided by Anuj (Claude recommended a narrower option; see Alternatives)
- **Date:** 2026-10-01
- **Principles:** none of BRIEF §3 bear on this. It is a distribution and licensing decision, not a system-design one.

## Context

- The repository is private (`gh repo view --json isPrivate` → `true`), MIT-licensed, 0 stars, 65 commits.
- 21st.dev hosts components, templates and shadcn themes. A whole website is listed as a **template**; there is no site directory. Its **Documentation** category holds 11 templates out of roughly 700 — the thinnest shelf on the site.
- Open-source templates there are rehosted by 21st **pinned to one commit, licence intact**, and installed with `npx @21st-dev/cli@latest template add <slug>`. That requires a public repo.
- A listing needs a live preview. `curl -s -o /dev/null -w '%{http_code}' https://syntara.pages.dev` → **200**.
- A pre-publication audit (logged 2026-10-01) found no credentials in any of the 65 commits, no `.env` files, no personal contact details, and no real company passed off as a tenant.

## Decision

- **Make the repository public under its existing MIT licence**, whole, including `apps/docs`, all six tenants and their copy.
- **Submit it to 21st.dev as an open-source template** in Documentation, with Portfolio, Developer Tool, Next.js and React as secondary tags, and `https://syntara.pages.dev` as the preview.
- **Publish the monorepo as-is.** Nothing is extracted: a template whose entry point is `pnpm install && pnpm docs` keeps `apps/docs/lib/repo.ts` reading `tenants/*` and `packages/react/meta/*` from the repo root, as it does today.
- **Prerequisites before the repository is flipped:** regenerate the stale screenshots, and prove a clean clone builds and serves.
- **The shadcn-directory route stays closed.** That crawl indexes *served* registries, and ADR-011's revision keeps `pnpm registry` output gitignored and unserved. Nothing here reopens it; a separate ADR would.

## Alternatives considered

- **Publish only the docs-site shell** — one neutral tenant, placeholder copy, the five real brands and the written content withheld. Claude recommended this: it reaches the same empty Documentation shelf, advertises `@syntara/*` on every install, and keeps the artefact being published distinct from the artefact used in interviews. Anuj chose reach over that separation.
- **Sell it as a paid template from the private repo** (the going rate there is $19–$99, zip upload). Rejected: smallest audience, and no track record as a seller.
- **Do nothing.** Rejected: the differentiation research for Phase 6 is still outstanding, but the Documentation shelf is open now and costs little to take.

## Consequences

- **Good:** the whole system becomes inspectable — the engine, the contrast solver, the governance record and the ADRs, not just the rendered site. The listing links back on every install.
- **Bad:** irreversible. Once public, assume it is cloned and cached beyond reach. MIT lets anyone ship this site commercially keeping only the copyright line, including a site indistinguishable from the portfolio it was built to be. Anuj was told this before deciding.
- **Bad:** the repo now carries a public audience's expectations — issues, questions, and a `GOVERNANCE.md` that describes a team process run by one person.
- **Revisit when:** 21st rejects a monorepo template (then `apps/docs` must be extracted, and `lib/repo.ts`'s `REPO_ROOT = cwd/../..` is the chokepoint), or the differentiation research concludes that design-engineer registries are not the audience worth reaching.
