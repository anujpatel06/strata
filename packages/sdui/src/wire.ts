/**
 * The wire rules: which nodes cross the wire, and what each meta.json prop becomes on it.
 *
 * meta.json (ADR-007) stays the single source for names, descriptions, types, defaults, maturity and deprecations.
 * This table only records the decisions meta can't make: what a ReactNode prop holds over the wire (words, an icon
 * or another node), which props stay on the client, and the accessibility rules a screen must meet.
 *
 * A prop whose meta type is a plain `boolean`, `number`, `string`, `number[]` or a union of literals is derived
 * automatically. Anything else must have a rule here, or the generator stops (scripts/build-schemas.ts).
 * No React import: the generator and the validator both read this file.
 */
import { NON_BLANK } from './contract';

/** What a node's `children` holds on the wire. */
export type ChildrenKind =
  /** No children. */
  | { kind: 'none' }
  /** A string. */
  | { kind: 'text'; required?: boolean }
  /** A string, or an array of strings and `{ icon }` references (Button and Link labels with icons). */
  | { kind: 'inline'; required?: boolean }
  /** One `{ icon }` reference (IconTile). */
  | { kind: 'icon'; required?: boolean }
  /** An array of nodes: any node, or only the listed types. */
  | { kind: 'nodes'; only?: string[] };

/** What one meta prop becomes on the wire. Props not listed are derived from their meta type. */
export type PropRule =
  /** Derived from the meta type, then restricted. `rename` gives the wire name (aria-label → ariaLabel). */
  | { as: 'derive'; rename?: string; pattern?: string; minItems?: number; note?: string }
  /** A ReactNode that holds words: a string on the wire. */
  | { as: 'text' }
  /** A ReactNode that holds an icon: `{ icon: '<name>' }`, or `false` where the component accepts it. */
  | { as: 'icon'; orFalse?: boolean }
  /** An image URL: https only. */
  | { as: 'image-url' }
  /** A ReactNode that holds another component: a node in `slots.<name>`, one of the listed types. */
  | { as: 'slot'; only: string[] }
  /** Becomes the node's `action` (onPress, href). */
  | { as: 'action' }
  /** Handled by the node's `children` kind. */
  | { as: 'children' }
  /** Stays on the client. `reason` is shown in the README, the manifest and validation errors. */
  | { as: 'exclude'; reason: string };

/** A wire prop that isn't in meta: the schema's own nodes, or a real TypeScript prop meta doesn't list. */
export interface ExtraProp {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  /** The React prop it maps to, if different (ariaLabel → aria-label). */
  from?: string;
  /** Why it isn't taken from meta. */
  source: string;
}

/** An accessibility rule: a JSON Schema fragment applied to the node, with the message a backend engineer sees. */
export interface A11yRule {
  id: string;
  message: string;
  schema: Record<string, unknown>;
}

export interface NodeSpec {
  /** The node's `type` on the wire. Equals the React export for meta components. */
  type: string;
  /** meta.json name (packages/react/meta/<meta>.meta.json). Absent for the schema's own nodes. */
  meta?: string;
  /** Description for nodes meta doesn't describe on their own (the schema's own nodes, card parts). */
  description?: string;
  /** Only valid inside its parent (Card parts): left out of the top-level Node union. */
  part?: boolean;
  children: ChildrenKind;
  props?: Record<string, PropRule>;
  extraProps?: ExtraProp[];
  /** `navigate` only, or both kinds. Absent = the node takes no action. */
  action?: { kinds: Array<'navigate' | 'event'>; required: boolean };
  rules?: A11yRule[];
}

/** Props that never cross the wire, on any node. Also used to explain rejections. */
export const EXCLUDED_EVERYWHERE: Record<string, string> = {
  className:
    "Class names are the web client's styling hook, and a screen can't know them. Use variant, tone and size, which map to tokens.",
  style: 'Raw CSS would bypass the tokens. Use variant, tone and size; layout gaps are token names on Stack and Inline.',
  key: "React's list key. The node's `id` does that job on the wire.",
  ref: 'A handle to a DOM element on the client. Nothing on the wire can hold one.',
};

/** Fields that are rejected with their own message wherever they appear. Principle 2: a brand is data on the client. */
export const CLIENT_OWNED = ['theme', 'tenant', 'brand', 'scheme', 'density'] as const;
export const CLIENT_OWNED_REASON =
  'Theme, tenant, scheme and density belong to the client that renders the screen (principle 2), so one screen works for every brand.';

/** Keys that try to put markup or code on the wire. Rejected with their own message. */
export const MARKUP_KEYS = ['html', 'innerHTML', 'dangerouslySetInnerHTML', 'script', 'onClick', 'onPress'] as const;
export const MARKUP_REASON =
  'Markup and functions never cross the wire. Send text as a string (it is always rendered as text) and interactions as an `action`.';

/* ------------------------------------------------------------------ *
 * Reusable schema fragments for rules
 * ------------------------------------------------------------------ */

const nonBlank = { type: 'string', pattern: NON_BLANK };
const hasText = {
  anyOf: [nonBlank, { type: 'array', contains: nonBlank }],
};
const propsRequire = (name: string, schema: Record<string, unknown> = nonBlank) => ({
  type: 'object',
  required: ['props'],
  properties: { props: { type: 'object', required: [name], properties: { [name]: schema } } },
});
const childrenText = (id: string, message: string): A11yRule => ({
  id,
  message,
  schema: { type: 'object', required: ['children'], properties: { children: nonBlank } },
});
const labelOrAriaLabel = (id: string, what: string): A11yRule => ({
  id,
  message: `${what} needs a name: props.label (shown) or props.ariaLabel (read by screen readers only).`,
  schema: { anyOf: [propsRequire('label'), propsRequire('ariaLabel')] },
});

const ARIA_LABEL: ExtraProp = {
  name: 'ariaLabel',
  from: 'aria-label',
  description: 'Accessible name, for when there is no visible label.',
  schema: { type: 'string', pattern: NON_BLANK },
  source: "meta doesn't list aria-label for this component; the TypeScript props accept it (and require it without a label).",
};

/* ------------------------------------------------------------------ *
 * The slice
 * ------------------------------------------------------------------ */

const ONDISMISS =
  'Dismissing changes the screen, and this slice has no state model. Dismissible alerts wait for the fuller action model.';
const FORMAT_OPTIONS =
  "An Intl.NumberFormat options object. Formatting belongs to the client's locale; send valueLabel for custom text.";

export const NODES: NodeSpec[] = [
  {
    type: 'Button',
    meta: 'button',
    children: { kind: 'inline', required: true },
    props: {
      'aria-label': { as: 'derive', rename: 'ariaLabel', pattern: NON_BLANK },
      onPress: { as: 'action' },
      children: { as: 'children' },
      type: {
        as: 'exclude',
        reason: 'Forms are outside this slice, so submit and reset have nothing to act on. Every wire Button is type="button".',
      },
    },
    action: { kinds: ['navigate', 'event'], required: true },
    rules: [
      {
        id: 'button-name',
        message:
          'A Button whose children have no text (only an icon) needs props.ariaLabel, or screen readers announce an unnamed button.',
        schema: {
          type: 'object',
          if: { type: 'object', properties: { children: { not: hasText } } },
          then: propsRequire('ariaLabel'),
        },
      },
      {
        id: 'button-icon-size-name',
        message: 'A Button with size "icon" shows no text, so it needs props.ariaLabel.',
        schema: {
          type: 'object',
          if: {
            type: 'object',
            required: ['props'],
            properties: { props: { type: 'object', required: ['size'], properties: { size: { const: 'icon' } } } },
          },
          then: propsRequire('ariaLabel'),
        },
      },
    ],
  },
  {
    type: 'Link',
    meta: 'link',
    children: { kind: 'inline', required: true },
    props: {
      href: { as: 'action' },
      onPress: { as: 'action' },
      children: { as: 'children' },
      target: {
        as: 'exclude',
        reason:
          'Where a link opens (tab, in-app browser, system browser) is the client\'s decision. The screen sends only the destination.',
      },
      rel: { as: 'exclude', reason: 'The client sets rel for the destinations it opens.' },
    },
    action: { kinds: ['navigate'], required: true },
    rules: [
      {
        id: 'link-text',
        message: 'A Link needs text in its children: it has no other accessible name.',
        schema: { type: 'object', required: ['children'], properties: { children: hasText } },
      },
    ],
  },
  {
    type: 'Badge',
    meta: 'badge',
    children: { kind: 'text', required: true },
    props: { icon: { as: 'icon' }, children: { as: 'children' } },
    rules: [childrenText('badge-text', 'A Badge needs text in children: status is never shown by colour alone.')],
  },
  {
    type: 'Tag',
    meta: 'tag',
    children: { kind: 'text', required: true },
    props: {
      leading: { as: 'icon' },
      children: { as: 'children' },
    },
    rules: [childrenText('tag-text', 'A Tag needs text in children: colour alone says nothing.')],
  },
  {
    type: 'Alert',
    meta: 'alert',
    children: { kind: 'text' },
    props: {
      title: { as: 'text' },
      children: { as: 'children' },
      icon: { as: 'icon', orFalse: true },
      action: { as: 'slot', only: ['Button', 'Link'] },
      onDismiss: { as: 'exclude', reason: ONDISMISS },
      dismissLabel: { as: 'exclude', reason: 'Only used with onDismiss, which is excluded.' },
    },
    rules: [
      {
        id: 'alert-text',
        message: 'An Alert needs props.title or text in children: the tone colour and icon alone say nothing.',
        schema: {
          anyOf: [propsRequire('title'), { type: 'object', required: ['children'], properties: { children: nonBlank } }],
        },
      },
    ],
  },
  {
    type: 'Card',
    meta: 'card',
    children: { kind: 'nodes', only: ['CardHeader', 'CardContent', 'CardFooter'] },
    props: {
      interactive: {
        as: 'exclude',
        reason:
          "An interactive card is opened by the one Link in its title. The schema can't yet check that the link is there, and a card that lifts on hover but opens nothing misleads people.",
      },
    },
  },
  {
    type: 'CardHeader',
    meta: 'card',
    part: true,
    description: 'The top of a Card: a title, an optional description and an optional CardAction at the inline end.',
    children: { kind: 'nodes', only: ['CardTitle', 'CardDescription', 'CardAction'] },
  },
  {
    type: 'CardTitle',
    meta: 'card',
    part: true,
    description: "The card's heading.",
    children: { kind: 'text', required: true },
    rules: [childrenText('card-title-text', 'A CardTitle needs text: an empty heading is announced as a blank.')],
  },
  {
    type: 'CardDescription',
    meta: 'card',
    part: true,
    description: 'One or two quiet lines under the card title.',
    children: { kind: 'text', required: true },
  },
  {
    type: 'CardAction',
    meta: 'card',
    part: true,
    description: 'Sits at the top inline-end of CardHeader: a Badge, a Link or a small Button.',
    children: { kind: 'nodes' },
    props: { children: { as: 'children' } },
  },
  {
    type: 'CardContent',
    meta: 'card',
    part: true,
    description: "The card's body.",
    children: { kind: 'nodes' },
  },
  {
    type: 'CardFooter',
    meta: 'card',
    part: true,
    description: 'Actions or a closing line at the bottom of a Card.',
    children: { kind: 'nodes' },
  },
  {
    type: 'StatTile',
    meta: 'stat-tile',
    children: { kind: 'none' },
    props: {
      label: { as: 'text' },
      value: { as: 'text' },
      deltaLabel: { as: 'text' },
      caption: { as: 'text' },
      icon: { as: 'icon' },
      sparkline: { as: 'derive', minItems: 2 },
      deltaFormatOptions: {
        as: 'exclude',
        reason: "An Intl.NumberFormat options object. Formatting belongs to the client's locale; the delta is always a percentage.",
      },
    },
    rules: [
      {
        id: 'stat-tile-text',
        message: 'A StatTile needs props.label and props.value as text: the figure means nothing without its label.',
        schema: {
          type: 'object',
          required: ['props'],
          properties: {
            props: { type: 'object', required: ['label', 'value'], properties: { label: nonBlank, value: nonBlank } },
          },
        },
      },
    ],
  },
  {
    type: 'StatTileGroup',
    meta: 'stat-tile',
    description: 'A responsive row of StatTiles, read as one list of figures.',
    children: { kind: 'nodes', only: ['StatTile'] },
    props: { children: { as: 'children' } },
  },
  {
    type: 'Avatar',
    meta: 'avatar',
    children: { kind: 'none' },
    props: {
      src: { as: 'image-url' },
      children: {
        as: 'exclude',
        reason: 'Replaces the initials with any element, and the wire has no element to send. Use placeholder for empty seats.',
      },
    },
    rules: [
      {
        id: 'avatar-name',
        message:
          'An Avatar needs props.name or props.alt. alt "" marks it decorative (the name is shown next to it), and still needs name for the initials.',
        schema: { anyOf: [propsRequire('name'), propsRequire('alt')] },
      },
    ],
  },
  {
    type: 'Separator',
    meta: 'separator',
    children: { kind: 'none' },
    props: {
      label: { as: 'text' },
      elementType: { as: 'exclude', reason: 'Chooses the HTML element: a web detail the server shouldn\'t pick.' },
    },
  },
  {
    type: 'ProgressBar',
    meta: 'progress',
    children: { kind: 'none' },
    props: {
      label: { as: 'text' },
      valueLabel: { as: 'text' },
      formatOptions: { as: 'exclude', reason: FORMAT_OPTIONS },
    },
    extraProps: [ARIA_LABEL],
    rules: [labelOrAriaLabel('progress-name', 'A ProgressBar')],
  },
  {
    type: 'Meter',
    meta: 'meter',
    children: { kind: 'none' },
    props: {
      label: { as: 'text' },
      caption: { as: 'text' },
      formatOptions: { as: 'exclude', reason: FORMAT_OPTIONS },
    },
    extraProps: [ARIA_LABEL],
    rules: [labelOrAriaLabel('meter-name', 'A Meter')],
  },
  {
    type: 'EmptyState',
    meta: 'empty-state',
    children: { kind: 'none' },
    props: {
      title: { as: 'text' },
      description: { as: 'text' },
      icon: { as: 'icon' },
      action: { as: 'slot', only: ['Button', 'Link', 'Inline'] },
    },
    rules: [
      {
        id: 'empty-state-title',
        message: 'An EmptyState needs props.title: it is the heading that says what is empty.',
        schema: propsRequire('title'),
      },
    ],
  },
  {
    type: 'Eyebrow',
    meta: 'eyebrow',
    children: { kind: 'text', required: true },
    props: { icon: { as: 'icon' }, children: { as: 'children' } },
    rules: [childrenText('eyebrow-text', 'An Eyebrow needs text in children.')],
  },
  {
    type: 'Amount',
    meta: 'amount',
    children: { kind: 'none' },
    props: {
      currency: { as: 'derive', pattern: '^[A-Z]{3}$', note: 'ISO 4217 code in capitals.' },
      locale: {
        as: 'exclude',
        reason: "The client's locale formats every amount (principle 2). A screen can't know who is reading it.",
      },
      formatOptions: {
        as: 'exclude',
        reason: "An Intl.NumberFormat options object. Formatting belongs to the client's locale; use compact and symbol.",
      },
    },
  },
  {
    type: 'IconTile',
    meta: 'icon-tile',
    children: { kind: 'icon' },
    props: { children: { as: 'children' }, src: { as: 'image-url' } },
    rules: [
      {
        id: 'icon-tile-image-alt',
        message: 'An IconTile with props.src needs props.alt: the logo\'s name, or "" if the name is already next to it.',
        schema: {
          type: 'object',
          if: {
            type: 'object',
            required: ['props'],
            properties: { props: { type: 'object', required: ['src'], properties: { src: { type: 'string' } } } },
          },
          then: propsRequire('alt', { type: 'string' }),
        },
      },
    ],
  },

  /* The schema's own nodes. Layout and text only; every value is a token name. */
  {
    type: 'Stack',
    description: 'Lays out nodes in a column with a token gap. The schema\'s own layout node.',
    children: { kind: 'nodes' },
    extraProps: [
      {
        name: 'gap',
        description: 'Space between items: a space token, or section-gap (which follows the client\'s density).',
        schema: { $ref: '#/$defs/Gap', default: 'space-4' },
        source: 'layout node',
      },
      {
        name: 'align',
        description: 'Cross-axis alignment. stretch makes items full width.',
        schema: { type: 'string', enum: ['stretch', 'start', 'center', 'end'], default: 'stretch' },
        source: 'layout node',
      },
    ],
  },
  {
    type: 'Inline',
    description: 'Lays out nodes in a row that wraps, with a token gap. Follows the reading direction. The schema\'s own layout node.',
    children: { kind: 'nodes' },
    extraProps: [
      {
        name: 'gap',
        description: "Space between items: a space token, or section-gap (which follows the client's density).",
        schema: { $ref: '#/$defs/Gap', default: 'space-2' },
        source: 'layout node',
      },
      {
        name: 'align',
        description: 'Cross-axis alignment.',
        schema: { type: 'string', enum: ['start', 'center', 'end', 'baseline', 'stretch'], default: 'center' },
        source: 'layout node',
      },
      {
        name: 'justify',
        description: 'Main-axis distribution. between pushes the first and last items to the edges.',
        schema: { type: 'string', enum: ['start', 'center', 'end', 'between'], default: 'start' },
        source: 'layout node',
      },
      {
        name: 'wrap',
        description: 'Wrap onto more lines when the row is too narrow.',
        schema: { type: 'boolean', default: true },
        source: 'layout node',
      },
    ],
  },
  {
    type: 'Text',
    description: 'A paragraph of body text. The schema\'s own text node.',
    children: { kind: 'text', required: true },
    extraProps: [
      {
        name: 'size',
        description: 'Font size token.',
        schema: { type: 'string', enum: ['xs', 'sm', 'md', 'lg'], default: 'md' },
        source: 'text node',
      },
      {
        name: 'tone',
        description: 'default = text.default; subtle = text.subtle, for secondary lines.',
        schema: { type: 'string', enum: ['default', 'subtle'], default: 'default' },
        source: 'text node',
      },
      {
        name: 'weight',
        description: 'Font weight token.',
        schema: { type: 'string', enum: ['regular', 'medium', 'semibold'], default: 'regular' },
        source: 'text node',
      },
      {
        name: 'numeric',
        description: 'Tabular figures, for amounts and counts that line up.',
        schema: { type: 'boolean', default: false },
        source: 'text node',
      },
    ],
  },
  {
    type: 'Heading',
    description: 'A heading. Pick the level that fits the screen outline. The schema\'s own text node.',
    children: { kind: 'text', required: true },
    extraProps: [
      {
        name: 'level',
        description: 'Heading level, 1 to 6.',
        schema: { type: 'integer', enum: [1, 2, 3, 4, 5, 6], default: 2 },
        source: 'text node',
      },
      {
        name: 'size',
        description: 'Font size token. Defaults by level: 1 → 2xl, 2 → xl, 3 and below → lg.',
        schema: { type: 'string', enum: ['lg', 'xl', '2xl', '3xl'] },
        source: 'text node',
      },
    ],
    rules: [childrenText('heading-text', 'A Heading needs text: an empty heading is announced as a blank.')],
  },
];

/** Components in meta that are left out of this slice, with the reason. Checked against meta by the tests. */
export const EXCLUDED_NODES: Record<string, string> = {
  CardMedia:
    'Holds an image, video or device mock. The slice has no image or media node yet, and the glow behind it is proven for media only.',
  AvatarGroup:
    "Its '+N' label is a function (moreLabel) whose default is English only, so a screen in another language would announce English. Send Avatars in an Inline.",
};

/** Why whole groups of components aren't on the wire. Shown in the README and the manifest. */
export const OUT_OF_SLICE =
  'Inputs, overlays, tables and charts. They hold state (a value, an open menu, a sort order) and send events back as it changes. That needs a fuller action model than navigate and event: state bindings, validation and submission. This slice doesn\'t define one.';
