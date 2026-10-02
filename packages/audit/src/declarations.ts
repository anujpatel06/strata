/**
 * The checks that read one declaration: a property and its value. CSS files and TSX inline style objects both
 * end up here, so a rule behaves the same in both.
 */
import valueParser from 'postcss-value-parser';
import type { FunctionNode, Node as ValueNode } from 'postcss-value-parser';
import { ALLOWED_COLOR_KEYWORDS, COLOR_FUNCTIONS, NAMED_COLORS, isHexColor, parseColor } from './color';
import { findToken, type Scheme, type TokenCategory } from './tokens';
import { knownTokenNames, nearestNames } from './known-tokens';
import type { Fix, RuleId } from './types';

export interface Declaration {
  /** kebab-case CSS property, lowercase. Custom properties keep their case. */
  prop: string;
  /** The value as written, without quotes. */
  value: string;
  /** Offsets of the property name in the source. */
  propStart: number;
  propEnd: number;
  /**
   * Offset of value[0] in the source, or null when positions inside the value can't be trusted (a TSX string
   * with escapes). Findings then point at the whole value and carry advice without a replacement.
   */
  valueStart: number | null;
  /** Offsets of the whole value expression (in TSX this includes the quotes). */
  wholeStart: number;
  wholeEnd: number;
  /** Where the declaration ends, for fixes that rewrite property and value together. CSS only. */
  declEnd?: number;
  /** 'tsx-number' when the value was a numeric literal in a style object. */
  kind: 'css' | 'tsx-string' | 'tsx-number';
  /** How the property was written in TSX (camelCase), so a fix can match it. */
  tsxKey?: { text: string; quoted: boolean };
  /** True for the second and later values of one TSX key (a conditional), so the property is reported once. */
  propertyChecked?: boolean;
}

export interface Sink {
  tenant: string;
  scheme: Scheme;
  /** A place a rule looked at and found nothing wrong. */
  pass(rule: RuleId): void;
  /** A finding. It also counts as one opportunity for its rule. */
  report(rule: RuleId, start: number, end: number, message: string, fix: Fix): void;
  /**
   * True when this source declares the custom property itself. A file is free to invent a `--syntara-*` name for
   * its own use (card.module.css does, with --syntara-card-inset), so unknown-token must not flag those.
   */
  declaresLocally(name: string): boolean;
}

/* ------------------------------------------------------------------ *
 * Property families
 * ------------------------------------------------------------------ */

const SIDES = ['top', 'right', 'bottom', 'left'] as const;
const LOGICAL_SIDE: Readonly<Record<string, string>> = {
  top: 'block-start',
  bottom: 'block-end',
  left: 'inline-start',
  right: 'inline-end',
};
const LOGICAL_CORNER: Readonly<Record<string, string>> = {
  'top-left': 'start-start',
  'top-right': 'start-end',
  'bottom-left': 'end-start',
  'bottom-right': 'end-end',
};

/** physical property → logical property, one to one. */
export const PHYSICAL_TO_LOGICAL: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const side of SIDES) {
    const logical = LOGICAL_SIDE[side]!;
    map.set(side, `inset-${logical}`);
    for (const box of ['margin', 'padding', 'scroll-margin', 'scroll-padding']) map.set(`${box}-${side}`, `${box}-${logical}`);
    map.set(`border-${side}`, `border-${logical}`);
    for (const part of ['width', 'style', 'color']) map.set(`border-${side}-${part}`, `border-${logical}-${part}`);
  }
  for (const [corner, logical] of Object.entries(LOGICAL_CORNER)) map.set(`border-${corner}-radius`, `border-${logical}-radius`);
  return map;
})();

/** Four-value shorthands: the second and fourth values are right and left, so they don't mirror in RTL. */
const FOUR_SIDED: ReadonlyMap<string, { block: string; inline: string }> = new Map([
  ['margin', { block: 'margin-block', inline: 'margin-inline' }],
  ['padding', { block: 'padding-block', inline: 'padding-inline' }],
  ['inset', { block: 'inset-block', inline: 'inset-inline' }],
  ['scroll-margin', { block: 'scroll-margin-block', inline: 'scroll-margin-inline' }],
  ['scroll-padding', { block: 'scroll-padding-block', inline: 'scroll-padding-inline' }],
  ['border-width', { block: 'border-block-width', inline: 'border-inline-width' }],
  ['border-style', { block: 'border-block-style', inline: 'border-inline-style' }],
  ['border-color', { block: 'border-block-color', inline: 'border-inline-color' }],
]);

/** property → physical keyword → logical keyword. */
const PHYSICAL_VALUES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'text-align': { left: 'start', right: 'end' },
  'text-align-last': { left: 'start', right: 'end' },
  float: { left: 'inline-start', right: 'inline-end' },
  clear: { left: 'inline-start', right: 'inline-end' },
};

const DIRECTIONAL = /^(margin|padding|inset|scroll-margin|scroll-padding)(-|$)|^border(-(top|right|bottom|left|block|inline|start|end|width|style|color))?(-|$)/;

function isDirectional(prop: string): boolean {
  return PHYSICAL_TO_LOGICAL.has(prop) || prop in PHYSICAL_VALUES || DIRECTIONAL.test(prop);
}

const SPACE_PROP = /^(margin|padding|inset|scroll-margin|scroll-padding)(-(top|right|bottom|left|block|inline)(-(start|end))?)?$|^(top|right|bottom|left|gap|row-gap|column-gap|grid-gap|grid-row-gap|grid-column-gap)$/;
const RADIUS_PROP = /^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/;

const COLOR_PROP = /^(color|background|background-color|background-image|border|border-(top|right|bottom|left|block|inline)(-(start|end))?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?-color|border-image(-source)?|outline|outline-color|box-shadow|text-shadow|fill|stroke|caret-color|accent-color|column-rule|column-rule-color|text-decoration|text-decoration-color|text-emphasis|text-emphasis-color|scrollbar-color|stop-color|flood-color|lighting-color|-webkit-text-fill-color|-webkit-text-stroke|-webkit-text-stroke-color|-webkit-tap-highlight-color|filter|backdrop-filter|-webkit-backdrop-filter)$/;

/** Properties whose words are names, not colours, even when they look like one. */
/**
 * A mask is read for its alpha only: "black 55%, transparent" says how opaque, and no one sees the black.
 * Colours in masks are not checked and not counted.
 */
const MASK_PROP = /^(-webkit-)?mask(-image|-border|-border-source)?$/;

const NEVER_COLOR = /^(font-family|font|content|quotes|animation|animation-name|grid-area|grid-template-areas|grid-template|grid-row|grid-column|view-transition-name|container-name|container|anchor-name|position-anchor|counter-reset|counter-increment|will-change|transition-property|composes)$/;

const camel = (kebab: string): string => kebab.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const isVar = (node: ValueNode): node is FunctionNode => node.type === 'function' && node.value.toLowerCase() === 'var';

/** The nodes after the first comma of a var(): its fallback. */
function fallbackOf(node: FunctionNode): ValueNode[] {
  const comma = node.nodes.findIndex((n) => n.type === 'div' && n.value === ',');
  return comma === -1 ? [] : node.nodes.slice(comma + 1);
}

interface Span {
  start: number;
  end: number;
  /** False when the span is the whole value because inner positions are unknown. */
  precise: boolean;
}

function spanOf(decl: Declaration, node: ValueNode): Span {
  if (decl.valueStart === null) return { start: decl.wholeStart, end: decl.wholeEnd, precise: false };
  return { start: decl.valueStart + node.sourceIndex, end: decl.valueStart + node.sourceEndIndex, precise: true };
}

/** Wraps a replacement for the place it goes: bare in CSS and inside a TSX string, quoted in place of a TSX number. */
function valueFix(decl: Declaration, span: Span, replacement: string, description: string, safe: boolean): Fix {
  if (decl.kind === 'tsx-number') {
    return { description, replacement: `'${replacement}'`, start: decl.wholeStart, end: decl.wholeEnd, safe };
  }
  if (!span.precise) return { description, safe: false };
  return { description, replacement, start: span.start, end: span.end, safe };
}

const list = (tokens: string[]): string => tokens.join(', ');

/* ------------------------------------------------------------------ *
 * raw-color
 * ------------------------------------------------------------------ */

function reportColor(decl: Declaration, sink: Sink, node: ValueNode, text: string): void {
  const span = spanOf(decl, node);
  const match = parseColor(text) ? findToken(text, { tenant: sink.tenant, scheme: sink.scheme, category: 'color', property: decl.prop }) : null;
  const where = `for tenant "${sink.tenant}" (${sink.scheme})`;
  if (!match) {
    sink.report('raw-color', span.start, span.end, `${text} is a raw colour. Components and pages use colour roles only.`, {
      description:
        'Use a colour role, var(--syntara-color-…). For a tint, use color-mix(in oklab, var(--syntara-color-…) N%, transparent). This value could not be resolved, so no role is suggested.',
      safe: false,
    });
    return;
  }
  const parsed = parseColor(text)!;
  if (parsed.alpha < 1) {
    const percent = Math.round(parsed.alpha * 1000) / 10;
    const replacement = `color-mix(in oklab, var(${match.cssVar}) ${percent}%, transparent)`;
    sink.report(
      'raw-color',
      span.start,
      span.end,
      `${text} is a raw colour with ${percent}% opacity.`,
      valueFix(decl, span, replacement, `Nearest role ${where}: ${match.token} (${match.value}, ΔE ${match.distance}). Suggested: ${replacement}. Check the role fits the meaning.`, false),
    );
    return;
  }
  const replacement = `var(${match.cssVar})`;
  if (match.exact && !match.alternatives) {
    sink.report(
      'raw-color',
      span.start,
      span.end,
      `${text} is a raw colour. It is exactly ${match.token} ${where}.`,
      valueFix(decl, span, replacement, `Use ${replacement}.`, true),
    );
    return;
  }
  if (match.exact) {
    sink.report(
      'raw-color',
      span.start,
      span.end,
      `${text} is a raw colour. ${1 + match.alternatives!.length} roles have this value ${where}.`,
      valueFix(decl, span, replacement, `Pick the role that fits the meaning: ${list([match.token, ...match.alternatives!])}. Suggested: ${replacement}.`, false),
    );
    return;
  }
  sink.report(
    'raw-color',
    span.start,
    span.end,
    `${text} is a raw colour. No role has this value ${where}.`,
    valueFix(decl, span, replacement, `Nearest role: ${match.token} (${match.value}, ΔE ${match.distance}). Suggested: ${replacement}. It changes the colour, so check it.`, false),
  );
}

function checkColors(decl: Declaration, sink: Sink, nodes: ValueNode[]): void {
  const prop = decl.prop.toLowerCase();
  if (NEVER_COLOR.test(prop) || MASK_PROP.test(prop)) return;
  const custom = decl.prop.startsWith('--');
  const colorProp = COLOR_PROP.test(prop);
  // In a custom property a bare word is only read as a colour name when it is the whole value.
  const words = nodes.filter((n) => n.type !== 'space' && n.type !== 'comment');
  const namesAllowed = colorProp || (custom && words.length === 1);

  const walk = (children: ValueNode[]): void => {
    for (const node of children) {
      if (node.type === 'word') {
        const word = node.value.toLowerCase();
        if (isHexColor(word)) reportColor(decl, sink, node, node.value);
        else if (namesAllowed && word in NAMED_COLORS) reportColor(decl, sink, node, node.value);
        else if (colorProp && (word === 'transparent' || word === 'currentcolor')) sink.pass('raw-color');
        else if (colorProp && children === nodes && words.length === 1 && ALLOWED_COLOR_KEYWORDS.has(word)) sink.pass('raw-color');
      } else if (node.type === 'function') {
        const name = node.value.toLowerCase();
        if (name === 'url') continue;
        if (COLOR_FUNCTIONS.has(name)) {
          reportColor(decl, sink, node, valueParser.stringify(node));
        } else if (name === 'var') {
          if (colorProp || custom) sink.pass('raw-color');
          walk(fallbackOf(node));
        } else {
          walk(node.nodes);
        }
      }
    }
  };
  walk(nodes);
}

/* ------------------------------------------------------------------ *
 * off-scale-space, off-scale-radius, off-scale-font-size
 * ------------------------------------------------------------------ */

const SCALE_NAME: Readonly<Record<'space' | 'radius' | 'font-size', string>> = {
  space: 'space scale',
  radius: 'radius tokens',
  'font-size': 'type scale',
};

function checkLength(decl: Declaration, sink: Sink, node: ValueNode, rule: RuleId, category: 'space' | 'radius' | 'font-size', text: string): void {
  const parts = valueParser.unit(text);
  if (!parts) {
    sink.pass(rule); // a keyword such as auto
    return;
  }
  const unit = parts.unit.toLowerCase();
  const n = Number(parts.number);
  const isRaw = (unit === 'px' || unit === 'rem') && n !== 0;
  if (!isRaw) {
    sink.pass(rule); // 0, %, fr, em, unitless, viewport and container units
    return;
  }
  const px = unit === 'rem' ? n * 16 : n;
  // CONVENTIONS: 1px and 2px are allowed for hairlines and focus offsets. Font sizes have no such case.
  if (category !== 'font-size' && (Math.abs(px) === 1 || Math.abs(px) === 2)) {
    sink.pass(rule);
    return;
  }
  const match = findToken(`${Math.abs(px)}px`, { tenant: sink.tenant, scheme: sink.scheme, category });
  const span = spanOf(decl, node);
  if (!match) {
    sink.report(rule, span.start, span.end, `${text} is a raw length.`, { description: `Use a token from the ${SCALE_NAME[category]}.`, safe: false });
    return;
  }
  const token = `var(${match.cssVar})`;
  const replacement = px < 0 ? `calc(${token} * -1)` : token;
  const others = match.alternatives ? ` Same value: ${list(match.alternatives)}.` : '';
  if (match.exact) {
    const safe = unit === 'px' && !match.alternatives;
    const why = unit === 'rem'
      ? ' The token is in px and rem follows the reader\'s font size, so check it.'
      : match.alternatives
        ? ' More than one token has this value, so pick the one that fits.'
        : '';
    sink.report(
      rule,
      span.start,
      span.end,
      `${text} is a raw length. It equals ${match.token} for tenant "${sink.tenant}".`,
      valueFix(decl, span, replacement, `Use ${replacement}.${why}${others}`, safe),
    );
    return;
  }
  sink.report(
    rule,
    span.start,
    span.end,
    `${text} is not in the ${SCALE_NAME[category]}.`,
    valueFix(decl, span, replacement, `Nearest: ${match.token} (${match.value}, off by ${match.distance}px). Suggested: ${replacement}. It changes the size, so check it.${others}`, false),
  );
}

const MATH = new Set(['calc', 'min', 'max', 'clamp', 'round', 'mod', 'rem', 'abs', 'sign']);

function checkLengths(decl: Declaration, sink: Sink, nodes: ValueNode[], rule: RuleId, category: 'space' | 'radius' | 'font-size'): void {
  const walk = (children: ValueNode[], inMath: boolean): void => {
    for (const node of children) {
      if (node.type === 'word') {
        // Inside calc() a bare number is a factor, and operators are words too.
        if (inMath && /^[+\-*/]$/.test(node.value)) continue;
        if (inMath && /^[+-]?(\d+\.?\d*|\.\d+)$/.test(node.value)) continue;
        checkLength(decl, sink, node, rule, category, node.value);
      } else if (node.type === 'function') {
        const name = node.value.toLowerCase();
        if (name === 'var' || name === 'env' || name === 'attr') sink.pass(rule);
        else if (MATH.has(name)) walk(node.nodes, true);
        else sink.pass(rule);
      }
    }
  };
  walk(nodes, false);
}

/* ------------------------------------------------------------------ *
 * raw-font-weight, font-family-literal
 * ------------------------------------------------------------------ */

const CSS_WIDE = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);

function checkFontWeight(decl: Declaration, sink: Sink, nodes: ValueNode[]): void {
  const words = nodes.filter((n) => n.type !== 'space' && n.type !== 'comment');
  const node = words[0];
  if (!node || words.length !== 1) return;
  if (node.type === 'function') {
    sink.pass('raw-font-weight');
    return;
  }
  if (node.type !== 'word') return;
  const word = node.value.toLowerCase();
  if (CSS_WIDE.has(word)) {
    sink.pass('raw-font-weight');
    return;
  }
  const span = spanOf(decl, node);
  if (word === 'bolder' || word === 'lighter') {
    sink.report('raw-font-weight', span.start, span.end, `${node.value} is a relative font weight, not a token.`, {
      description: 'Use a weight token: var(--syntara-font-weight-regular), -medium, -semibold or -bold.',
      safe: false,
    });
    return;
  }
  const match = findToken(word, { tenant: sink.tenant, scheme: sink.scheme, category: 'font-weight' });
  if (!match) {
    sink.pass('raw-font-weight');
    return;
  }
  const replacement = `var(${match.cssVar})`;
  if (match.exact) {
    sink.report(
      'raw-font-weight',
      span.start,
      span.end,
      `${node.value} is a raw font weight. It equals ${match.token} for tenant "${sink.tenant}".`,
      valueFix(decl, span, replacement, `Use ${replacement}.`, !match.alternatives),
    );
    return;
  }
  sink.report(
    'raw-font-weight',
    span.start,
    span.end,
    `${node.value} is not one of the weight tokens.`,
    valueFix(decl, span, replacement, `Nearest: ${match.token} (${match.value}, off by ${match.distance}). Suggested: ${replacement}. It changes the weight, so check it.`, false),
  );
}

function familyAdvice(value: string): string {
  const v = value.toLowerCase();
  if (/mono|courier|consolas|menlo/.test(v)) return 'var(--syntara-font-mono)';
  return 'var(--syntara-font-body)';
}

function checkFontFamily(decl: Declaration, sink: Sink, nodes: ValueNode[]): void {
  const words = nodes.filter((n) => n.type !== 'space' && n.type !== 'comment');
  const first = words[0];
  if (!first) return;
  const onlyOne = words.length === 1;
  if (onlyOne && first.type === 'word' && CSS_WIDE.has(first.value.toLowerCase())) {
    sink.pass('font-family-literal');
    return;
  }
  // A private custom property (var(--_font)) can't be followed from here, so it passes. A fallback list after a
  // token, such as var(--syntara-font-mono), monospace, is a literal again.
  if (onlyOne && isVar(first)) {
    const name = first.nodes[0]?.value ?? '';
    const fallback = fallbackOf(first).filter((n) => n.type !== 'space');
    if (fallback.length === 0 || name.startsWith('--syntara-font-')) {
      sink.pass('font-family-literal');
      return;
    }
  }
  const suggestion = familyAdvice(decl.value);
  const span: Span = decl.valueStart === null
    ? { start: decl.wholeStart, end: decl.wholeEnd, precise: false }
    : { start: decl.valueStart + first.sourceIndex, end: decl.valueStart + words[words.length - 1]!.sourceEndIndex, precise: true };
  sink.report(
    'font-family-literal',
    span.start,
    span.end,
    'This font family is written out. Fonts come from the brand\'s type pair.',
    valueFix(decl, span, suggestion, `Use var(--syntara-font-body), var(--syntara-font-heading) or var(--syntara-font-mono). Suggested: ${suggestion}.`, false),
  );
}

function checkFontShorthand(decl: Declaration, sink: Sink, nodes: ValueNode[]): void {
  const words = nodes.filter((n) => n.type !== 'space' && n.type !== 'comment');
  const first = words[0];
  if (!first) return;
  if (words.length === 1 && (first.type === 'function' || (first.type === 'word' && CSS_WIDE.has(first.value.toLowerCase())))) {
    sink.pass('font-family-literal');
    return;
  }
  const last = words[words.length - 1]!;
  if (isVar(last) && (last.nodes[0]?.value ?? '').startsWith('--syntara-font-')) sink.pass('font-family-literal');
  else {
    sink.report('font-family-literal', decl.wholeStart, decl.wholeEnd, 'The font shorthand writes the family, size and weight as raw values.', {
      description: 'Write font-family, font-size and font-weight as separate declarations, each with its token.',
      safe: false,
    });
  }
}

/* ------------------------------------------------------------------ *
 * physical-property
 * ------------------------------------------------------------------ */

function propertyFix(decl: Declaration, logical: string): Fix {
  if (decl.tsxKey) {
    const text = camel(logical);
    return {
      description: `Use ${text}.`,
      replacement: decl.tsxKey.quoted ? `'${text}'` : text,
      start: decl.propStart,
      end: decl.propEnd,
      safe: true,
    };
  }
  return { description: `Use ${logical}.`, replacement: logical, start: decl.propStart, end: decl.propEnd, safe: true };
}

/** Top-level parts of a value, split on spaces. Returns null when a slash or comma makes it more than one list. */
function parts(nodes: ValueNode[]): string[] | null {
  const out: string[] = [];
  for (const node of nodes) {
    if (node.type === 'space' || node.type === 'comment') continue;
    if (node.type === 'div') return null;
    out.push(valueParser.stringify(node));
  }
  return out;
}

function checkPhysical(decl: Declaration, sink: Sink, nodes: ValueNode[]): void {
  const prop = decl.prop.toLowerCase();
  if (!isDirectional(prop)) return;

  const logical = PHYSICAL_TO_LOGICAL.get(prop);
  if (logical) {
    if (decl.propertyChecked) return;
    const shown = decl.tsxKey?.text ?? prop;
    sink.report('physical-property', decl.propStart, decl.propEnd, `${shown} is a physical property. It does not follow the text direction.`, propertyFix(decl, logical));
    return;
  }

  const keywords = PHYSICAL_VALUES[prop];
  if (keywords) {
    const node = nodes.find((n) => n.type === 'word');
    const replacement = node ? keywords[node.value.toLowerCase()] : undefined;
    if (node && replacement) {
      const span = spanOf(decl, node);
      sink.report(
        'physical-property',
        span.start,
        span.end,
        `${prop}: ${node.value} is physical. It does not follow the text direction.`,
        valueFix(decl, span, replacement, `Use ${prop}: ${replacement}.`, true),
      );
      return;
    }
    sink.pass('physical-property');
    return;
  }

  if (decl.propertyChecked) return;

  const sides = FOUR_SIDED.get(prop);
  if (sides && decl.kind !== 'tsx-number') {
    const values = parts(nodes);
    if (values && values.length === 4 && values[1] !== values[3]) {
      const [top, right, bottom, left] = values as [string, string, string, string];
      const replacement = `${sides.block}: ${top} ${bottom}; ${sides.inline}: ${left} ${right}`;
      const fix: Fix = decl.kind === 'css' && decl.declEnd !== undefined
        ? { description: `Write the two axes: ${replacement}. The values change order, so check it.`, replacement, start: decl.propStart, end: decl.declEnd, safe: false }
        : { description: `Write ${camel(sides.block)}: '${top} ${bottom}' and ${camel(sides.inline)}: '${left} ${right}'.`, safe: false };
      sink.report('physical-property', decl.propStart, decl.propEnd, `${prop} with four values sets right and left by name of position. It does not mirror in right-to-left.`, fix);
      return;
    }
  }

  if (prop === 'border-radius' && decl.kind !== 'tsx-number') {
    const values = parts(nodes);
    if (values && values.length >= 2) {
      const [tl, tr = tl, br = tl, bl = tr] = values as [string, string?, string?, string?];
      if (tl !== tr || br !== bl) {
        const replacement = `border-start-start-radius: ${tl}; border-start-end-radius: ${tr}; border-end-end-radius: ${br}; border-end-start-radius: ${bl}`;
        const fix: Fix = decl.kind === 'css' && decl.declEnd !== undefined
          ? { description: `Write the four logical corners: ${replacement}.`, replacement, start: decl.propStart, end: decl.declEnd, safe: false }
          : { description: 'Write the four logical corners: borderStartStartRadius, borderStartEndRadius, borderEndEndRadius, borderEndStartRadius.', safe: false };
        sink.report('physical-property', decl.propStart, decl.propEnd, 'border-radius with different left and right corners does not mirror in right-to-left.', fix);
        return;
      }
    }
  }

  sink.pass('physical-property');
}

/* ------------------------------------------------------------------ *
 * unknown-token
 * ------------------------------------------------------------------ */

/**
 * Every `var(--syntara-…)` in the value, including the ones nested in a fallback or inside calc().
 * Returns the var() node and the name node, so a fix can replace the name alone.
 */
function varUses(nodes: ValueNode[], out: Array<{ fn: FunctionNode; nameNode: ValueNode; name: string }> = []): Array<{ fn: FunctionNode; nameNode: ValueNode; name: string }> {
  for (const node of nodes) {
    if (node.type !== 'function') continue;
    const fn = node as FunctionNode;
    if (fn.value.toLowerCase() === 'var') {
      const first = fn.nodes.find((n) => n.type === 'word' || n.type === 'function');
      if (first && first.type === 'word' && first.value.startsWith('--')) {
        out.push({ fn, nameNode: first, name: first.value });
      }
      // A fallback can hold more var()s: var(--a, var(--b)).
      varUses(fallbackOf(fn), out);
      continue;
    }
    varUses(fn.nodes, out);
  }
  return out;
}

/**
 * Flags a `--syntara-*` name the theme engine never emits. Such a name is not a CSS error: the value parses, the
 * declaration is then invalid at computed-value time, and it silently does nothing — while still beating any
 * lower-specificity rule that would have worked. Names outside the `--syntara-` namespace belong to the page, not
 * to the design system, so they are not this rule's business.
 */
function checkKnownTokens(decl: Declaration, sink: Sink, nodes: ValueNode[]): void {
  const uses = varUses(nodes).filter((u) => u.name.startsWith('--syntara-'));
  if (uses.length === 0) return;
  const known = knownTokenNames(sink.tenant);
  // No tenant could be read, so there is nothing to check against. Saying nothing beats flagging everything.
  if (known.size === 0) return;

  for (const use of uses) {
    if (known.has(use.name) || sink.declaresLocally(use.name)) {
      sink.pass('unknown-token');
      continue;
    }
    const span = spanOf(decl, use.nameNode);
    const suggestions = nearestNames(use.name, known);
    const hasFallback = fallbackOf(use.fn).length > 0;
    const effect = hasFallback
      ? 'Only the fallback is doing the work, so the value no longer follows the tenant.'
      : `This declaration is invalid at computed-value time: ${decl.prop} is thrown away and nothing reports it.`;
    sink.report(
      'unknown-token',
      span.start,
      span.end,
      `${use.name} is not a token. The theme engine does not emit it. ${effect}`,
      {
        // Never safe: which role is right depends on what the element is, and that is a judgement the auditor
        // must not make. The nearest names are offered so the choice is quick, not so it is automatic.
        description:
          suggestions.length > 0
            ? `Use the role that matches what this is, and say why in a comment. Nearest names: ${list(suggestions)}.`
            : 'Use a role the engine emits, and say why in a comment. No emitted name resembles this one; `pnpm tokens` writes the full list to packages/tokens/dist/<tenant>/tokens.css.',
        safe: false,
      },
    );
  }
}

/* ------------------------------------------------------------------ *
 * Entry
 * ------------------------------------------------------------------ */

export function categoryOf(prop: string): TokenCategory | null {
  const p = prop.toLowerCase();
  if (SPACE_PROP.test(p)) return 'space';
  if (RADIUS_PROP.test(p)) return 'radius';
  if (p === 'font-size') return 'font-size';
  if (p === 'font-weight') return 'font-weight';
  return null;
}

export function checkDeclaration(decl: Declaration, sink: Sink): void {
  const nodes = valueParser(decl.value).nodes;
  const prop = decl.prop.toLowerCase();

  checkPhysical(decl, sink, nodes);
  checkColors(decl, sink, nodes);
  // Runs for every property, including custom ones: --docs-card-radius: var(--syntara-radius-md) is the same bug.
  checkKnownTokens(decl, sink, nodes);

  // The logical name is used for the category, so margin-left is still checked for its length.
  const category = categoryOf(prop);
  if (category === 'space') checkLengths(decl, sink, nodes, 'off-scale-space', 'space');
  else if (category === 'radius') checkLengths(decl, sink, nodes, 'off-scale-radius', 'radius');
  else if (category === 'font-size') checkLengths(decl, sink, nodes, 'off-scale-font-size', 'font-size');
  else if (category === 'font-weight') checkFontWeight(decl, sink, nodes);
  else if (prop === 'font-family') checkFontFamily(decl, sink, nodes);
  else if (prop === 'font') checkFontShorthand(decl, sink, nodes);
}
