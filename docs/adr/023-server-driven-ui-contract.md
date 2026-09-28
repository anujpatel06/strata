# ADR-023: The server-driven UI contract: what crosses the wire, and what a client does with the unknown

- **Status:** Accepted — **Anuj delegated the call** ("fix all of these, do what is correct", 2026-09-28); Claude decided. The scope (a schema, a validator and one web renderer; no native renderer) is ADR-019, which Anuj accepted.
- **Date:** 2026-09-28
- **Principles:** 1, 2, 3, 6

## Context

- ADR-019 chose a schema generated from `meta.json` over native components. It left the rules open.
- A screen document comes from a backend, so the client must treat it as untrusted and must never crash on it.
- The subagent that built `packages/sdui` had to settle 26 points the brief didn't. They're listed in `packages/sdui/README.md`; the ones with consequences are here.

## Decision

- **A slice, not the library.** 26 node types: 22 from 15 display and action components, plus `Stack`, `Inline`, `Text` and `Heading`. Inputs, overlays, tables and charts are out: they need a model for state and events that this slice doesn't define.
- **Never on the wire:** functions, `style`, `className`, raw HTML, brand or tenant, and deprecated props and values. Interactive nodes carry an `action` (`navigate` or `event`) that the host app handles.
- **Links are `https://` or an app path.** Anything else, such as `mailto:` or `tel:`, goes to the host as an event.
- **Accessibility is part of the schema.** An icon-only button without a label, an avatar without a name, or a meter without a label fails validation.
- **Strict validator, tolerant renderer.** `validateScreen` rejects anything unknown, for the people producing documents. The renderer drops unknown props and values, swaps an unknown node for its `fallback`, and reports each through `onIssue`. If the rest is still invalid, the whole screen falls back.
- **The schema has its own version, starting at 1.0.0.** A client supports one major. Within a major the generator refuses to remove anything and demands a minor bump when the wire gains something. Adding an icon to `@syntara/icons` is such a gain.
- **The renderer looks components up in an explicit registry,** never by name in the package's exports.
- **Direction follows the copy's language.** The renderer sets `lang` and `dir` from `screen.locale`. A document with no locale follows the client. Formatting, theme, scheme and density always follow the client.

## Alternatives considered

- **Tolerant validator:** one code path, but producers would never learn their documents are wrong.
- **Version the schema with `@syntara/react` (0.x):** one number, but "a client supports one major" means nothing at 0.x.
- **Leave direction to the client always:** the first design. English copy in a right-to-left client was reordered by the browser: "−₹1,240" read "₹1,240−". Direction is a property of the copy's language, not of the brand, so principle 2 doesn't cover it.
- **Include CardMedia and AvatarGroup:** dropped. There's no image node yet, and AvatarGroup's "+N" label is English by default.

## Consequences

- **Good:** the contract comes from the same files as the docs, and its rules are tested: 147 tests, `pnpm --filter @syntara/sdui test`.
- **Bad:** it's a slice. A real product screen with a form or a table can't be expressed yet. Adding an icon now means a schema version bump. React Aria still takes its direction from the client's locale, so a screen whose language runs the other way has layout in one direction and keyboard behaviour in the other; no component in this slice uses arrow keys, so nothing shows it yet.
- **Revisit when:** a component with arrow-key navigation joins the wire; a form or table is needed on the wire; a native client is written against the schema.
