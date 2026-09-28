# @strata/sdui

Strata as a server-driven UI contract. A server sends a screen as JSON, and a client draws it with Strata components.

This package has three parts:

- **The schema.** One JSON Schema (draft 2020-12) per component, generated from the component's `meta.json` (ADR-007, ADR-019). Plus a screen schema and a manifest.
- **A validator.** `validateScreen(doc)` checks a document and returns errors a backend engineer can act on.
- **A reference renderer for the web.** `<StrataScreen>` draws a document with `@strata/react`.

## What this is not

- **Not a production SDUI framework.** It's a contract, the rules that come with it, and one renderer that proves them. It has no caching, no screen fetching, no analytics and no state.
- **Web only.** No native client exists here. The section "Native clients" says how one would use the schema, and that's all it is: a description.
- **A slice, not every component.** The slice covers display and simple actions. Inputs, overlays, tables and charts are out. They hold state (a value, an open menu, a sort order) and send events back as it changes. That needs a fuller action model than `navigate` and `event`: state bindings, validation and submission. This slice doesn't define one.

## The slice

26 node types: 22 from 15 `@strata/react` components, and 4 of the schema's own.

| Node | Component (meta) | `children` on the wire |
|---|---|---|
| `Button` | button | a label: a string, or strings and `{ "icon" }` |
| `Link` | link | a label: a string, or strings and `{ "icon" }` |
| `Badge`, `Tag`, `Eyebrow` | badge, tag, eyebrow | a string |
| `Alert` | alert | a string (the body); the action goes in `slots.action` |
| `Card` | card | `CardHeader`, `CardContent`, `CardFooter` nodes |
| `CardHeader` | card | `CardTitle`, `CardDescription`, `CardAction` nodes |
| `CardTitle`, `CardDescription` | card | a string |
| `CardAction`, `CardContent`, `CardFooter` | card | any nodes |
| `StatTile` | stat-tile | none (label and value are props) |
| `StatTileGroup` | stat-tile | `StatTile` nodes |
| `Avatar`, `Separator`, `ProgressBar`, `Meter`, `Amount` | avatar, separator, progress, meter, amount | none |
| `EmptyState` | empty-state | none; the action goes in `slots.action` |
| `IconTile` | icon-tile | one `{ "icon" }` |
| `Stack`, `Inline` | the schema's own layout | any nodes |
| `Text`, `Heading` | the schema's own text | a string |

Card parts only go inside a `Card`. Every prop, default and rule is in `schema/manifest.json`.

**Left out, with the reason:**

- `CardMedia`: it holds an image, video or device mock. The slice has no image or media node yet, and the glow behind it is proven for media only.
- `AvatarGroup`: its "+N" label is a function (`moreLabel`) whose default is English only, so a screen in another language would announce English. Send Avatars in an `Inline`.

## A screen

```json
{
  "schemaVersion": "1.0.0",
  "screen": { "id": "order-status", "title": "Order status", "locale": "en-IN" },
  "root": {
    "type": "Stack",
    "props": { "gap": "section-gap" },
    "children": [
      { "type": "Heading", "props": { "level": 1 }, "children": "Arriving in about 12 minutes" },
      { "type": "ProgressBar", "props": { "label": "Delivery progress", "value": 70, "valueLabel": "Out for delivery" } },
      {
        "type": "Button",
        "id": "call",
        "props": { "variant": "outline" },
        "children": [{ "icon": "phone" }, "Call"],
        "action": { "type": "event", "name": "order.call_partner", "payload": { "orderId": "58-2931" } }
      }
    ]
  }
}
```

A node is `{ type, id?, props?, children?, slots?, action?, fallback? }` and nothing else.

- `id` identifies a node among its siblings. The renderer uses it as the React key and passes it back with actions. It's never rendered as a DOM id.
- `screen.title` is for the host app's title bar or document title. The renderer doesn't draw it, so the screen doesn't get two headings.
- `screen.locale` says what language the copy is in. The renderer sets it as `lang`, and sets `dir` to that language's direction, because direction is a property of the copy's language: English shown in a right-to-left app must still run left to right, or the browser reorders it ("−₹1,240" reads "₹1,240−"). A document with no `locale` follows the client. Number formatting, theme, scheme and density always follow the client.

Three full examples are in `examples/`: an account overview, a grocery order status and a loyalty summary.

## The rules

### Props come from meta

A prop whose meta type is `boolean`, `number`, `string`, `number[]` or a union of literals is derived from meta: the type, the enum, the default and the description. Everything else needs a decision, written in `src/wire.ts`. If a component gains a prop meta can't derive and nobody decides, the generator stops with the prop's name.

The decisions:

| Meta type | On the wire |
|---|---|
| A function (`onPress`, `onDismiss`, `moreLabel`) | Never. An interactive node takes an `action` instead. |
| `href` | Never as a prop. It's the `href` of a `navigate` action. |
| `ReactNode` that holds words (`Alert.title`, `StatTile.label`) | A string. |
| `ReactNode` that holds an icon (`Badge.icon`, `Tag.leading`) | `{ "icon": "<name>" }`. |
| `ReactNode` that holds a component (`Alert.action`, `EmptyState.action`) | A node in `slots.<name>`, from a listed set of types. |
| `aria-label` | `ariaLabel`. |
| `Intl.NumberFormatOptions`, `locale` | Never. Formatting belongs to the client's locale. |
| `className`, `style`, `key`, `ref` | Never, on any node. |

Every excluded prop has a reason in the manifest, and the validator shows it.

### Actions

Functions never cross the wire. A `Button` needs an `action`. A `Link` needs a `navigate` action.

```json
{ "type": "navigate", "href": "/orders/58-2931" }
{ "type": "event", "name": "order.track", "payload": { "orderId": "58-2931" } }
```

- `href` is an `https://` URL or an app path that starts with one `/`. Everything else is rejected: `javascript:`, `data:`, `vbscript:`, `http:`, `//host`, `/\host` (browsers read the backslash as a slash), `mailto:`, `tel:`, and any whitespace or control character. For anything the app should decide (call a number, open a share sheet), send an `event`.
- `name` is lower case, split by `.`, `_` or `-`.
- `payload` is flat: strings, numbers, booleans and null, at most 32 keys. It's passed to the host and never rendered.
- The renderer calls the host app's `onAction(action, { nodeType, nodeId })`.

### No markup

Strings are always drawn as text. There's no `html` prop and no way to send markup: `html`, `dangerouslySetInnerHTML`, `style` and `className` are rejected by the validator and ignored by the renderer. Images (`Avatar.src`, `IconTile.src`) load from `https://` only.

### Icons

`{ "icon": "<name>" }`, where the name is the kebab-case name of an icon in `@strata/icons`. The list is generated from the package's exports, never kept by hand (`schema/manifest.json` → `icons`). Icons on the wire are always decorative: the text next to them carries the meaning.

### Tokens only

No prop takes a raw colour or size. Colour is `tone`, emphasis is `variant`, size is `size`: each an enum of the component's own values. Layout gaps on `Stack` and `Inline` are token names: `space-0` to `space-16` (from the theme engine's space scale) or `section-gap`, which follows the client's density. `Text` and `Heading` sizes are font-size token names.

### No brand in a screen

A screen has no `theme`, `tenant`, `brand`, `scheme` or `density`. Those belong to the client that draws it (principle 2: a brand is data). The same document draws in every tenant, light and dark. The validator rejects those fields anywhere in a document.

### Deprecated API is not in the contract

A value or prop that meta marks deprecated before it reached this major of the schema is left out. A new contract doesn't start with deprecated API. So Button's `variant: "danger"` isn't in schema 1.x; the validator names the replacement (`tone: "danger"`).

### Accessibility is part of the contract

These are schema constraints. A document that breaks one is invalid.

| Rule | Requirement |
|---|---|
| `button-name` | A Button whose children have no text needs `props.ariaLabel`. |
| `button-icon-size-name` | A Button with `size: "icon"` needs `props.ariaLabel`. |
| `link-text` | A Link needs text in its children. |
| `avatar-name` | An Avatar needs `name` or `alt`. `alt: ""` marks it decorative and still needs `name` for the initials. |
| `progress-name`, `meter-name` | A ProgressBar or Meter needs `label` or `ariaLabel`. |
| `badge-text`, `tag-text`, `alert-text` | Status is never colour alone: Badge and Tag need text, Alert needs a title or body. |
| `stat-tile-text` | A StatTile needs `label` and `value`. |
| `empty-state-title`, `card-title-text`, `heading-text`, `eyebrow-text` | Headings and labels need text. |
| `icon-tile-image-alt` | An IconTile with `src` needs `alt` (the name, or `""` if it's written next to it). |

"Text" means at least one character that isn't whitespace.

## Versions

- `schemaVersion` is semver.
- **A client supports one major.** This package supports `1.x`.
- **Minor versions only add:** a node, a prop, an enum value, an icon. The generator enforces it. Within a major it refuses to remove anything, and when the wire gains something it asks for a minor bump in `src/contract.ts`.
- **Removing or renaming anything is a major.**

### How a deprecation reaches the schema (GOVERNANCE.md §5)

1. A component deprecates a prop or value in a `@strata/react` minor release, with a record in its meta.
2. If the schema's current major already has it, it stays until the next major. The schema marks it `deprecated: true`, and the renderer reports `deprecated-value` when a document uses it.
3. The next major of the schema removes it.
4. If the schema never had it, it doesn't start having it (Button `variant: "danger"`).

## Unknowns: what a client does

A server may speak a newer minor than the app on someone's phone. So the validator is strict, for producers, and the renderer is tolerant in exactly these ways:

| The document has | The renderer | Reported as |
|---|---|---|
| Another major | Draws the host's screen fallback. | `unsupported-version` |
| A newer minor | Draws it. | `newer-minor` |
| An unknown node type | Draws the node's `fallback` if it has one, otherwise nothing. Never raw JSON. | `unknown-component` |
| A node with an unknown action type | Treats the node as unknown: a control that can't act isn't drawn. | `unknown-action` |
| An unknown prop, slot or field | Ignores it. | `unknown-prop`, `unknown-field` |
| An unknown enum value or icon | Drops it, so the component's default applies. | `unknown-value` |
| Anything else invalid (a wrong type, a missing accessible name, an unsafe link) | Draws the host's screen fallback. | `invalid-document`, one per error |
| An unknown root with no fallback | Draws the host's screen fallback. | `unknown-component` |
| Nodes deeper than 32 levels | Doesn't draw them. | `too-deep` |
| A component that throws while drawing | Draws the node's `fallback`, or nothing. The rest of the screen still draws. | `render-error` |

Every issue has a `code`, a JSON pointer `path` into the document as sent, and a `message`.

## Validate

```ts
import { validateScreen } from '@strata/sdui';

const { valid, errors } = validateScreen(doc);
// errors: [{ path: '/root/children/2', rule: 'button-icon-size-name',
//            message: 'A Button with size "icon" shows no text, so it needs props.ariaLabel.' }]
```

No React import in this entry. It uses ajv in strict mode. The schema files use three keywords of their own (`x-strata`, `x-strata-rule`, `x-strata-message`). Other validators ignore `x-` keywords; with ajv strict mode, add them with `ajv.addVocabulary`.

Cost: the first call compiles every schema; after that a check is quick. On one machine (darwin arm64, Node 26), with the order-status example: 64 ms for the first call, then 0.018 ms per document (mean of 1,000). A rough figure, not a benchmark:

```sh
pnpm --filter @strata/sdui exec tsx scripts/time-validate.ts
```

## Render

```tsx
'use client';
import { ThemeScope } from '@strata/react';
import { StrataScreen } from '@strata/sdui/react';

<ThemeScope theme="vela" scheme="dark" locale="en-IN">
  <StrataScreen
    document={json}
    onAction={(action, { nodeType, nodeId }) => { /* route, or handle the event */ }}
    onIssue={(issue) => console.warn(issue.code, issue.path, issue.message)}
    fallback={<p>This screen isn't available. Update the app to see it.</p>}
  />
</ThemeScope>
```

- The theme, scheme, density and locale come from the `ThemeScope` around it, like any other Strata UI.
- Nodes map to components through `REGISTRY`, an explicit table with one entry per node. The renderer never looks a name up in `@strata/react`'s exports, so `"ThemeScope"` or `"__proto__"` as a type draws nothing.
- With `onAction`, a plain click on a link goes to the host, and the browser doesn't navigate. A modified click (open in a new tab) stays with the browser. Without `onAction`, links navigate natively and Buttons report `no-action-handler`.
- Keys come from node ids, so a reordered list keeps its DOM nodes.
- It imports every icon in `@strata/icons`, since any of them can arrive over the wire.

## Native clients

**No native client exists in this repo.** This is how one would use the contract:

- Generate Kotlin or Swift types from `schema/` (each node is a discriminated union on `type`), or read `schema/manifest.json` directly: it lists each node's props, enum values, defaults, slots, children and accessibility rules.
- Map each node type to a native component. Implement the "Unknowns" table above: that's the part that lets a server ship ahead of an app release.
- Take colours, spacing, radii and type from the tenant's token files, not from the screen. Native token export (Compose and SwiftUI) is the next part of Phase 5a (ADR-019) and isn't built yet.
- Map `ariaLabel` to the platform's accessibility label.

## Add a component to the wire

1. Make sure its `meta.json` is complete: props, types, defaults, deprecations.
2. Add a `NodeSpec` to `NODES` in `src/wire.ts`: its children kind, and a rule for every prop meta can't derive (`text`, `icon`, `slot`, `action`, `children` or `exclude` with a reason). Add accessibility rules if it needs a name.
3. Add its renderer to `REGISTRY` in `src/react.tsx`.
4. Bump the minor in `src/contract.ts`, then run `pnpm --filter @strata/sdui generate`.
5. Run `pnpm --filter @strata/sdui test`. The tests check that every meta prop is decided, that every docs example prop is on the wire or excluded with a reason, that the registry matches the manifest, and that the committed schema isn't stale.

## Files

| Path | What |
|---|---|
| `src/wire.ts` | The decisions: nodes in the slice, prop rules, exclusions, accessibility rules. |
| `src/contract.ts` | Version, link and id patterns. |
| `scripts/build-schemas.ts` | The generator (pure). `scripts/generate.ts` writes its output. |
| `schema/` | Generated and committed: `screen.schema.json`, `defs.schema.json`, `nodes/*.schema.json`, `manifest.json`. |
| `src/validate.ts`, `src/prepare.ts` | The strict validator and the client's tolerant preparation. No React. |
| `src/react.tsx` | `StrataScreen` and the registry. |
| `examples/` | Three example screens. |

## Commands

```sh
pnpm --filter @strata/sdui generate    # meta.json → schema/
pnpm --filter @strata/sdui test        # vitest (jsdom)
pnpm --filter @strata/sdui typecheck
```

jsdom can't check contrast, so the tests check roles and accessible names. The axe sweep runs on the docs page.
