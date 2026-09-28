'use client';

/**
 * @strata/sdui/react — the reference web renderer. <StrataScreen document onAction onIssue fallback />
 *
 * It prepares the document (src/prepare.ts: tolerant of newer minors, strict about everything else), then maps each
 * node to a @strata/react component through REGISTRY, an explicit table. It never looks a component up by name in
 * the package's exports, never renders a string as markup, and never throws: a node that fails while drawing is
 * replaced by its fallback (or nothing) and reported.
 *
 * Theme, scheme, density and locale come from the ThemeScope around it, like any other Strata UI.
 */
import {
  Component,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ErrorInfo,
  type JSX,
  type MouseEvent,
  type ReactNode,
} from 'react';
import * as StrataIcons from '@strata/icons';
import {
  Alert,
  Amount,
  Avatar,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Eyebrow,
  IconTile,
  Link,
  Meter,
  ProgressBar,
  Separator,
  StatTile,
  StatTileGroup,
  Tag,
  type AlertProps,
  type AmountProps,
  type AvatarProps,
  type BadgeProps,
  type ButtonProps,
  type CardProps,
  type EmptyStateProps,
  type EyebrowProps,
  type IconTileProps,
  type LinkProps,
  type MeterProps,
  type ProgressBarProps,
  type SeparatorProps,
  type StatTileProps,
  type TagProps,
} from '@strata/react';
import { directionOf } from './contract';
import { prepareScreen, type Action, type Issue, type PreparedNode } from './prepare';

export type { Action, Issue, IssueCode, PreparedNode, ScreenDocument } from './prepare';

export interface ActionContext {
  /** The node's `id`, if the document gave it one. */
  nodeId?: string;
  /** The node's type, e.g. "Button". */
  nodeType: string;
}

export interface StrataScreenProps {
  /** The screen document, as parsed JSON. It is checked before anything is drawn. */
  document: unknown;
  /**
   * Called when a Button or Link is pressed. `navigate` carries `href`; `event` carries `name` and `payload`.
   * With a handler, plain clicks on links are handed to it (the browser doesn't navigate); modified clicks
   * (open in a new tab) stay with the browser. Without one, links navigate natively and Buttons report
   * `no-action-handler`.
   */
  onAction?: (action: Action, context: ActionContext) => void;
  /** Everything the renderer ignored, replaced or refused, with a JSON pointer into the document. */
  onIssue?: (issue: Issue) => void;
  /** Drawn instead of the screen when the document can't be drawn (another major, or invalid). Default: nothing. */
  fallback?: ReactNode;
}

type Props = Record<string, unknown>;
type Ctx = {
  fire: (action: Action, node: PreparedNode) => void;
  report: (issue: Issue) => void;
};
type Renderer = (node: PreparedNode, draw: Draw) => ReactNode;
type Draw = {
  nodes: (children: unknown, path: string) => ReactNode;
  node: (node: PreparedNode | undefined, path: string) => ReactNode;
  press: (node: PreparedNode) => (() => void) | undefined;
  path: string;
};

/* ------------------------------------------------------------------ *
 * Icons: a table from each icon's own name, built once. Lookups go through a Map, never into the module.
 * ------------------------------------------------------------------ */

const ICONS = new Map<string, StrataIcons.Icon>(
  (Object.values(StrataIcons) as unknown[])
    .filter((v): v is StrataIcons.Icon => typeof v === 'function' && typeof (v as { iconName?: unknown }).iconName === 'string')
    .map((icon) => [icon.iconName, icon]),
);

/** `{ icon: 'name' }` → a decorative icon element. */
function icon(ref: unknown): ReactNode {
  if (!ref || typeof ref !== 'object') return undefined;
  const Icon = ICONS.get((ref as { icon?: string }).icon ?? '');
  return Icon ? <Icon aria-hidden /> : undefined;
}

/** Inline content: a string, or strings and icons. Strings are React text: never parsed as markup. */
function inline(content: unknown): ReactNode {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return null;
  return content.map((item, i) => <Fragment key={i}>{typeof item === 'string' ? item : icon(item)}</Fragment>);
}

const text = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const p = (node: PreparedNode): Props => node.props ?? {};

/* ------------------------------------------------------------------ *
 * Layout and text: the schema's own nodes. Every value is a token.
 * ------------------------------------------------------------------ */

const gap = (token: unknown, fallback: string) => {
  const t = typeof token === 'string' ? token : fallback;
  return t === 'section-gap' ? 'var(--strata-section-gap)' : `var(--strata-${t})`;
};
const FLEX_ALIGN: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' };
const FLEX_JUSTIFY: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' };
const pick = (table: Record<string, string>, key: unknown, fallback: string) =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : table[fallback];
const HEADING_SIZE: Record<number, string> = { 1: '2xl', 2: 'xl' };

function textStyle(size: string, extra: CSSProperties = {}): CSSProperties {
  return {
    margin: 0,
    minInlineSize: 0,
    overflowWrap: 'anywhere',
    fontSize: `var(--strata-font-size-${size})`,
    letterSpacing: `var(--strata-font-tracking-${size})`,
    ...extra,
  };
}

/* ------------------------------------------------------------------ *
 * The registry: node type → how to draw it. Explicit, one entry per wire node.
 * ------------------------------------------------------------------ */

export const REGISTRY: ReadonlyMap<string, Renderer> = new Map<string, Renderer>([
  [
    'Button',
    (n, d) => {
      const x = p(n);
      const props = {
        variant: x.variant as ButtonProps['variant'],
        tone: x.tone as ButtonProps['tone'],
        size: x.size as ButtonProps['size'],
        isPending: x.isPending as boolean | undefined,
        isDisabled: x.isDisabled as boolean | undefined,
        'aria-label': text(x.ariaLabel),
        onPress: d.press(n),
      } as ButtonProps;
      return <Button {...props}>{inline(n.children)}</Button>;
    },
  ],
  [
    'Link',
    (n, d) => {
      const x = p(n);
      const href = n.action?.type === 'navigate' ? n.action.href : undefined;
      const fire = d.press(n);
      const onPress: LinkProps['onPress'] = (e) => {
        // Modified clicks open a new tab or window: the browser does that, not the app.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        fire?.();
      };
      return (
        <Link variant={x.variant as LinkProps['variant']} isDisabled={x.isDisabled as boolean | undefined} href={href} onPress={onPress}>
          {inline(n.children)}
        </Link>
      );
    },
  ],
  [
    'Badge',
    (n) => {
      const x = p(n);
      return (
        <Badge
          tone={x.tone as BadgeProps['tone']}
          variant={x.variant as BadgeProps['variant']}
          size={x.size as BadgeProps['size']}
          dot={x.dot as boolean | undefined}
          icon={icon(x.icon)}
        >
          {text(n.children)}
        </Badge>
      );
    },
  ],
  [
    'Tag',
    (n) => {
      const x = p(n);
      return (
        <Tag
          tone={x.tone as TagProps['tone']}
          variant={x.variant as TagProps['variant']}
          size={x.size as TagProps['size']}
          uppercase={x.uppercase as boolean | undefined}
          leading={icon(x.leading)}
        >
          {text(n.children)}
        </Tag>
      );
    },
  ],
  [
    'Alert',
    (n, d) => {
      const x = p(n);
      return (
        <Alert
          tone={x.tone as AlertProps['tone']}
          title={text(x.title)}
          icon={x.icon === false ? false : icon(x.icon)}
          live={x.live as AlertProps['live']}
          action={d.node(n.slots?.action, `${d.path}/slots/action`) ?? undefined}
        >
          {text(n.children)}
        </Alert>
      );
    },
  ],
  [
    'Card',
    (n, d) => {
      const x = p(n);
      return (
        <Card variant={x.variant as CardProps['variant']} rim={x.rim as boolean | undefined} stars={x.stars as boolean | undefined}>
          {d.nodes(n.children, `${d.path}/children`)}
        </Card>
      );
    },
  ],
  ['CardHeader', (n, d) => <CardHeader divider={p(n).divider as boolean | undefined}>{d.nodes(n.children, `${d.path}/children`)}</CardHeader>],
  ['CardTitle', (n) => <CardTitle level={p(n).level as 1 | 2 | 3 | 4 | 5 | 6 | undefined}>{text(n.children)}</CardTitle>],
  ['CardDescription', (n) => <CardDescription>{text(n.children)}</CardDescription>],
  ['CardAction', (n, d) => <CardAction>{d.nodes(n.children, `${d.path}/children`)}</CardAction>],
  [
    'CardContent',
    (n, d) => <CardContent variant={p(n).variant as 'default' | 'inset' | undefined}>{d.nodes(n.children, `${d.path}/children`)}</CardContent>,
  ],
  ['CardFooter', (n, d) => <CardFooter divider={p(n).divider as boolean | undefined}>{d.nodes(n.children, `${d.path}/children`)}</CardFooter>],
  [
    'StatTile',
    (n) => {
      const x = p(n);
      return (
        <StatTile
          label={text(x.label)}
          value={text(x.value)}
          delta={x.delta as number | undefined}
          deltaLabel={text(x.deltaLabel)}
          positiveIsGood={x.positiveIsGood as boolean | undefined}
          caption={text(x.caption)}
          icon={icon(x.icon)}
          sparkline={x.sparkline as number[] | undefined}
          size={x.size as StatTileProps['size']}
          variant={x.variant as StatTileProps['variant']}
        />
      );
    },
  ],
  ['StatTileGroup', (n, d) => <StatTileGroup>{d.nodes(n.children, `${d.path}/children`)}</StatTileGroup>],
  [
    'Avatar',
    (n) => {
      const x = p(n);
      return (
        <Avatar
          name={text(x.name)}
          src={text(x.src)}
          alt={text(x.alt)}
          size={x.size as AvatarProps['size']}
          shape={x.shape as AvatarProps['shape']}
          tint={x.tint as AvatarProps['tint']}
          placeholder={x.placeholder as AvatarProps['placeholder']}
        />
      );
    },
  ],
  [
    'Separator',
    (n) => {
      const x = p(n);
      return <Separator orientation={x.orientation as SeparatorProps['orientation']} label={text(x.label)} />;
    },
  ],
  [
    'ProgressBar',
    (n) => {
      const x = p(n);
      const props = {
        label: text(x.label),
        'aria-label': text(x.ariaLabel),
        value: x.value as number | undefined,
        minValue: x.minValue as number | undefined,
        maxValue: x.maxValue as number | undefined,
        isIndeterminate: x.isIndeterminate as boolean | undefined,
        showValue: x.showValue as boolean | undefined,
        valueLabel: text(x.valueLabel),
        tone: x.tone,
        size: x.size,
      } as ProgressBarProps;
      return <ProgressBar {...props} />;
    },
  ],
  [
    'Meter',
    (n) => {
      const x = p(n);
      const props = {
        label: text(x.label),
        'aria-label': text(x.ariaLabel),
        value: x.value as number | undefined,
        minValue: x.minValue as number | undefined,
        maxValue: x.maxValue as number | undefined,
        valueLabel: text(x.valueLabel),
        showValue: x.showValue as boolean | undefined,
        caption: text(x.caption),
        tone: x.tone,
        variant: x.variant,
      } as MeterProps;
      return <Meter {...props} />;
    },
  ],
  [
    'EmptyState',
    (n, d) => {
      const x = p(n);
      return (
        <EmptyState
          title={text(x.title)}
          description={text(x.description)}
          icon={icon(x.icon)}
          size={x.size as EmptyStateProps['size']}
          level={x.level as EmptyStateProps['level']}
          action={d.node(n.slots?.action, `${d.path}/slots/action`) ?? undefined}
        />
      );
    },
  ],
  [
    'Eyebrow',
    (n) => {
      const x = p(n);
      return (
        <Eyebrow lead={x.lead as EyebrowProps['lead']} icon={icon(x.icon)} tone={x.tone as EyebrowProps['tone']} as={x.as as EyebrowProps['as']}>
          {text(n.children)}
        </Eyebrow>
      );
    },
  ],
  [
    'Amount',
    (n) => {
      const x = p(n);
      return (
        <Amount
          value={x.value as number}
          currency={x.currency as string}
          size={x.size as AmountProps['size']}
          symbol={x.symbol as AmountProps['symbol']}
          tone={x.tone as AmountProps['tone']}
          compact={x.compact as boolean | undefined}
        />
      );
    },
  ],
  [
    'IconTile',
    (n) => {
      const x = p(n);
      return (
        <IconTile
          src={text(x.src)}
          alt={text(x.alt)}
          tint={x.tint as IconTileProps['tint']}
          name={text(x.name)}
          size={x.size as IconTileProps['size']}
        >
          {icon(n.children)}
        </IconTile>
      );
    },
  ],
  [
    'Stack',
    (n, d) => {
      const x = p(n);
      const style: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: gap(x.gap, 'space-4'),
        alignItems: pick(FLEX_ALIGN, x.align, 'stretch'),
        minInlineSize: 0,
      };
      return (
        <div data-sdui-node="Stack" style={style}>
          {d.nodes(n.children, `${d.path}/children`)}
        </div>
      );
    },
  ],
  [
    'Inline',
    (n, d) => {
      const x = p(n);
      const style: CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: x.wrap === false ? 'nowrap' : 'wrap',
        gap: gap(x.gap, 'space-2'),
        alignItems: pick(FLEX_ALIGN, x.align, 'center'),
        justifyContent: pick(FLEX_JUSTIFY, x.justify, 'start'),
        minInlineSize: 0,
      };
      return (
        <div data-sdui-node="Inline" style={style}>
          {d.nodes(n.children, `${d.path}/children`)}
        </div>
      );
    },
  ],
  [
    'Text',
    (n) => {
      const x = p(n);
      const size = typeof x.size === 'string' ? x.size : 'md';
      const weight = typeof x.weight === 'string' ? x.weight : 'regular';
      const style = textStyle(size, {
        lineHeight: 'var(--strata-line-height-normal)',
        fontWeight: `var(--strata-font-weight-${weight})`,
        color: x.tone === 'subtle' ? 'var(--strata-color-text-subtle)' : 'var(--strata-color-text-default)',
        fontVariantNumeric: x.numeric === true ? 'tabular-nums' : undefined,
      });
      return (
        <p data-sdui-node="Text" style={style}>
          {text(n.children)}
        </p>
      );
    },
  ],
  [
    'Heading',
    (n) => {
      const x = p(n);
      const level = typeof x.level === 'number' && [1, 2, 3, 4, 5, 6].includes(x.level) ? x.level : 2;
      const size = typeof x.size === 'string' ? x.size : (HEADING_SIZE[level] ?? 'lg');
      const H = `h${level}` as 'h1';
      const style = textStyle(size, {
        fontFamily: 'var(--strata-font-heading)',
        lineHeight: 'var(--strata-line-height-tight)',
        fontWeight: 'var(--strata-font-weight-semibold)',
        color: 'var(--strata-color-text-default)',
      });
      return (
        <H data-sdui-node="Heading" style={style}>
          {text(n.children)}
        </H>
      );
    },
  ],
]);

/* ------------------------------------------------------------------ *
 * Drawing
 * ------------------------------------------------------------------ */

interface BoundaryProps {
  node: PreparedNode;
  path: string;
  report: (issue: Issue) => void;
  fallback: () => ReactNode;
  children: ReactNode;
}

/** Catches a component that throws while drawing: draws the node's fallback (or nothing) and reports. */
class NodeBoundary extends Component<BoundaryProps, { failed: boolean; node: PreparedNode }> {
  override state = { failed: false, node: this.props.node };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  /** A new document gives new nodes: try drawing again. */
  static getDerivedStateFromProps(props: BoundaryProps, state: { failed: boolean; node: PreparedNode }) {
    return props.node === state.node ? null : { failed: false, node: props.node };
  }
  override componentDidCatch(error: unknown, _info: ErrorInfo): void {
    this.props.report({
      code: 'render-error',
      path: this.props.path,
      nodeType: this.props.node.type,
      message: `${this.props.node.type} failed to draw (${error instanceof Error ? error.message : String(error)}). ${this.props.node.fallback ? 'Its fallback is drawn instead.' : 'Nothing is drawn.'}`,
    });
  }
  override render(): ReactNode {
    return this.state.failed ? this.props.fallback() : this.props.children;
  }
}

function drawNode(node: PreparedNode | undefined, path: string, ctx: Ctx): ReactNode {
  if (!node || typeof node !== 'object') return null;
  const render = REGISTRY.get(node.type);
  // Unreachable after preparation, which removes unknown types. Kept so the table is the only way in.
  if (!render) return null;
  const draw: Draw = {
    path,
    node: (child, at) => drawNode(child, at, ctx),
    nodes: (children, at) => {
      if (!Array.isArray(children)) return null;
      const seen = new Set<string>();
      return children.map((child: PreparedNode, i) => {
        const id = typeof child?.id === 'string' && !seen.has(child.id) ? child.id : undefined;
        if (id) seen.add(id);
        return <Fragment key={id ? `${child.type}:${id}` : `#${i}`}>{drawNode(child, `${at}/${i}`, ctx)}</Fragment>;
      });
    },
    press: (n) => (n.action ? () => ctx.fire(n.action!, n) : undefined),
  };
  return (
    <NodeBoundary node={node} path={path} report={ctx.report} fallback={() => drawNode(node.fallback, `${path}/fallback`, ctx)}>
      {render(node, draw)}
    </NodeBoundary>
  );
}

/**
 * Draws a screen document with Strata components. Put it inside a ThemeScope: the screen carries no theme.
 */
export function StrataScreen({ document, onAction, onIssue, fallback = null }: StrataScreenProps): JSX.Element {
  const prepared = useMemo(() => prepareScreen(document), [document]);
  // Handlers in refs, so a new function each render doesn't redraw the screen.
  const handlers = useRef({ onAction, onIssue });
  handlers.current = { onAction, onIssue };

  useEffect(() => {
    for (const issue of prepared.issues) handlers.current.onIssue?.(issue);
  }, [prepared]);

  const ctx = useMemo<Ctx>(
    () => ({
      report: (issue) => handlers.current.onIssue?.(issue),
      fire: (action, node) => {
        const handler = handlers.current.onAction;
        if (!handler) {
          if (!(node.type === 'Link' && action.type === 'navigate'))
            handlers.current.onIssue?.({
              code: 'no-action-handler',
              path: '',
              nodeType: node.type,
              message: `${node.type} was pressed, but no onAction handler was given, so nothing happened.`,
            });
          return;
        }
        const copy: Action =
          action.type === 'navigate'
            ? { type: 'navigate', href: action.href }
            : { type: 'event', name: action.name, ...(action.payload ? { payload: { ...action.payload } } : {}) };
        handler(copy, { nodeType: node.type, ...(node.id ? { nodeId: node.id } : {}) });
      },
    }),
    [],
  );

  if (!prepared.ok) return <>{fallback}</>;
  const { screen, root } = prepared.document;

  // With a handler, a plain click on a link goes to the app (Link's onPress calls it); the browser mustn't navigate too.
  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (!handlers.current.onAction || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = e.target as Element | null;
    if (target?.closest?.('a[href]') && e.currentTarget.contains(target)) e.preventDefault();
  };

  return (
    <div data-strata-screen={screen.id} lang={screen.locale} dir={directionOf(screen.locale)} onClickCapture={onClickCapture}>
      {drawNode(root, '/root', ctx)}
    </div>
  );
}
