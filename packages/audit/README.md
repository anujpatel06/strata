# @syntara/audit

The drift auditor. It reads TSX and CSS, finds code that has left the design system, says what to write instead, and gives a score from 0 to 100 (BRIEF §9, ADR-018).

The CLI, the MCP server's `audit_snippet` and `find_token` tools, and the agent eval all run this one engine.

```sh
pnpm drift <path…> [--format text|json|html] [--out <file>] [--fix] [--min-score <n>] [--tenant <id>] [--scheme light|dark] [--ignore <glob>]
```

| Option | What it does |
|---|---|
| `--format text` | Findings by file, then a summary by rule, then the score. The default. |
| `--format json` | The `AuditResult`. stdout holds the JSON and nothing else; messages go to stderr. |
| `--format html` | One self-contained page, styled with Syntara's tokens, light and dark. |
| `--out <file>` | Writes the report to a file. |
| `--fix` | Writes the safe fixes to the files, prints what it changed and how many findings it left, then reports on the files as they now are. |
| `--min-score <n>` | Exits 1 when the score is below `n`. This is the CI gate. |
| `--tenant <id>` | Matches raw values against this tenant's tokens. Default `house`. |
| `--ignore <glob>` | Skips matching paths. Can be given more than once. |

Exit codes: 0 done, 1 below `--min-score`, 2 the command could not run.

Always skipped: `node_modules`, `dist`, `build`, `.next*`, `*.generated.*`, and folders named `fixtures` or `__fixtures__`. Files read: `.tsx`, `.jsx`, `.css`.

There is no build step. Tokens come from running the theme engine on `tenants/<id>/brand.json`. Components and deprecations come from `packages/react/meta/*.meta.json`.

## API

```ts
import { auditSource, auditPaths, scoreOf, findToken, applyFixes } from '@syntara/audit';

auditSource(code, { filename?, language?, tenant?, scheme? })  // → { findings, stats, notes? }
auditPaths(paths, { tenant?, scheme?, ignore? })               // → AuditResult
scoreOf(findings, stats)                                       // → number
findToken('#1f56e0', { category: 'color' })                    // → TokenMatch | null
applyFixes(code, findings)                                     // → string
```

The types are in `src/types.ts`. `applyFixes` applies only fixes with `safe: true`, from the end of the source to the start, and skips a fix that overlaps one it has applied.

## Rules

| Rule | Severity | Fires on | Does not fire on |
|---|---|---|---|
| `raw-color` | error | Hex, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklch()`, `oklab()`, `color()` and named colours, in CSS values, custom properties, `var()` fallbacks, inline style objects, and `fill`, `stroke`, `color` and `stopColor` attributes on native elements | `var(--…)`, `transparent`, `currentColor`, `inherit`, `color-mix()` whose colours are tokens or `transparent`, system colours such as `CanvasText`, colours inside a mask |
| `off-scale-space` | warning | px and rem in `margin`, `padding`, `gap`, `inset` and their sides, `top`, `right`, `bottom`, `left`, `scroll-margin`, `scroll-padding` | `0`, `1px`, `2px`, `%`, `fr`, `em`, `auto`, unitless numbers, viewport units, `var()` |
| `off-scale-radius` | warning | px and rem in `border-radius` and the corner properties | the same |
| `off-scale-font-size` | warning | px and rem in `font-size` | `em`, `%`, `inherit`, `var()` |
| `raw-font-weight` | warning | Numbers, `normal`, `bold`, `bolder`, `lighter` | `inherit`, `var()` |
| `font-family-literal` | warning | A family that is written out, a `font` shorthand with raw values, a `var()` that is not a Syntara font and has a written-out fallback | `var(--syntara-font-*)`, `inherit`, a private `var(--_x)` with no fallback |
| `native-element` | error | `<button>`, `<a>`, `<select>`, `<textarea>`, `<table>`, and `<input>` of a type Syntara has a component for | `<input type="hidden">`, input types with no Syntara component (`color`, `time`…), a component's own file in `packages/react/src/ui` rendering the element it wraps |
| `physical-property` | error | `margin-left`, `padding-right`, `top`, `left`, `border-left`, `border-top-left-radius`, `scroll-margin-top`; `text-align`, `float` and `clear` with `left` or `right`; four-value `margin`, `padding`, `inset` and `border-*` whose left and right differ; `border-radius` whose left and right corners differ | Logical properties, shorthands that are the same on both sides |
| `missing-accessible-name` | error | See below | |
| `deprecated-api` | warning | A prop or a literal prop value with a deprecation record, on a component imported from `@syntara/react` | Expressions, components from other libraries |

Every finding carries a fix (BRIEF principle 7). A fix is **safe** when there is one right answer and applying it can't change behaviour or meaning. Everything else is a suggestion for a person.

| Rule | Safe when |
|---|---|
| `raw-color` | The colour is opaque and exactly one role has that value for the tenant and scheme. When several roles share the value, or the match is only near, the fix is a suggestion and says the ΔE. |
| `off-scale-*`, `raw-font-weight` | The value is in px (or a weight), equals a token, and only one token has that value. A rem value is never safe: the tokens are px and rem follows the reader's font size. |
| `physical-property` | The mapping is one to one: a property (`margin-left` → `margin-inline-start`) or a keyword (`text-align: left` → `start`). Shorthands that need their values reordered are suggestions. |
| `deprecated-api` | The value is a literal, the element has no spread, and it doesn't already have the new prop. The message names the codemod from the record. |
| `font-family-literal`, `native-element`, `missing-accessible-name` | Never. |

### Disable comments

```css
/* syntara-audit-disable-next-line raw-color -- the partner's logo colour, fixed by contract */
color: #ff6600;
```

```tsx
{/* syntara-audit-disable-next-line native-element -- the skip link must work before hydration */}
<a href="#main">Skip to content</a>
```

- The comment silences the named rules on the next line that has code. Several rules are separated by commas.
- A reason after `--` is required. A comment with no reason silences nothing and is reported as a warning under the rule it names.
- A comment that names an unknown rule, or no rule, silences nothing and is listed in `notes`.
- Silenced findings are counted in `stats.suppressed` and shown in every report.

## Score

```
failed = 3 × errors + 1 × warnings
total  = 3 × (places looked at by error rules) + 1 × (places looked at by warning rules)
score  = floor(1000 × (1 − min(1, failed ÷ total))) ÷ 10
```

- No findings gives 100, and so does a source with nothing to look at.
- Every place failing gives 0.
- The score is cut to one decimal, never rounded up. 99.95 is 99.9.

**Weights.** An error is 3 and a warning is 1. An error breaks something for a person: a colour that ignores the brand and the dark scheme, a layout that doesn't mirror, a control with no name. A warning is a value that has left the scale but still renders and reads correctly.

The weights were chosen before any codebase was scored. They are not tuned to make one pass.

**Places looked at** (`stats.opportunities`). A rule counts one place each time it checks something, whether it passes or fails:

- each colour value in a property that takes a colour, including each `var()`;
- each length in a spacing, radius or font-size declaration;
- each `font-weight`, `font-family` and `font` declaration;
- each declaration whose property has a direction (`margin*`, `padding*`, `inset*`, `border*`, `text-align`, `float`, `clear`…);
- each native element that has a Syntara component, and each use of that component;
- each image, native form control, icon-only button and link;
- each use of a component that has a deprecation record.

`stats.opportunitiesByRule` holds the split. `scoreOf` needs it to weigh each place by its rule's severity. When it is missing, every place is weighed as a warning. That makes `total` as small as it can be, so the score can only come out lower, never higher.

**What the score does not say.** It is a ratio, so a large codebase with few findings scores high. Read the finding counts next to it. It does not measure contrast, keyboard behaviour or how the page looks.

## Limits of each check

All checks read one file at a time. None follows a value into another module.

- **TSX styles.** Only `style={…}` with an object literal, or a `const` object in the same file. Values that are expressions, template strings with `${}` and spreads are not read. `className` strings, styled-components and CSS-in-JS are out of scope.
- **raw-color.** A named colour is only read as a colour in a property that takes one, or as the whole value of a custom property. Colours in `.ts` files, in data and in SVG files are not read. A nearest role is nearest by colour, not by meaning: check that the role fits.
- **off-scale-\*.** Lengths in `width`, `height`, `inline-size`, `border-width`, `outline-offset`, `translate`, `box-shadow` and custom properties are not checked. The 4px halo and translate distances in CONVENTIONS live in those properties, so they pass. `line-height` and `letter-spacing` are not checked. The space scale is matched, not the density tokens (`--syntara-card-inset`…).
- **Exact matches are per tenant.** `8px` equals `radius.badge` for house. The fix is right for house today. It does not know whether the thing is a badge.
- **physical-property.** `width` and `height` are not reported: they do not change with text direction. Physical names inside values (`transition: margin-left`, `background-position: left`, `transform-origin`) are not read.
- **native-element.** It knows nothing about why a native element was chosen. A skip link or a static data table is reported like any other. Use a disable comment with the reason. Elements from React Aria or other libraries are not reported.
- **missing-accessible-name.** This check is basic. It reads one file and **cannot see names that arrive through props**, a spread, `children`, or a label in another file. When it can't tell, it says nothing. It reports:
  - a Syntara `Button` with `size="icon"` and no `aria-label` or `aria-labelledby`;
  - `<img>` with no `alt`;
  - `<input>`, `<select>` and `<textarea>` with no `aria-label`, `aria-labelledby`, `title` or `id`, and no `<label>` around them. An `id` passes even when no `<label htmlFor>` points at it;
  - a `<button>`, `<a>`, `<summary>`, Syntara `Button` or Syntara `Link` whose only child is an `<svg>` or an icon from `@syntara/icons`, with no name on either.

  It does not check that a name is a good one, and it is not a replacement for axe or a screen reader.
- **deprecated-api.** Literal values only. `variant={bad ? 'danger' : 'primary'}`, props objects and wrapper components are not seen. The codemod reports those.
- **Where it runs.** The package reads `packages/react/meta` and `tenants/` from this repo. `SYNTARA_META_DIR` and `SYNTARA_TENANTS_DIR` point it somewhere else.

## Additions to the contract

`src/types.ts` is the contract. Four optional fields were added; nothing was renamed or removed.

| Field | Why |
|---|---|
| `AuditStats.opportunitiesByRule` | The score weighs each place by its rule's severity. |
| `AuditStats.suppressed` | Findings silenced by a disable comment are counted, not hidden. |
| `AuditResult.notes` (also returned by `auditSource`) | Disable comments that name an unknown rule, and files that could not be read or parsed. |
| `TokenMatch.alternatives` | Other tokens with the same value. When an exact match has alternatives, its fix is not safe. |

`findToken` also accepts `category: 'font'`, the MCP server's name for both font sizes and weights.

## Tests

```sh
pnpm --filter @syntara/audit test
pnpm --filter @syntara/audit typecheck
```

Fixtures are in `test/fixtures`. A line that must fire carries a comment `expect: <rule>`, once per finding. Every other line must stay silent, so each fixture tests both.
