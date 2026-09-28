# ADR-026: A style that restyles a component must outweigh it; stylesheet order decides nothing

- **Status:** Accepted for the docs site — **Claude** (pending Anuj's review). Cascade layers for the package are a proposal for a later RFC.
- **Date:** 2026-09-28
- **Principles:** 7

## Context

- A class passed to a component (`<Card className={styles.promo}>`) lands on the same element as the component's own class. Both are one class, so they weigh the same, and the rule in whichever stylesheet loads later wins.
- The bundler decides that order from the import graph. On 2026-09-28 the docs site gained a new importer of `@strata/react` (`@strata/sdui`). The order changed, and the Portfolio block grew from 1,440px to over 8,000px wide in every left-to-right tenant.
- Typecheck, 1,422 tests, the docs build and the drift gate all passed. A subagent's screenshot review caught it.
- 163 selectors in 26 docs stylesheets had the same weakness. Some blocks already doubled their classes; the rule was a habit, not a check.

## Decision

- **In the docs site, a class that restyles a Strata component is written twice** (`.promo.promo`). It then wins in any order.
- **A script checks it:** `node scripts/check-override-weight.mjs`, in CI and in `/verify`. `--fix` doubles the class.
- **The 163 selectors were doubled.** Portfolio, and every other block in four tenants at 1,440 and 390px, was compared pixel by pixel with the last commit.
- **Two small changes are kept:** in the dashboard block, the "View all" icon is now 1em and sits 2px further along, and in the request flow a 15px mark near the top changed. In both, the block's own rule had been losing to the component's. It now wins, which is what the block's stylesheet says.

## Alternatives considered

- **Cascade layers in the package** (`@layer strata`): the better answer for consumers, because any style of theirs would win with no doubling. But an unlayered reset such as `button { color: inherit }` would then beat the components too, so every consumer would need to put their reset in a lower layer, and layer order itself depends on which stylesheet declares it first. It changes how every consumer's styles resolve, so it needs an RFC and a release note, not a fix on the way to something else.
- **`:where()` in the components** to weigh nothing: the same reset problem.
- **Pin the stylesheet order:** the bundler offers no reliable way.

## Consequences

- **Good:** the fault can't come back unnoticed in the docs. The visual comparison that found the second half of the problem is now a known method.
- **Bad:** doubled classes are ugly, and consumers of the package have the same weakness with no check. Agents in the eval already double their classes, having copied the habit from the package's source. The script reads `styles.name` in a component's opening tag; a class that reaches a component another way isn't seen.
- **Revisit when:** an RFC for cascade layers is written; a consumer reports the same fault.
