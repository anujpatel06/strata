# AGENTS.md — building with Strata

For AI coding agents that write product UI with Strata, or change Strata itself. People should read `GOVERNANCE.md`.

Strata is a multi-brand design system. One codebase renders every brand, in light and dark, left to right and right to left. A brand is data: tokens and copy. If your code names a brand or a colour, it's wrong.

## Look it up, don't guess

With the Strata MCP server connected:

| Need | Tool |
|---|---|
| Which component does this job? | `list_components` |
| Props, other imports, type traps, keyboard, deprecations | `get_component` |
| Working code to start from | `get_example` |
| A page layout: dashboard, multi-step form, settings | `get_pattern` |
| Which token is this value? | `find_token` |
| Token values | `get_tokens` |
| An icon's exact name | `find_icon` |
| Is my code on-system? | `audit_snippet`, before you finish |

Without the server, read `packages/react/meta/<name>.meta.json` and `apps/docs/examples/<name>/`, and icon names in `@strata/icons/src/icons/`.

## Rules

1. **Use Strata components.** Import from `@strata/react`. No native `<button>`, `<input>`, `<select>`, `<textarea>` or `<table>` where a component exists. Icons come from `@strata/icons`: look each name up with `find_icon`. Never guess one; if none fits, use no icon.
2. **Tokens only.** Colours, spacing, radii, font sizes and weights are `var(--strata-*)`. No hex, `rgb()`, `hsl()` or `oklch()`. No pixel values except `0`, `1px` and `2px`.
3. **Logical properties only.** `margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`. Never `left` or `right`.
4. **Every control has a name.** Icon-only buttons need `aria-label`. Fields need a `label`. Images need `alt`.
5. **Status is never colour alone.** Pair it with an icon or words.
6. **No brand names in code.** No `if (tenant === …)`. Wrap the page in `ThemeScope`, and pass it `locale` for right-to-left.
7. **Don't use deprecated APIs.** `get_component` lists them with the replacement. Today: `Button variant="danger"` → `tone="danger"`.
8. **Don't invent props.** If `get_component` doesn't list it, it doesn't exist.
9. **Nothing scrolls sideways at 390px.** Grid columns are `minmax(0, 1fr)`, not `1fr`. Rows of controls wrap.

## What you may do alone

| Level | You may | A person |
|---|---|---|
| **Ambient** | Apply fixes the auditor marks `safe: true`: an exact token for a raw value, a one-to-one logical property, a literal deprecated value | Sees it in the diff |
| **Soft gate** | Open a pull request for docs, `meta.json` or examples | Approves |
| **Hard gate** | Draft an RFC for a new component, a breaking change, a deprecation, a token change, or a change to what the theme engine guarantees | Decides. You don't merge |

A fix marked `safe: false` is a suggestion. Show it; don't apply it without being asked.

## If Strata can't do what you need

Don't work around it with raw CSS or a native element. Say what's missing, build the closest thing from existing components, and leave a comment that names the gap. A one-off stays in the product, outside the system.

## Changing Strata itself

Read `CLAUDE.md`, `packages/react/CONVENTIONS.md` and `GOVERNANCE.md` §5 first. Every number you report comes from a script, with the command next to it.
