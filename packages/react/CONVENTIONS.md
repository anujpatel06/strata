# @strata/react — component conventions

Every component in this package ships **two ways from one source**: as the npm package `@strata/react`, and as a
shadcn-compatible registry item (`npx shadcn@latest add @strata/<name>`) that copies the files into the user's project.
The rules below make both work. Read them fully before writing a component.

## Files — flat, kebab-case, self-contained

```
packages/react/src/ui/<name>.tsx          component(s) — first line 'use client';
packages/react/src/ui/<name>.module.css   styles (CSS Modules)
packages/react/meta/<name>.meta.json      docs + registry + MCP metadata (schema: meta/schema.ts)
packages/react/test/<name>.test.tsx       Vitest + Testing Library
apps/docs/examples/<name>/<name>-demo.tsx         hero example (default export, 'use client')
apps/docs/examples/<name>/<name>-<variant>.tsx    more examples listed in meta.examples
```

- `src/ui` is **flat**. Registry installs put every file in the user's `components/ui/` folder, so imports between
  components MUST be sibling-relative: `import { Button } from './button';` — never `../`, never `@/`, never the barrel.
- No shared util files. Need a class joiner? Define `const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');` locally.
- Allowed imports in `src/ui`: `react`, `react-aria-components`, `@internationalized/date`, `@tabler/icons-react`, sibling `./<name>`. List npm ones in `meta.dependencies`, siblings in `meta.registryDependencies`.
- Do not edit `src/index.ts` (the lead generates it) or other agents' files.

## API style

- Build on **React Aria Components** (ADR-002). Never re-implement focus management, overlays, collections, keyboard
  handling or ARIA that RAC provides. Wrap, style, and give a friendlier default API.
- React 19: `ref` is a normal prop — no `forwardRef`. Spread remaining props onto the RAC root.
- Merge classes with RAC's render-prop support: `className={composeRenderProps(className, (c) => cx(styles.root, c))}`.
- Shared vocabulary (use exactly these names/values):
  - `variant` = visual style. Button: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'`.
  - `size` = `'sm' | 'md' | 'lg'` (+ `'icon'` for Button). Default `'md'`. `md` = `--strata-control-height`.
  - `tone` = `'neutral' | 'info' | 'success' | 'warning' | 'danger'` (+ `'brand'` for Badge) for feedback colour.
  - Field components take `label`, `description`, `errorMessage` (string or RAC validation fn), and RAC's `isRequired`, `isDisabled`, `isInvalid`.
  - Boolean props use RAC naming: `isDisabled`, `isOpen`, `isPending`, `isSelected`.
- Export the main component first; export sub-parts (e.g. `CardHeader`) and their `*Props` types.
- Every component must work with **no props besides children/label** and look right.

## Styling — tokens only (this is the whole design-system argument)

- Only `var(--strata-*)` from `packages/theme-engine/src/types.ts` (the CSS variable contract). Semantic roles only.
- Allowed literals: `0`, `1px`/`2px` hairlines and focus offsets, `%`, `fr`, `auto`, `em` for icon sizing, unitless numbers,
  `transparent`, `currentColor`, `inherit`, and `color-mix(in oklab, var(--strata-color-…) N%, transparent)` for tints.
- **No raw colours, font sizes, font weights, radii, or spacing.** No tenant ids. No `@media (prefers-color-scheme)` — schemes come from tokens.
- **Logical properties only** (`padding-inline`, `margin-block-start`, `inset-inline-end`, `text-align: start`,
  `border-start-start-radius`). Directional icons (chevrons, arrows) flip under `:dir(rtl)` with `scale: -1 1`.
- States come from RAC data attributes: `[data-hovered]`, `[data-pressed]`, `[data-focus-visible]`, `[data-disabled]`,
  `[data-selected]`, `[data-invalid]`, `[data-open]`, `[data-entering]`, `[data-exiting]`, `[data-placement]`…
- Focus: `outline: 2px solid var(--strata-color-focus-ring); outline-offset: 2px;` on `[data-focus-visible]` for every interactive part.
- Controls: `min-block-size: var(--strata-control-height)`, `padding-inline: var(--strata-control-padding-inline)`,
  radius `--strata-radius-button` (buttons) / `--strata-radius-field` (inputs) / `--strata-radius-container` (cards, dialogs, popovers)
  / `--strata-radius-badge`. Text size `--strata-font-size-md` in controls, `sm`/`xs` for hints/badges. Headings use `--strata-font-heading` + `letter-spacing: var(--strata-font-heading-tracking)`.
- Surfaces: overlays are **glass** (see Depth). Inputs = `surface.default` + `border.strong`.
  Hover tints = `color-mix(in oklab, var(--strata-color-text-default) 6%, transparent)` or `surface.selected`.
- Disabled: `text.disabled` + no pointer events on the visual, never opacity alone for text.
- Motion and depth: see **Tactile style** below.
- Numbers in tables/stats: `font-variant-numeric: tabular-nums`.
- Set `box-sizing: border-box` on your own roots.
- Must look right in every tenant (sharp/soft/round shapes, compact/comfortable density), light + dark, LTR + RTL, and at 320px wide.

## Tactile style (v0.3, Anuj 2026-09-27: "tactile modern" — Linear, Apple, Vercel/Geist, Raycast)

Quiet at rest, alive under the hand. Depth from layered shadow, not colour; motion that answers every press.

**Motion tokens:** `--strata-motion-duration-{fast 120, normal 200, slow 320, spring ~400}ms`, `--strata-motion-easing`
(standard), `--strata-motion-easing-out` (enters), `--strata-motion-spring` (a real damped spring as CSS `linear()`, ~4% overshoot;
pair it with `--strata-motion-duration-spring`).

- **Hover:** colour, background, border and shadow fade in with `duration-fast` + `easing`. Always allowed.
- **Press:** anything pressable (buttons, toggles, chips, tabs, menu items, switch thumb, checkbox/radio box, pagination, calendar
  cells) does `scale: 0.97` on `[data-pressed]` and springs back: `transition: scale var(--strata-motion-duration-spring) var(--strata-motion-spring)`.
  Small targets (checkbox, radio, switch thumb) can go to `0.9`.
- **Selection moves, it doesn't jump:** tabs, toggle groups and segmented controls use React Aria's `SelectionIndicator`
  (a sliding pill or underline). Checkbox checks draw in (`stroke-dashoffset`), radio dots and switch thumbs spring.
- **Overlays enter from their trigger:** `[data-entering]` fades opacity with `easing-out` and animates transform
  (`scale: 0.96` + a 4px translate away from `[data-placement]`) with the spring; set `transform-origin: var(--trigger-anchor-point)` where React Aria provides it.
  `[data-exiting]` is quicker: `duration-fast` + `easing`, opacity + a small scale, no spring. Modals scale from 0.96; sheets slide from their side.
- **Height changes** (accordion, collapsibles): animate `grid-template-rows: 0fr → 1fr` or `interpolate-size`, never `max-height` hacks.
- **Focus ring:** `outline-offset` settles from `0` to `2px` over `duration-fast`, so focus visibly "arrives". The 2px `focus.ring`
  outline stays the accessible indicator; any glow around it is decoration.
- **Reduced motion:** every transform, scale, translate and keyframe animation lives inside
  `@media (prefers-reduced-motion: no-preference)`. Colour and opacity fades may stay. Test with the preference on.
- Animate only `opacity`, `transform`/`scale`/`translate`, colours and `box-shadow`. No layout properties, no JS animation libraries.
  A *static* `scale` (e.g. optically enlarging a glyph) is not motion and may sit outside the reduced-motion block.
  Documented exceptions: a `SelectionIndicator` pill may animate its `inline-size`, because it's absolutely positioned and empty, so nothing reflows.
  Pagination fades instead of sliding: React Aria's `SharedElement` calls `getAnimations`, which jsdom lacks, so consumer tests would crash.
  The toast stack animates `block-size` when it fans out; the alternatives (squash, clip-path) distort corners or cut the peeking edge.

**Visible motion (Anuj's review, 2026-09-27: "there is no motion").** Pass-1 motion was too subtle to notice. Motion must be *felt*:
- **Hover lift** on anything clickable that sits on a surface (buttons, interactive cards, list rows with actions): `translate: 0 -1px`
  and one shadow step deeper, on the spring. Press: `scale: 0.96`, springing back past 1 (the spring's overshoot does this).
- **State changes pop:** a checkbox/radio/switch turning on, a badge or chip appearing, a toast arriving. A short `scale` from 0.8→1 on the spring.
- **Focus arrives:** the halo grows from 0 to its size on the spring, not a fade.
- **Content enters:** stat values, card content and list rows fade up (`opacity` 0→1, `translate: 0 4px`→0) with `easing-out` over `duration-slow`,
  staggered by `calc(var(--strata-motion-duration-fast) / 3)` per item where there's a natural order.
- **Scroll reveal (site and blocks only, not components):** CSS scroll-driven animations (`animation-timeline: view()`) inside
  `@supports (animation-timeline: view())`, and never without the reduced-motion guard.
- Everything still respects `prefers-reduced-motion`. Fades may remain; movement goes.

**Depth tokens:** `--strata-shadow-raised`, `--strata-shadow-overlay`, `--strata-shadow-highlight` (inset top-edge sheen), and glass:
`--strata-glass-bg`, `--strata-glass-blur`, `--strata-glass-opacity`.

- **Solid fills** (primary/danger buttons, checked checkbox/radio/switch, selected toggle, solid badges): `box-shadow: var(--strata-shadow-highlight), var(--strata-shadow-raised)`.
  **Never put a gradient or overlay behind a label.** The solver tunes fill + label to 4.5:1, sometimes with zero margin (pure red is exactly 4.50), so any tint can fail it.
- **Secondary/outline controls:** `surface.default` + border + `--strata-shadow-raised`; hover deepens the border, not the shadow.
- **Cards:** `surface.raised` + `border.subtle` hairline + `--strata-shadow-raised`. Only *interactive* cards lift on hover
  (`translate: 0 -1px` + `--strata-shadow-overlay`).
- **Rim light** (`--strata-rim`): a 1px edge brighter at the top-left that fades, like light catching glass. Draw it as a gradient
  border with the background-clip trick, so it follows any radius: `border: 1px solid transparent;` and
  `background: linear-gradient(<face>, <face>) padding-box, linear-gradient(135deg, var(--strata-rim), transparent 60%) border-box <face-colour>;`
  (the trailing face colour fills the border box under the rim, so the faded part of the edge is the surface, not the page).
  Keep the `border.subtle` hairline shadow for the rest of the edge. The light is physical: top-left in RTL too, like shadows.
  On a solid brand fill use `color-mix(in oklab, var(--strata-color-action-primary-fg) 45%, transparent)` instead of `--strata-rim`.
  Opt-in on Card (`rim`), built into `Card variant="feature"`, `Sidebar variant="floating"` and `IconTile`. `--strata-glow` (the brand
  halo) is for one hero element per view: the feature card, the current-page bar in Sidebar.
- **Inputs:** flat, bordered. Focus = the 2px ring plus a soft halo: `box-shadow: 0 0 0 4px color-mix(in oklab, var(--strata-color-focus-ring) 18%, transparent)`.
- **Glass** is for floating layers only: popover, menu, select/combobox listbox, dialog, alert dialog, sheet, command palette, toast.
  `background: var(--strata-glass-bg); backdrop-filter: blur(var(--strata-glass-blur)) saturate(1.6);` (plus the `-webkit-` prefix),
  `border: 1px solid var(--strata-color-border-default)`, `box-shadow: var(--strata-shadow-overlay)`. Add
  `@supports not (backdrop-filter: blur(1px)) { background: var(--strata-color-surface-raised); }`.
  The engine solves the glass opacity so **`text.default` and `text.subtle` reach 4.5:1 over any backdrop** (checked in `pnpm test:themes`).
  **Any other text colour on glass** (brand, feedback, disabled) must sit on an opaque role background, such as `surface.selected` for the highlighted row.
  Tooltips stay solid `surface.inverse`, because they're too small for glass to read as glass.
- **Modal underlay:** `backdrop-filter: blur(calc(var(--strata-glass-blur) / 4)) brightness(0.6)`. A `surface.inverse` tint turned dark mode into a grey fog (it's near-white there); dimming works the same in both schemes. (C3's call, accepted by the lead.)
- **Sticky chrome** (the site header, sticky table headers) may use glass too, with the same text rule.
- Extra allowed literals for this style: `scale` numbers, `saturate(1.6)`, `4px` halo/translate distances.

## Finesse (v0.3 pass 2, ADR-013: inspired by macOS + visionOS, not copied)

Premium comes from restraint and consistency, not more effects. Check every component against these rules:

- **Fewer, fainter lines.** A surface gets a shadow *or* a visible border, not both at full strength. Cards: `--strata-shadow-raised`
  plus a hairline edge in `border.subtle`. Dividers inside surfaces (table rows, list separators, card sections) are hairlines too.
  **Draw hairlines as box-shadow, not border-width:** Chrome rounds borders below 1px up to 1px, but shadows keep 0.5px. Edge:
  `box-shadow: 0 0 0 var(--strata-hairline) var(--strata-color-border-subtle), …`; divider: an inset shadow. Keep `1px solid transparent`
  underneath so box sizes don't change and forced-colors mode still draws an edge.
- **Squircle vs pills:** `corner-shape: squircle` turns pill radii into rounded rectangles. Where a radius token can be the pill value, restore
  round ends with `@container style(--strata-radius-button: var(--strata-radius-pill))`. Badges (always pills) get no squircle. Nested rows use
  `max(min(var(--strata-radius-badge), var(--strata-space-1)), outer − inset)`, so a pill badge radius doesn't turn rows into pills. Input borders and focus rings keep 1px+ `border.strong` / 2px ring (WCAG 1.4.11).
- **Concentric corners.** A rounded thing inside a rounded thing: inner radius = `max(var(--strata-radius-badge), outer radius − inset)`,
  e.g. a button in a card footer or a row highlight in a menu. Never a larger radius inside a smaller one.
- **Continuous corners where supported:** `@supports (corner-shape: squircle) { corner-shape: squircle; }` on containers, buttons, fields and badges.
  (Squircle corners look tighter, so this only adds smoothness; radii stay the same.)
- **Tracking follows size.** Every text style sets `letter-spacing: var(--strata-font-tracking-<same size key>)` next to its `font-size`.
  Headings and large numbers read tight; captions read open. (0 for Arabic-capable type pairs, automatically.)
- **Numbers are typography.** Stats and amounts: `tabular-nums`, `font-weight: var(--strata-font-weight-semibold)`, size-matched tracking.
  Currency and units can be a size smaller in `text.subtle`.
- **Quiet chips.** Badges are soft pills: tinted background, no border, `font-weight: medium`, `font-size: xs` + tracking. Solid badges keep the highlight.
  Status dots are small (6px via `calc(var(--strata-space-1) * 1.5)`), never shouting.
- **Calm tints.** Alerts and callouts: soft tinted surface, a `--strata-hairline` edge in the tone's border colour, and the tone carried by the icon chip.
  No thick borders or heavy fills.
- **Hierarchy through weight and colour, not size jumps.** Section labels in `text.subtle`, `font-size: sm`; table headers `text.subtle`, `font-weight: medium`, no background fill.
- **Air.** Table rows use `--strata-table-row-height` with comfortable inline padding; card content breathes at `--strata-card-inset`.
  Icon + text pairs align on the text's cap height, with a `--strata-space-2` gap.
- **Icons match text.** Icons follow the text colour at ~1.25× the font size, and outline icons use `stroke-width: 1.75` (Tabler's default of 2 looks heavy next to text).
- **Every state is intentional.** Hover is a quiet tint, press is the spring scale, selected is `surface.selected`, and focus is the ring plus halo. Nothing changes abruptly.

## Accessibility (WCAG 2.2 AA)

- Visible labels by default; if a component allows `aria-label` only, require one in types.
- Icon-only buttons require `aria-label`. Decorative icons `aria-hidden`.
- Status never by colour alone (icon + text).
- Hit targets ≥ 24×24px (WCAG 2.5.8) even at compact density.
- Document keyboard behaviour in meta `accessibility.keyboard`.

## Tests (`packages/react/test/<name>.test.tsx`)

Vitest + Testing Library + user-event, jsdom. Per component: renders with an accessible name/role; main interaction
works by keyboard (e.g. Space/Enter toggles, arrows move, Escape closes); disabled/invalid state reflected in ARIA;
className passthrough. Run: `pnpm --filter @strata/react exec vitest run test/<name>.test.tsx`.

## Examples (`apps/docs/examples/<name>/*.tsx`)

- Each file: `'use client';` then `export default function Example() { … }`. Import components from `'@strata/react'`.
- Realistic, domain-neutral copy (no lorem ipsum, no tenant names, no real companies). Short: 5–40 lines.
- Examples are rendered inside a `ThemeScope` by the docs site and the playground, so don't set themes yourself.
- `<name>-demo` is the hero; add 2–5 more covering variants/sizes/states/composition (e.g. `button-variants`, `button-sizes`, `button-loading`, `button-with-icon`).

## Visual check — the playground

`pnpm --filter @strata/playground dev --port <your port>` then open
`/?c=<name>&tenant=vela|harbor|qamar&scheme=light|dark&dir=ltr|rtl&density=comfortable|compact`.
It renders every example in `apps/docs/examples/<name>/`. Screenshot with Playwright (Chromium is preinstalled;
`playwright` is a root devDependency) across tenants × schemes × RTL and look at the images before you finish.

## Component roster (owner → files)

| Owner | Components (file name → main exports) |
|---|---|
| C1 actions & fields | `button` Button · `link` Link · `toggle-group` ToggleButtonGroup, ToggleButton · `text-field` TextField, Label, Description, FieldError, Input · `text-area` TextArea · `search-field` SearchField · `checkbox` Checkbox, CheckboxGroup · `radio-group` RadioGroup, Radio · `switch` Switch · `slider` Slider |
| C2 pickers | `select` Select, SelectItem, SelectSection · `combobox` Combobox, ComboboxItem · `calendar` Calendar · `date-picker` DatePicker · `file-upload` FileUpload |
| C3 overlays | `dialog` Dialog, DialogTrigger · `alert-dialog` AlertDialog · `sheet` Sheet · `popover` Popover · `tooltip` Tooltip, TooltipTrigger · `menu` Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger · `command` CommandDialog, CommandItem, CommandSection |
| C4 feedback & display | `alert` Alert · `toast` ToastRegion, toast · `badge` Badge · `progress` ProgressBar · `spinner` Spinner · `skeleton` Skeleton · `empty-state` EmptyState · `card` Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter · `avatar` Avatar · `kbd` Kbd · `separator` Separator · `stat-tile` StatTile |
| C5 navigation & data | `tabs` Tabs, TabList, Tab, TabPanel · `breadcrumbs` Breadcrumbs, Breadcrumb · `pagination` Pagination · `accordion` Accordion, AccordionItem · `steps` Steps · `data-table` DataTable |
| lead | `theme-scope` ThemeScope |

Key signatures other teams code against (keep them):

```tsx
<Button variant="primary" size="md" isPending={false} onPress={…}>Save</Button>          // size="icon" needs aria-label
<Link href="…" variant="inline | standalone">Docs</Link>
<ToggleButtonGroup selectionMode="single" selectedKeys={…} onSelectionChange={…}><ToggleButton id="a">A</ToggleButton></ToggleButtonGroup>
<TextField label="Email" description="…" errorMessage="…" placeholder="…" type="email" />
<Select label="Plan" placeholder="Choose…" selectedKey={…} onSelectionChange={…}><SelectItem id="pro">Pro</SelectItem></Select>
<Combobox label="Country"><ComboboxItem id="in">India</ComboboxItem></Combobox>
<DatePicker label="Date of incident" />       <Calendar aria-label="…" />
<FileUpload label="Photos" description="…" acceptedFileTypes={['image/*']} allowsMultiple onChange={(files) => …} />
<DialogTrigger><Button>Open</Button><Dialog title="Edit profile" description="…">{({ close }) => …}</Dialog></DialogTrigger>
<AlertDialog title="Delete card?" actionLabel="Delete" tone="danger" onAction={…}>This can't be undone.</AlertDialog>  // used inside DialogTrigger
<Sheet side="end" title="Filters">…</Sheet>   // inside DialogTrigger
<TooltipTrigger><Button size="icon" aria-label="Copy">…</Button><Tooltip>Copy</Tooltip></TooltipTrigger>
<MenuTrigger><Button>Actions</Button><Menu onAction={…}><MenuItem id="edit" shortcut="⌘E">Edit</MenuItem><MenuSeparator /><MenuItem id="delete" tone="danger">Delete</MenuItem></Menu></MenuTrigger>
<CommandDialog isOpen onOpenChange={…} placeholder="Search docs…" onAction={(key) => …}><CommandSection title="Components"><CommandItem id="button" textValue="Button">Button</CommandItem></CommandSection></CommandDialog>
<Alert tone="warning" title="Card expiring">Order a replacement.</Alert>
<ToastRegion />   toast({ title: 'Saved', description: '…', tone: 'success' })
<Badge tone="success" variant="soft">Paid</Badge>
<ProgressBar label="Upload" value={40} showValue />     <Spinner size="sm" label="Loading" />     <Skeleton inlineSize="60%" blockSize="1em" />
<EmptyState icon={<IconInbox />} title="No claims yet" description="…" action={<Button>Start a claim</Button>} />
<Card><CardHeader><CardTitle>…</CardTitle><CardDescription>…</CardDescription><CardAction>…</CardAction></CardHeader><CardContent>…</CardContent><CardFooter>…</CardFooter></Card>
<Avatar name="Priya Raman" src={…} size="md" />   <Kbd>⌘K</Kbd>   <Separator orientation="horizontal" />
<StatTile label="Available balance" value="₹1,84,250" delta={0.064} deltaLabel="vs last month" positiveIsGood />
<Tabs variant="underline | pill"><TabList aria-label="…"><Tab id="a">A</Tab></TabList><TabPanel id="a">…</TabPanel></Tabs>
<Breadcrumbs><Breadcrumb href="/">Home</Breadcrumb><Breadcrumb>Claims</Breadcrumb></Breadcrumbs>
<Pagination page={2} pageCount={12} onPageChange={…} />
<Accordion allowsMultipleExpanded><AccordionItem id="a" title="…">…</AccordionItem></Accordion>
<Steps current="upload" steps={[{ id: 'details', label: 'Details' }, { id: 'upload', label: 'Upload' }, { id: 'review', label: 'Review' }]} />
<DataTable aria-label="Transactions" columns={[{ id: 'date', header: 'Date', isRowHeader: true, allowsSorting: true, cell: (r) => r.date }, { id: 'amount', header: 'Amount', align: 'end', cell: (r) => … }]}
           rows={rows} getRowId={(r) => r.id} selectionMode="multiple" sortDescriptor={…} onSortChange={…} emptyState={…} isLoading={false} />
```
