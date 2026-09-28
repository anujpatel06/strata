---
name: new-component
description: Scaffold and build a new Syntara component end to end (tsx, CSS module, meta.json, tests, docs examples, registry) following packages/react/CONVENTIONS.md.
argument-hint: "<kebab-name> [what it is for]"
---

New component: $ARGUMENTS

1. Read `packages/react/CONVENTIONS.md`, `packages/react/meta/schema.ts`, and 1–2 similar existing components.
2. Check React Aria Components for a primitive (`node_modules/react-aria-components/dist/types/exports/index.d.ts`). Wrap it; don't re-implement it.
3. Propose the API in 5–10 lines: props, variants and sizes using the shared vocabulary, sub-components. **Ask Anuj before building** if there's a real design trade-off.
4. Create:
   - `packages/react/src/ui/<name>.tsx` (`'use client'`, sibling-relative imports)
   - `packages/react/src/ui/<name>.module.css` (tokens only, logical properties)
   - `packages/react/meta/<name>.meta.json`
   - `packages/react/test/<name>.test.tsx`
   - `apps/docs/examples/<name>/<name>-demo.tsx` + 2–5 more examples
5. Run `pnpm --filter @syntara/react gen:index`, then the component's tests, `pnpm check:meta` and `pnpm registry`.
6. Run `/screenshots <name>` in the playground and fix what you see.
7. The docs page is generated from the meta file automatically. Check `/docs/components/<name>`.
8. Add a line to `docs/log.md`.
