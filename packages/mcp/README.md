# @strata/mcp

Strata's MCP server. AI coding agents read components, tokens, patterns, icons and usage rules from the same files the docs site reads, and check their own code with the drift auditor.

- Transport: stdio.
- Server name: `strata`. The version comes from `package.json`.
- **Read-only.** No tool writes a file. See [Read-only](#read-only).
- Responses are compact JSON with no prose around them.

## Where the data comes from

The server reads the repo when a tool is called. There is no build step.

| Data | Source |
|---|---|
| Components | `packages/react/meta/*.meta.json` (ADR-007) |
| Tokens | `@strata/theme-engine` run on `tenants/<id>/brand.json` |
| Patterns | `apps/docs/blocks/blocks.json` and `apps/docs/blocks/<name>/<name>.tsx` |
| Examples | `apps/docs/examples/<component>/*.tsx` |
| Icons | `packages/icons/src/index.ts` and the files it re-exports from `packages/icons/src/icons/` |
| Audit and token matching | `@strata/audit` |

A file is read again when its modified time or size changes, so an edit to a meta file shows up on the next call.

The repo root is three folders up from this package. Set `STRATA_ROOT` to use another checkout.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `list_components` | `{ category? }` | `name`, `title`, `maturity`, `purpose`, and `deprecations: n` when the component has any |
| `get_component` | `{ name }` | import line, `imports` (other packages it needs), props, `typeNotes`, deprecations (what, replacement, since, removal, codemod), keyboard, accessibility notes, do, don't, tokens, usage snippet, example names |
| `get_tokens` | `{ category?, tenant?, scheme? }` | With a category: `{ token, cssVar, value }` for each token. With none: a count for each category |
| `find_token` | `{ value, tenant?, scheme?, category? }` | The nearest token for a raw value, with its distance and the reason. From `findToken` in `@strata/audit` |
| `get_pattern` | `{ name?, includeSource? }` | With no name: the list of patterns. With a name: components, structure, source path. The code only with `includeSource: true` |
| `audit_snippet` | `{ code, language?, tenant? }` | `score` (0–100) and findings: rule, severity, line, message, fix. From `auditSource` and `scoreOf` in `@strata/audit` |
| `get_example` | `{ component, example? }` | The source of one docs example. Default: the component's `-demo` example |
| `find_icon` | `{ query, limit? }` | Icons from `@strata/icons` that match, best first: `name`, `group`, and `synonymOf` when a synonym led there. With no match: `icons: []`, the `closest` names and a `note` that says so |

`get_example` and `find_icon` are additions to the six tools in BRIEF §8. Agents copy working code more reliably than they read prop tables, and these are the files the docs site renders. In the agent eval, runs with the server imported icons that don't exist (`IconAward`, `IconMinus`, `IconClipboardCheck` and others; `evals/runs/iter-1/INVALID.md`, `evals/runs/iter-2/NOTES.md`), because the server had no way to look one up.

### `get_component`: `imports` and `typeNotes`

Both come from the component's meta file (`packages/react/meta/schema.ts`: `ImportDoc`, `TypeNote`), so the docs and the server can't disagree. `pnpm check:meta` validates them.

- **`imports`**: `[{ line, why }]`. The exact import line for another package the consumer needs, e.g. `import { parseDate, parseDateTime, today, getLocalTimeZone, type DateValue } from '@internationalized/date';` for `date-picker`. **The consumer must have that package installed** (`pnpm add @internationalized/date`). `@strata/react` depends on it, but a consumer's own code can only import packages in its own `package.json`: under pnpm's default layout the import fails otherwise, as it did in the eval's first iteration. The package must be one of the component's `dependencies`, and `check:meta` checks that it exports every name.
- **`typeNotes`**: `[{ prop?, note, example? }]`. A type that is easy to get wrong, with one line of code that type-checks. Each note is based on a type error an eval run hit, or on the component's own types.
- A component without them has neither key. No `imports` means `@strata/react` is all it needs.

Filled today: `imports` for `date-picker` and `calendar`; `typeNotes` for `button`, `chip`, `combobox`, `data-table`, `empty-state`, `icon-tile`, `menu`, `select`, `tabs` and `toggle-group`.

### `find_icon`

- Names are read from the icon package's source when the tool is called, so a new icon shows up without a restart. The group is the file an icon comes from (`core`, `navigation`, `status`, …).
- It matches the words of the query against the words of each name (`IconArrowDownLeft` → arrow, down, left), including plurals and prefixes of three letters or more. Rarer words count a little more, and names with fewer extra words rank higher.
- `SYNONYMS` in `src/icons.ts` maps product words to icons, e.g. award → `IconTrophy`, tv → `IconDeviceDesktop`. It is the only hand-kept list. `test/icons.test.ts` checks every target against the real package. A word with no fitting icon is left out on purpose: the set has no minus sign, so `minus` finds nothing.
- A query written as an export name that doesn't exist, such as `IconMailOpened`, gets a note saying so.
- Every name it returns is exported. The test imports the package and checks every result for every icon name and synonym.

Defaults: tenant `house`, scheme `light`, language `tsx`.

Token categories: `color`, `chart`, `space`, `radius`, `font`, `line-height`, `shadow`, `glass`, `effect`, `motion`, `density`, `icon`.

### Errors

Errors are tool results with `isError: true`, never crashes. The message says what to do next:

```json
{"error":"No component named \"buton\". Call get_component with one of the closest names.","closest":["button"]}
```

Name inputs (component, example, pattern, tenant) accept kebab-case names only. `..`, slashes, backslashes and absolute paths are refused before any file is read, and every path is checked again to be inside the repo root.

## Resources

| URI | File |
|---|---|
| `strata://agents` | `AGENTS.md` at the repo root: the rules for agents, including trust levels |
| `strata://governance` | `GOVERNANCE.md` at the repo root |

If the file doesn't exist, reading the resource returns a "not found" error. The server never makes up content.

## Setup

The package isn't published yet. `npx @strata/mcp` will work after Phase 6. Until then, point your client at the file in a checkout of this repo. Run `pnpm install` in the repo first.

Replace `/path/to/strata` with the absolute path of your checkout.

### Claude Code

```sh
claude mcp add strata -- node /path/to/strata/packages/mcp/bin/cli.mjs
```

Or in `.mcp.json` at the root of your project:

```json
{
  "mcpServers": {
    "strata": {
      "command": "node",
      "args": ["/path/to/strata/packages/mcp/bin/cli.mjs"]
    }
  }
}
```

### Cursor

`.cursor/mcp.json` in your project, or `~/.cursor/mcp.json` for every project:

```json
{
  "mcpServers": {
    "strata": {
      "command": "node",
      "args": ["/path/to/strata/packages/mcp/bin/cli.mjs"]
    }
  }
}
```

### VS Code

`.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "strata": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/strata/packages/mcp/bin/cli.mjs"]
    }
  }
}
```

### Another checkout

Add `"env": { "STRATA_ROOT": "/path/to/other/strata" }` to the server entry.

### Check that it runs

```sh
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | node packages/mcp/bin/cli.mjs
```

It prints two lines of JSON: the server's name and instructions, then the eight tools.

To call a tool, add a `tools/call` line:

```sh
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"find_icon","arguments":{"query":"IconAward"}}}' \
  | node packages/mcp/bin/cli.mjs
```

## Read-only

The server has no tool that writes, moves or deletes a file, and it runs no commands. Every tool is marked `readOnlyHint: true`. `audit_snippet` checks the text you send it and returns suggested fixes; it doesn't apply them.

Trust levels (ADR-008, GOVERNANCE.md §6) are stated in the instructions the server sends when a client connects:

- Each fix from `audit_snippet` has `safe: true` or `safe: false`.
- An agent may apply `safe: true` fixes on its own. This is the ambient level.
- Every other fix needs a person to decide. So does anything that adds a component, changes a token or breaks an API.
- The rules are in `strata://agents`.

The server states these rules. It can't enforce what an agent does with its own file tools.

## Response sizes

Measured on 2026-09-28 with:

```sh
pnpm --filter @strata/mcp test sizes
```

Sizes are UTF-8 bytes of the JSON text. The test fails if a response goes over its budget.

| Response | Bytes | Budget |
|---|---|---|
| `list_components`, all 53 | 8,699 | 12,000 |
| `get_component` button | 6,218 | 8,000 |
| `get_component` date-picker | 6,396 | 8,000 |
| `get_component` toggle-group | 5,112 | 6,500 |
| `get_component` select | 7,406 | 9,000 |
| `get_component` data-table | 10,287 | 12,500 |
| `get_component` sidebar (the largest) | 12,547 | 16,000 |
| `get_tokens`, no category | 261 | 400 |
| `get_tokens` color | 4,795 | 5,500 |
| `get_tokens` space | 761 | 900 |
| `get_pattern`, list | 1,691 | 2,500 |
| `get_pattern` settings | 707 | 1,500 |
| `get_example` button | 562 | 1,500 |
| `find_icon` award | 213 | 400 |
| `find_icon` arrow (8 icons, the default limit) | 412 | 700 |
| `find_icon` IconArrowDown | 511 | 800 |
| `find_icon` IconMinus (no match) | 290 | 500 |
| `find_icon` with 28 icons at limit 30 | 1,447 | 2,000 |

`imports` and `typeNotes` added 4,259 bytes across the 12 components that have them (68,995 → 73,254). Button grew by 301 bytes (5,917 → 6,218), the most any component grew was 549 (toggle-group). No budget was raised. Measured by calling `getComponent` on a copy of the meta files at `9061227` and on the working tree.

These are bytes, not tokens. Token counts depend on the model and haven't been measured.

`audit_snippet` and `find_token` aren't in the table: their sizes depend on the input. `find_icon` does too; the test also checks every icon name and synonym at limit 30 stays under 2,000 bytes.

## Tests

```sh
pnpm --filter @strata/mcp test
pnpm --filter @strata/mcp typecheck
```

- `test/tools.test.ts`: every tool, with the auditor mocked.
- `test/icons.test.ts`: `find_icon`, checked against the real `@strata/icons` exports.
- `test/protocol.test.ts`: the server through the SDK's in-memory transport, and `bin/cli.mjs` over stdio.
- `test/sizes.test.ts`: the byte budgets.
- `test/audit.integration.test.ts`: the real auditor. It is skipped, and prints why, while `@strata/audit` doesn't export `auditSource`, `scoreOf` and `findToken`.

## Limits

- **It needs a checkout of the repo.** The data isn't bundled in the package. Publishing to npm (Phase 6) needs a decision on how the data ships.
- **Token names are derived.** The CSS variable is the contract. The dotted name comes from rules in `src/tokens.ts`, for example `--strata-font-size-md` → `font.size.md`. Density tokens and a few others have no group, so they keep their CSS name: `control-height`, `hairline`. The `tokens` list in `get_component` comes from the meta files as written, and some of those names differ from the derived ones (`icon.stroke` and `icon-stroke` both appear).
- **Density tokens use the tenant's own density.** There is no `density` input.
- **A pattern's `structure` is the first paragraph of the comment at the top of its source**, up to six sentences. It is as good as that comment.
- **A pattern's `components` come from its import of `@strata/react`.** Icons and other packages aren't listed.
- **`find_icon` matches words, not drawings.** Beyond the synonym list it can't tell what an icon looks like. `synonymOf` marks a match by meaning, so the agent can judge it.
- **`imports` and `typeNotes` are only as complete as the meta files.** They cover the traps the eval found and the same traps confirmed in other components' types.
- **`audit_snippet` accepts up to 100,000 characters** of `tsx` or `css`.
- **`find_token` and `audit_snippet` depend on `@strata/audit`.** If it can't be loaded they return an error and the other tools keep working. The auditor finds tenants on its own; `STRATA_ROOT` is not passed to it.
- **No recorded agent run yet.** BRIEF §8 asks for a recorded run where Claude Code builds a screen using only this server. That hasn't been done.
