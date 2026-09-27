# @strata/codemods

Codemods for Strata's breaking changes. Every breaking change ships with one (`GOVERNANCE.md` §5).

```sh
npx @strata/codemods <transform> <path…> [--dry] [--print] [--source=<module>]
```

- `--dry` changes nothing and lists the files that would change. Add `--print` to see the new source.
- `--source` names another module that exports Strata's components, for registry installs: `--source=@/components/ui/button`.
- Commit or stash your work first, so the codemod's changes are a diff of their own.

## The rule every transform follows

A transform rewrites only what it can be sure of. Anything else that might need the change is **reported with its file and line and left alone**. Read the report; those are yours to fix by hand.

## Transforms

| Transform | Change | Deprecated | Removed | RFC |
|---|---|---|---|---|
| `button-variant-danger-to-tone` | `<Button variant="danger">` → `<Button tone="danger">` | 0.2.0 | 1.0.0 | [RFC-001](../../docs/rfcs/001-button-tone.md) |

### button-variant-danger-to-tone

Rewrites a literal `variant="danger"` (also `{'danger'}` and `` {`danger`} ``) on `Button` imported from `@strata/react` or `@strata/react/ui/button`, including renamed and namespace imports.

Reports and doesn't rewrite:

| Case | Example |
|---|---|
| `variant` is an expression | `variant={isBad ? 'danger' : 'primary'}` |
| Props arrive through a spread | `<Button {...props} />` |
| A spread follows `variant` and may override it | `<Button variant="danger" {...props} />` |
| The element already has a `tone` | `<Button variant="danger" tone="neutral">` |
| Props are an object | `createElement(Button, { variant: 'danger' })` |

Doesn't look at:

- CSS that targets `[data-variant='danger']`. It keeps working until 1.0.0; change it to `[data-tone='danger']` before then.
- Values that reach `Button` through your own wrapper components or shared objects.
- The `ButtonVariant` type used in your own code.

## Adding a transform

1. `transforms/<name>.ts`: a jscodeshift transform, `export const parser = 'tsx'`.
2. `test/fixtures/<name>/<case>.input.tsx`, plus `<case>.output.tsx` when the file should change.
3. `test/<name>.test.ts`: one test per case, including the cases it must only report, and that a second run changes nothing.
4. Name it in the deprecation record in the component's `meta.json`. `pnpm check:meta` fails if the file doesn't exist.

```sh
pnpm --filter @strata/codemods test
```
