# RFC-001: Button gets `tone`; `variant="danger"` is deprecated

- **Status:** Accepted — decided by **Claude recommended, Anuj accepted** (2026-09-27)
- **Date:** 2026-09-27
- **Kind:** API change + deprecation
- **Trust level:** Hard gate. Claude drafted this RFC and built the change; Anuj decided the three open questions below.
- **ADR:** [ADR-021](../adr/021-button-tone-and-deprecation-policy.md)

## The need

- Button is the only component that puts a status in `variant`. Alert, AlertDialog, Amount, Avatar, Badge, Eyebrow, Menu, Meter, Progress, Sparkline, Tag and Toast all use `tone`, and `variant` means visual emphasis everywhere else.
- Because danger is a variant, there's one destructive button: the loud solid one. A "Remove" action in a table row or a card footer has no quiet option, so screens either shout or use a neutral button for a destructive action.
- BRIEF §7 asks for one real deprecation, done end to end, as the proof that the governance process works.

## Proposal

```tsx
<Button tone="danger">Delete account</Button>                    // solid: what variant="danger" is today
<Button variant="outline" tone="danger">Remove card</Button>     // new
<Button variant="ghost" tone="danger">Discard draft</Button>     // new
```

- `tone?: 'neutral' | 'danger'`, default `'neutral'`.
- `tone` applies to `primary`, `outline` and `ghost`. On `secondary`, `link` and `contrast` it's ignored, with a warning in development.
- `variant="danger"` keeps working until 1.0.0 and renders exactly as before, `data-variant="danger"` included.
- The new label colour is `feedback.danger.fg`. Hover and press use `feedback.danger.bg` as the face: a pair the engine already solves.

## Extend, vary, add or override?

**Extend.** A new prop that fits the component's purpose, using a word the system already has. It isn't a new variant: a fourth and fifth danger variant would multiply the list instead of fixing the axis.

## Alternatives

- **`tone="critical"`** (the brief's wording): `critical` would appear in one component while twelve components and the `feedback.danger.*` tokens say `danger`.
- **Rename danger to critical everywhere:** consistent, but a breaking token change in every tenant and twelve components. Far larger than the need.
- **Add `danger-outline` and `danger-ghost` variants:** no deprecation needed, but it makes the inconsistency permanent.
- **Tone on `primary` only:** the smallest change, but it adds a prop that does nothing on most variants and doesn't meet the need.

## Cost

- **Every tenant:** the feedback hues don't follow the brand, but the surfaces do. `feedback.danger.fg` wasn't guaranteed on `surface.canvas` or `surface.raised`, where a ghost button can sit. Both were added to `contrast-pairs.json` for all four feedback tones. Result: 118,000 of 118,000 checks pass, 118 per brand (was 102) — `pnpm test:themes`.
- **Glass:** feedback colours aren't solved on glass. A ghost danger button must not sit directly on a dialog, popover or menu; use outline or solid there. This is a documented rule, not an enforced one, until the drift auditor exists (Phase 5).
- **Consumers:** nothing breaks. Old code gets a warning in development. There's no editor strikethrough: TypeScript can't deprecate one value of a prop. The exported `ButtonVariant` type keeps `'danger'` until 1.0.0.
- **Maintenance:** one CSS rule set serves the old and new selectors, so they can't drift.

## Migration

- Deprecated in **0.2.0**. Removed in **1.0.0**.
- Codemod: `button-variant-danger-to-tone`.

  ```sh
  npx @syntara/codemods button-variant-danger-to-tone <path>
  ```

- It rewrites `variant="danger"` and `variant={'danger'}` on `Button` imported from `@syntara/react`, including renamed imports.
- It reports, and doesn't rewrite, anything it can't be sure of: a `variant` that's an expression (`variant={isBad ? 'danger' : 'primary'}`), props that arrive through a spread, and a `Button` that doesn't come from `@syntara/react`.
- CSS that targets `[data-variant='danger']` keeps working until 1.0.0. The codemod doesn't touch CSS; the release notes say what to change.

## Open questions, as decided

| Question | Decision | By |
|---|---|---|
| Rename target | `tone="danger"` | Claude recommended, Anuj accepted |
| Which variants take a tone | primary, outline, ghost | Claude recommended, Anuj accepted |
| Removal before 1.0 | at 1.0.0 only | Claude recommended, Anuj accepted |

## Checklist before release

- [ ] `meta.json` updated, with the deprecation record
- [ ] Tests, including a contrast proof for the new pairs
- [ ] Examples and docs
- [ ] Codemod with fixture tests, run on this repo
- [ ] Changeset
- [ ] ADR-021
