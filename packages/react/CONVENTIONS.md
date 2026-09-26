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
- Surfaces: popovers/menus/dialogs = `surface.raised` + `border.default` hairline + `--strata-shadow-overlay`. Inputs = `surface.default` + `border.strong`.
  Hover tints = `color-mix(in oklab, var(--strata-color-text-default) 6%, transparent)` or `surface.selected`.
- Disabled: `text.disabled` + no pointer events on the visual, never opacity alone for text.
- Motion: `var(--strata-motion-duration-fast|normal)` + `var(--strata-motion-easing)`; wrap animations in
  `@media (prefers-reduced-motion: no-preference)`. Overlays animate on `[data-entering]`/`[data-exiting]`.
- Numbers in tables/stats: `font-variant-numeric: tabular-nums`.
- Set `box-sizing: border-box` on your own roots.
- Must look right in every tenant (sharp/soft/round shapes, compact/comfortable density), light + dark, LTR + RTL, and at 320px wide.

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
