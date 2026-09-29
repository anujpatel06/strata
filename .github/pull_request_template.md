## What changed

<!-- One or two sentences a consumer would understand. Link the issue, and the RFC if there is one. -->

## Outcome

<!-- GOVERNANCE.md §4 -->
- [ ] Fix or docs
- [ ] Extend (a new prop)
- [ ] New variant
- [ ] New component (RFC: )
- [ ] Breaking change or deprecation (RFC: , codemod: )

## Checks

- [ ] `pnpm typecheck && pnpm test`
- [ ] `pnpm check:meta`
- [ ] `pnpm test:themes`, if tokens, roles or contrast pairs changed
- [ ] Accessibility: the `axe · overlay exit` job is green — it sweeps every docs route in light and dark. There is no violation count to paste here by hand; CI is what asserts it.
- [ ] Screenshots for every tenant × scheme, if anything visible changed
- [ ] Changeset, if a published package changed
- [ ] ADR, if there was a design trade-off
- [ ] `docs/log.md`

## Who decided

<!-- Name the person. If an agent wrote this, say which part a person reviewed. -->
