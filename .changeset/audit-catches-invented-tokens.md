---
'@syntara/audit': minor
---

New rule `unknown-token`: flags a `var(--syntara-…)` name the theme engine does not emit.

An undefined custom property is not a CSS error. `var(--syntara-radius-md)` parses, and the declaration holding it
is then invalid at computed-value time — it computes to `unset`, so it silently does nothing while still winning
the cascade over any lower-specificity rule that would have worked. Seven invented names had reached the docs site
that way, three of them in `:focus-visible` rules, where the effect was not cosmetic: the focus ring was erased on
five keyboard-reachable elements, over the site's own `:where(…:focus-visible)` fallback, with no error anywhere.
That is a WCAG 2.2 AA 2.4.7 failure that nothing in the build could see.

The known names come from the engine's `toCssVariables`, the same function the exporters and the Brand Generator
use, unioned over every tenant, both schemes and both densities, so the list cannot drift from what ships. Names
outside the `--syntara-` namespace are not the rule's business, and a file that declares a `--syntara-*` name
itself may use it. The fix is never safe: which role is right depends on what the element is, so the rule lists
the candidates and asks for a comment saying why.

The rule is an `error`, and it counts an opportunity for every `--syntara-*` use. **Scores move**: a file that
uses tokens correctly now gains error-weighted passing opportunities, so it scores higher than it did under the
ten-rule set. Audit scores are only comparable within one version of the rule set — the agent eval's recorded
numbers in `evals/results.md` were produced under the old one.
