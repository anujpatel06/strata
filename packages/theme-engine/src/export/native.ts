/**
 * Shared model for the native token exporters (compose.ts, swiftui.ts), plus the check that runs
 * on what they wrote.
 *
 * The model is built from the OUTPUT of toCssVariables(), for both schemes and both densities, so a
 * token added to the CSS contract reaches the Kotlin and Swift files without this file naming it:
 *
 *   --syntara-<family>-<rest>  →  group (a data class / struct) + property (camelCase)
 *
 * Known families get a group and a unit (the RULES below). A family nobody has seen yet gets its own
 * group, named after its first segment, with the unit read from the value. A value that can't be
 * read (a gradient, a CSS-only function) stops the export unless it is on NATIVE_EXCLUSIONS, which
 * gives the reason. Nothing is dropped silently.
 *
 * Colours: the engine's final values are 8-bit sRGB hex. The exporters write exactly those bytes
 * (Compose Color(0xFFRRGGBB), SwiftUI sRGB components over 255). No Display P3, no re-derivation
 * from OKLCH: that would change the values the contrast solver checked.
 *
 * Tokens only. Syntara ships no native components (ADR-019).
 */
import { toCssVariables } from '../css-vars';
import { checkScheme } from '../roles';
import type { ContrastCheck, Density, ResolvedColor, Role, Scheme, Theme } from '../types';
import { ROLES, roleToCssVar } from '../types';
import { parseCssColor, parseCubicBezier, parseHex, splitFontStack, splitTopLevel, toHex6 } from './util';

export type NativePlatform = 'compose' | 'swiftui';

/** How a value is written natively. */
export type NativeKind =
  | 'color' //         Compose Color            · SwiftUI Color
  | 'dimension' //     Dp                        · CGFloat (pt)
  | 'fontSize' //      TextUnit (sp)             · CGFloat (pt; scale with Dynamic Type)
  | 'em' //            TextUnit (em)             · CGFloat (multiple of the font size)
  | 'number' //        Float                     · Double
  | 'fontWeight' //    FontWeight                · Font.Weight
  | 'durationMs' //    Int (ms)                  · TimeInterval (s)
  | 'cubicBezier' //   CubicBezierEasing         · SyntaraCubicBezier
  | 'shadow' //        List<SyntaraShadowLayer>   · [SyntaraShadowLayer]
  | 'fontFamilies'; // List<String>              · [String]

export interface NativeColor {
  /** Lowercase #rrggbb: the engine's bytes. */
  hex: string;
  /** 0–1. 1 = opaque. */
  alpha: number;
  /** The CSS variable this value came from when it was written as var() or color-mix() of another one. */
  from?: string;
}

export interface NativeShadowLayer {
  color: NativeColor;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  inset: boolean;
}

export type NativeValue = NativeColor | number | string[] | NativeShadowLayer[] | [number, number, number, number];

export type NativeVaries = 'scheme' | 'density' | 'none';

export interface NativeEntry {
  /** camelCase property name, the same on both platforms. */
  prop: string;
  /** The CSS variable it comes from, or undefined for values read from the Theme object (spring). */
  cssVar?: string;
  /** Where a non-CSS value comes from, for the doc comment. */
  source?: string;
  kind: NativeKind;
  /** One value per variant of the group (light/dark, comfortable/compact, or 'base'). */
  values: Record<string, NativeValue>;
}

export interface NativeGroup {
  /** Type name: data class (Kotlin) and struct (Swift). */
  cls: string;
  /** Accessor on SyntaraTheme, mirroring the CSS name: --syntara-font-size-md → fontSize.md. */
  accessor: string;
  varies: NativeVaries;
  /** 'light' | 'dark', 'comfortable' | 'compact', or 'base'. */
  variants: string[];
  doc: (platform: NativePlatform) => string;
  entries: NativeEntry[];
}

export interface NativeModel {
  brandName: string;
  defaultDensity: Density;
  groups: NativeGroup[];
  /** Every CSS variable toCssVariables() emitted for this theme (both schemes, both densities). */
  cssVars: string[];
  /** CSS variables deliberately left out, with the reason (also in packages/tokens/README-native.md). */
  excluded: { cssVar: string; reason: string }[];
}

/**
 * CSS variables that have no faithful native value. Each one is listed in
 * packages/tokens/README-native.md with the same reason; a test checks both lists agree.
 */
export const NATIVE_EXCLUSIONS: Readonly<Record<string, string>> = {
  '--syntara-motion-spring':
    'A CSS linear() easing sampled from a spring. Neither platform takes a sampled curve. The spring itself (mass, stiffness, damping) is exported as `spring`, which Compose spring() and SwiftUI interpolatingSpring take directly.',
  '--syntara-sheen':
    'A CSS linear-gradient (dark scheme only; "none" in light). Its angle is measured against the web box, so it has no fixed native value. It is decoration: a band of text.default at low opacity. An app that wants it can draw it with Brush.linearGradient or LinearGradient.',
  '--syntara-hairline':
    'One device pixel on the web (1px, then 0.5px on 2× screens via a media query). Both platforms have this built in: Compose Dp.Hairline, SwiftUI 1 / displayScale from the environment.',
};

/* ------------------------------------------------------------------ rules */

const TOUCH_TARGET: Record<NativePlatform, string> = {
  compose: '48.dp',
  swiftui: '44 pt',
};

interface GroupSpec {
  cls: string;
  accessor: string;
  varies: NativeVaries;
  /** Unit for every entry; undefined = read from the value. */
  kind?: NativeKind;
  doc: (p: NativePlatform) => string;
}

const G = {
  colors: {
    cls: 'SyntaraColors',
    accessor: 'colors',
    varies: 'scheme',
    kind: 'color',
    doc: () =>
      'Semantic colour roles and the chart palette for one colour scheme. Exact 8-bit sRGB values from the engine. `pnpm tokens` re-checks every contrast pair on the values as written.',
  },
  effects: {
    cls: 'SyntaraEffects',
    accessor: 'effects',
    varies: 'scheme',
    doc: (p) =>
      'Elevation and glass for one colour scheme. Shadows are data (layers, as on the web): ' +
      (p === 'compose'
        ? 'Modifier.shadow() takes an elevation, not layers, so draw them yourself or pick an elevation that matches.'
        : 'stack one .shadow() per layer; SwiftUI has no spread or inset, so those layers need custom drawing.') +
      ' Glass: glassBg is surface.raised at glassOpacity, which keeps body and secondary text at 4.5:1 over a black or white backdrop.',
  },
  space: { cls: 'SyntaraSpace', accessor: 'space', varies: 'none', kind: 'dimension', doc: (p) => `Space scale, 4-point grid. Keys are multipliers: x4 = 4 × 4 = 16 ${p === 'compose' ? 'dp' : 'pt'}.` },
  radius: { cls: 'SyntaraRadius', accessor: 'radius', varies: 'none', kind: 'dimension', doc: () => 'Corner radii. Follows the brand\'s shape input. 9999 means "fully round".' },
  fontFamily: {
    cls: 'SyntaraFontFamilies',
    accessor: 'fontFamily',
    varies: 'none',
    kind: 'fontFamilies',
    doc: () =>
      'Font family names in fallback order. The app must bundle these fonts and follow their licences; web fallbacks are left out because the system font is the native fallback. An empty list means the system font.',
  },
  fontSize: {
    cls: 'SyntaraFontSizes',
    accessor: 'fontSize',
    varies: 'none',
    kind: 'fontSize',
    doc: (p) =>
      p === 'compose'
        ? 'Type scale in sp, so sizes follow the user\'s font size setting.'
        : 'Type scale in points at the default text size. Use SyntaraTheme.font(family:size:weight:) so sizes follow Dynamic Type.',
  },
  fontWeight: { cls: 'SyntaraFontWeights', accessor: 'fontWeight', varies: 'none', kind: 'fontWeight', doc: () => 'Font weights. The bundled font must include each weight (or be a variable font).' },
  lineHeight: {
    cls: 'SyntaraLineHeights',
    accessor: 'lineHeight',
    varies: 'none',
    kind: 'em',
    doc: (p) =>
      p === 'compose'
        ? 'Line heights as a multiple of the font size (em), for TextStyle.lineHeight.'
        : 'Line heights as a multiple of the font size, like CSS. Exact on iOS: NSParagraphStyle minimum and maximum line height = multiple × point size. SwiftUI .lineSpacing() adds space between lines, so pass (multiple × size) − the font\'s own line height.',
  },
  tracking: {
    cls: 'SyntaraTracking',
    accessor: 'tracking',
    varies: 'none',
    kind: 'em',
    doc: (p) =>
      p === 'compose'
        ? 'Letter spacing in em, for TextStyle.letterSpacing. 0 where the script of the type pair must not be letter-spaced (Arabic, Devanagari): spacing breaks the joins.'
        : 'Letter spacing as a multiple of the font size. SwiftUI .tracking() takes points: pass value × size. 0 where the script of the type pair must not be letter-spaced (Arabic, Devanagari): spacing breaks the joins.',
  },
  motion: {
    cls: 'SyntaraMotion',
    accessor: 'motion',
    varies: 'none',
    doc: (p) =>
      p === 'compose'
        ? 'Durations in milliseconds (tween(durationMillis = …)) and easing curves.'
        : 'Durations in seconds and easing curves (SyntaraCubicBezier.animation(duration:)).',
  },
  spring: {
    cls: 'SyntaraSpring',
    accessor: 'spring',
    varies: 'none',
    kind: 'number',
    doc: () => 'The damped spring the web samples into linear(), as physics: mass, stiffness, damping.',
  },
  icon: { cls: 'SyntaraIcon', accessor: 'icon', varies: 'none', kind: 'number', doc: () => 'Icon stroke width, unitless, in the icon\'s own 24 × 24 drawing units.' },
  density: {
    cls: 'SyntaraDensityTokens',
    accessor: 'density',
    varies: 'density',
    kind: 'dimension',
    doc: (p) =>
      `Sizes that change with density. These are the web design values and are not raised for touch: ` +
      `a control height can be below the platform minimum touch target (${TOUCH_TARGET[p]}). ` +
      (p === 'compose'
        ? 'Native controls must still meet it, e.g. Modifier.sizeIn(minHeight = 48.dp) around a control drawn at controlHeight.'
        : 'Native controls must still meet it, e.g. .frame(minHeight: 44) with .contentShape(Rectangle()) around a control drawn at controlHeight.'),
  },
} satisfies Record<string, GroupSpec>;

interface Rule {
  re: RegExp;
  group: GroupSpec;
  prop: (m: RegExpExecArray) => string;
  /** Extra condition on the (light, default-density) value. */
  when?: (value: string) => boolean;
}

const LENGTH = /^-?(?:\d+\.?\d*|\.\d+)px$/;
const EM = /^-?(?:\d+\.?\d*|\.\d+)em$/;
/** A font stack: not a bare number or a length. */
const isStack = (v: string): boolean => !/^-?(?:\d+\.?\d*|\.\d+)(px|em|ms|%)?$/.test(v.trim());

/** First match wins. Names are without the "--syntara-" prefix. */
const RULES: readonly Rule[] = [
  { re: /^color-(.+)$/, group: G.colors, prop: (m) => m[1]! },
  { re: /^chart-(.+)$/, group: G.colors, prop: (m) => `chart-${m[1]}` },
  { re: /^((?:shadow|glow|rim|glass)(?:-.+)?)$/, group: G.effects, prop: (m) => m[1]! },
  { re: /^space-(.+)$/, group: G.space, prop: (m) => m[1]! },
  { re: /^radius-(.+)$/, group: G.radius, prop: (m) => m[1]! },
  { re: /^font-size-(.+)$/, group: G.fontSize, prop: (m) => m[1]! },
  { re: /^font-weight-(.+)$/, group: G.fontWeight, prop: (m) => m[1]! },
  { re: /^font-tracking-(.+)$/, group: G.tracking, prop: (m) => m[1]! },
  { re: /^font-(.+)-tracking$/, group: G.tracking, prop: (m) => m[1]! },
  { re: /^line-height-(.+)$/, group: G.lineHeight, prop: (m) => m[1]! },
  { re: /^font-(.+)$/, group: G.fontFamily, prop: (m) => m[1]!, when: isStack },
  // Any other font-* length is text, so it scales with the user's text size; any other em is tracking.
  { re: /^font-(.+)$/, group: G.fontSize, prop: (m) => m[1]!, when: (v) => LENGTH.test(v.trim()) },
  { re: /^font-(.+)$/, group: G.tracking, prop: (m) => m[1]!, when: (v) => EM.test(v.trim()) },
  { re: /^motion-(.+)$/, group: G.motion, prop: (m) => m[1]! },
  { re: /^icon-(.+)$/, group: G.icon, prop: (m) => m[1]! },
];

/* ------------------------------------------------------------------ names */

const pascal = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** "feedback-success-on-solid" → "feedbackSuccessOnSolid"; "2xl" → "xl2"; "4" → "x4". */
export function nativePropName(key: string): string {
  const camel = key.replace(/-([a-z0-9])/gi, (_, c: string) => c.toUpperCase());
  const lead = /^(\d+)(.*)$/.exec(camel);
  if (!lead) return camel;
  return lead[2] ? lead[2].charAt(0).toLowerCase() + lead[2].slice(1) + lead[1] : `x${lead[1]}`;
}

/** Name of the instance holding one variant of a group, as the exporters write it. */
export function nativeInstanceName(platform: NativePlatform, group: Pick<NativeGroup, 'cls' | 'accessor'>, variant: string): string {
  // Constant groups are named after their class ("FontWeights"), never after a platform type ("FontWeight").
  if (platform === 'compose') return variant === 'base' ? group.cls.replace(/^Syntara/, '') : `${pascal(variant)}${pascal(group.accessor)}`;
  return variant === 'base' ? group.accessor : variant;
}

/* ------------------------------------------------------------------ values */

const NUM = /^-?(?:\d+\.?\d*|\.\d+)$/;

/** Rounds away float noise (e.g. 0.07000000000000001) without changing a value the engine wrote. */
export const clean = (n: number): number => Number(n.toFixed(6));

type Vars = Record<string, string>;

function resolveVar(value: string, vars: Vars, seen: string[] = []): { value: string; from?: string } {
  const m = /^var\((--[\w-]+)\)$/.exec(value.trim());
  if (!m) return { value: value.trim() };
  const name = m[1]!;
  if (seen.includes(name)) throw new Error(`Circular var(): ${[...seen, name].join(' → ')}`);
  const target = vars[name];
  if (target === undefined) throw new Error(`var(${name}) does not resolve`);
  const inner = resolveVar(target, vars, [...seen, name]);
  return { value: inner.value, from: inner.from ?? name };
}

/** Colour value: hex, rgb(), named, var() of a colour, or color-mix(in srgb, <colour> N%, transparent). */
function parseColor(raw: string, vars: Vars): NativeColor {
  const { value, from } = resolveVar(raw, vars);
  const mix = /^color-mix\(\s*in srgb\s*,\s*(.+?)\s+(\d+(?:\.\d+)?)%\s*,\s*transparent\s*\)$/.exec(value);
  if (mix) {
    // Mixing with transparent in (premultiplied) sRGB keeps the colour and scales its alpha.
    const base = parseColor(mix[1]!, vars);
    return { hex: base.hex, alpha: clean(base.alpha * (parseFloat(mix[2]!) / 100)), ...(base.from || from ? { from: base.from ?? from } : {}) };
  }
  if (!/^(#|rgba?\(|transparent$|black$|white$)/i.test(value)) throw new Error(`Not a colour: "${raw}"`);
  const rgba = value.startsWith('#') ? parseHex(value) : parseCssColor(value);
  for (const c of [rgba.r, rgba.g, rgba.b]) {
    if (!Number.isInteger(c)) throw new Error(`Colour channel is not a whole 8-bit value: "${raw}"`);
  }
  return { hex: toHex6(rgba), alpha: clean(rgba.a), ...(from ? { from } : {}) };
}

function parseLength(token: string): number {
  const m = /^(-?(?:\d+\.?\d*|\.\d+))(px)?$/.exec(token);
  if (!m || (!m[2] && parseFloat(m[1]!) !== 0)) throw new Error(`Not a px length: "${token}"`);
  return parseFloat(m[1]!);
}

/** CSS box-shadow → layers. Colours may be var() or color-mix(); "none" → []. */
function parseShadow(raw: string, vars: Vars): NativeShadowLayer[] {
  const src = resolveVar(raw, vars).value;
  if (src === 'none') return [];
  return splitTopLevel(src, ',').map((layer) => {
    const parts = splitTopLevel(layer, ' ');
    const inset = parts.includes('inset');
    const rest = parts.filter((p) => p !== 'inset');
    const colorParts = rest.filter((p) => !NUM.test(p.replace(/px$/, '')));
    if (colorParts.length !== 1) throw new Error(`Shadow layer needs exactly one colour: "${layer}"`);
    const lengths = rest.filter((p) => p !== colorParts[0]).map(parseLength);
    if (lengths.length < 2 || lengths.length > 4) throw new Error(`Shadow layer needs 2–4 lengths: "${layer}"`);
    return {
      color: parseColor(colorParts[0]!, vars),
      offsetX: lengths[0]!,
      offsetY: lengths[1]!,
      blur: lengths[2] ?? 0,
      spread: lengths[3] ?? 0,
      inset,
    };
  });
}

/** Reads a value as `kind`, or works the kind out from the value when `kind` is undefined. */
function readValue(raw: string, kind: NativeKind | undefined, vars: Vars, googleFamilies: ReadonlySet<string>): { kind: NativeKind; value: NativeValue } {
  const v = raw.trim();
  const k = kind ?? detectKind(v, vars);
  switch (k) {
    case 'color':
      return { kind: k, value: parseColor(v, vars) };
    case 'dimension':
    case 'fontSize':
      return { kind: k, value: parseLength(resolveVar(v, vars).value) };
    case 'em': {
      // "0.036em", or a unitless multiple ("1.5" line height, "0" tracking): both are multiples of the font size.
      const m = /^(-?(?:\d+\.?\d*|\.\d+))(em)?$/.exec(resolveVar(v, vars).value);
      if (!m) throw new Error(`Not an em value: "${raw}"`);
      return { kind: k, value: parseFloat(m[1]!) };
    }
    case 'number':
    case 'fontWeight': {
      const s = resolveVar(v, vars).value;
      if (!NUM.test(s)) throw new Error(`Not a number: "${raw}"`);
      const n = parseFloat(s);
      if (k === 'fontWeight' && !(Number.isInteger(n) && n >= 1 && n <= 1000)) throw new Error(`Not a font weight: "${raw}"`);
      return { kind: k, value: n };
    }
    case 'durationMs': {
      const m = /^(\d+)ms$/.exec(resolveVar(v, vars).value);
      if (!m) throw new Error(`Not a whole-millisecond duration: "${raw}"`);
      return { kind: k, value: parseInt(m[1]!, 10) };
    }
    case 'cubicBezier':
      return { kind: k, value: parseCubicBezier(resolveVar(v, vars).value) };
    case 'shadow':
      return { kind: k, value: parseShadow(v, vars) };
    case 'fontFamilies':
      // Keep the families the type pair actually loads, in stack order. The rest are web fallbacks.
      return { kind: k, value: splitFontStack(resolveVar(v, vars).value).filter((f) => googleFamilies.has(f)) };
  }
}

function detectKind(v: string, vars: Vars): NativeKind {
  const s = resolveVar(v, vars).value;
  if (/^(#|rgba?\(|color-mix\()/i.test(s)) return 'color';
  if (LENGTH.test(s)) return 'dimension';
  if (/^\d+ms$/.test(s)) return 'durationMs';
  if (EM.test(s)) return 'em';
  if (NUM.test(s)) return 'number';
  if (/^(cubic-bezier\(|ease|linear$)/.test(s)) return 'cubicBezier';
  if (/-?\d*\.?\d+px/.test(s) && /(#|rgba?\(|color-mix\(|var\()/.test(s)) return 'shadow';
  throw new Error(`No native form for "${v}"`);
}

/* ------------------------------------------------------------------ model */

const SCHEMES: readonly Scheme[] = ['light', 'dark'];

const sameValue = (a: NativeValue, b: NativeValue): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Theme → the native token model shared by toCompose() and toSwiftUI(). Throws when a CSS variable
 * has no rule-readable value and is not excluded, or when a group's values vary where they shouldn't.
 */
export interface NativeModelOptions {
  /** Source of the CSS variables. Default toCssVariables; tests pass a wrapper that adds tokens. */
  cssVariables?: (theme: Theme, scheme: Scheme, density: Density) => Record<string, string>;
}

export function buildNativeModel(theme: Theme, opts: NativeModelOptions = {}): NativeModel {
  const cssVariables = opts.cssVariables ?? toCssVariables;
  const densities = Object.keys(theme.foundations.density).sort() as Density[];
  const defaultDensity = theme.input.density;
  const vars: Record<Scheme, Record<string, Vars>> = { light: {}, dark: {} };
  for (const s of SCHEMES) for (const d of densities) vars[s][d] = cssVariables(theme, s, d);
  const base = vars.light[defaultDensity]!;
  const cssVars = [...new Set(SCHEMES.flatMap((s) => densities.flatMap((d) => Object.keys(vars[s][d]!))))];

  // Density tokens come from the Theme's shape, so the group follows DensityTokens without naming its keys.
  const densityVars = new Map<string, string>();
  for (const key of Object.keys(theme.foundations.density[defaultDensity])) {
    densityVars.set(`--syntara-${key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`, key);
  }

  const googleFamilies = new Set(theme.typePair.googleFamilies);
  const groups = new Map<string, NativeGroup>();
  const excluded: NativeModel['excluded'] = [];

  const groupFor = (spec: GroupSpec): NativeGroup => {
    let g = groups.get(spec.cls);
    if (!g) {
      const variants = spec.varies === 'scheme' ? [...SCHEMES] : spec.varies === 'density' ? [...densities] : ['base'];
      g = { cls: spec.cls, accessor: spec.accessor, varies: spec.varies, variants, doc: spec.doc, entries: [] };
      groups.set(spec.cls, g);
    }
    return g;
  };

  /** The values of one CSS variable per variant, plus a check that it doesn't vary along any other axis. */
  const variantValues = (name: string, varies: NativeVaries): Record<string, string> => {
    const all = SCHEMES.flatMap((s) => densities.map((d) => ({ s, d, v: vars[s][d]![name] })));
    if (all.some((x) => x.v === undefined)) throw new Error(`${name} is missing from some scheme/density outputs of toCssVariables()`);
    const out: Record<string, string> = {};
    for (const { s, d, v } of all) {
      const variant = varies === 'scheme' ? s : varies === 'density' ? d : 'base';
      const own = varies === 'scheme' ? vars[s][defaultDensity]![name]! : varies === 'density' ? vars.light[d]![name]! : base[name]!;
      if (v !== own) throw new Error(`${name} varies by ${varies === 'scheme' ? 'density' : varies === 'density' ? 'scheme' : 'scheme or density'}, which its native group (${varies}) cannot hold`);
      out[variant] = v!;
    }
    return out;
  };

  const varsFor = (varies: NativeVaries, variant: string): Vars =>
    varies === 'scheme' ? vars[variant as Scheme][defaultDensity]! : varies === 'density' ? vars.light[variant]! : base;

  for (const name of Object.keys(base)) {
    const reason = NATIVE_EXCLUSIONS[name];
    if (reason !== undefined) {
      excluded.push({ cssVar: name, reason });
      continue;
    }
    const short = name.replace(/^--syntara-/, '');
    let spec: GroupSpec;
    let key: string;
    const densityKey = densityVars.get(name);
    const rule = RULES.map((r) => ({ r, m: r.re.exec(short) })).find((x) => x.m && (!x.r.when || x.r.when(base[name]!)));
    if (densityKey !== undefined) {
      spec = G.density;
      key = densityKey;
    } else if (rule) {
      spec = rule.r.group;
      key = rule.r.prop(rule.m!);
    } else {
      // A family this file has never seen: its own group, unit read from the value, variance measured.
      const [family, ...rest] = short.split('-');
      const byScheme = densities.some((d) => vars.light[d]![name] !== vars.dark[d]![name]);
      const byDensity = SCHEMES.some((s) => new Set(densities.map((d) => vars[s][d]![name])).size > 1);
      spec = {
        cls: `Syntara${pascal(nativePropName(family!))}`,
        accessor: nativePropName(family!),
        varies: byScheme ? 'scheme' : byDensity ? 'density' : 'none',
        doc: () => `--syntara-${family}-* tokens.`,
      };
      key = rest.length ? rest.join('-') : family!;
    }
    const group = groupFor(spec);
    const raw = variantValues(name, group.varies);
    const values: Record<string, NativeValue> = {};
    let kind: NativeKind | undefined;
    for (const variant of group.variants) {
      let read: { kind: NativeKind; value: NativeValue };
      try {
        read = readValue(raw[variant]!, spec.kind, varsFor(group.varies, variant), googleFamilies);
      } catch (err) {
        throw new Error(
          `Native export: ${name} (${variant}) has no native form: ${err instanceof Error ? err.message : String(err)}. ` +
            'Give it a rule in src/export/native.ts or add it to NATIVE_EXCLUSIONS with the reason (and to packages/tokens/README-native.md).',
        );
      }
      if (kind && read.kind !== kind) throw new Error(`${name} is ${kind} in one variant and ${read.kind} in another`);
      kind = read.kind;
      values[variant] = read.value;
    }
    const prop = nativePropName(key);
    if (group.entries.some((e) => e.prop === prop)) throw new Error(`Two CSS variables map to ${group.cls}.${prop}`);
    group.entries.push({ prop, cssVar: name, kind: kind!, values });
  }

  // Not a CSS variable: the spring's physics. The web only gets it sampled into linear() (excluded above).
  const { spring } = theme.foundations.motion;
  const springGroup = groupFor(G.spring);
  springGroup.entries.push(
    // foundations.ts springEasing() simulates the spring with mass 1.
    { prop: 'mass', source: 'Mass. The engine simulates its spring with mass 1.', kind: 'number', values: { base: 1 } },
    { prop: 'stiffness', source: 'Stiffness.', kind: 'number', values: { base: spring.stiffness } },
    { prop: 'damping', source: 'Damping coefficient (not a ratio).', kind: 'number', values: { base: spring.damping } },
  );

  // Canonical order: the declared groups in G order, then any new family in the order it appeared.
  const order: string[] = Object.values(G).map((g) => g.cls);
  const rank = (cls: string): number => (order.includes(cls) ? order.indexOf(cls) : order.length);
  const sorted = [...groups.values()].map((g, i) => ({ g, i })).sort((a, b) => rank(a.g.cls) - rank(b.g.cls) || a.i - b.i).map((x) => x.g);

  return { brandName: theme.input.name, defaultDensity, groups: sorted, cssVars, excluded };
}

/** The group holding the semantic colour roles. */
export function colorGroup(model: NativeModel): NativeGroup {
  const g = model.groups.find((x) => x.cls === G.colors.cls);
  if (!g) throw new Error('Native model has no colour group');
  return g;
}

/* ------------------------------------------------------------------ formatting shared by both emitters */

/** Shortest decimal for a finite number; never exponent notation. */
export function num(n: number): string {
  if (!Number.isFinite(n)) throw new Error(`Not a finite number: ${n}`);
  const s = String(clean(n));
  if (/e/i.test(s)) throw new Error(`Number needs exponent notation: ${n}`);
  return s === '-0' ? '0' : s;
}

/** "#3d45d6" → "3D45D6". */
export const hexDigits = (hex: string): string => hex.replace(/^#/, '').toUpperCase();

/** Wraps text as comment lines at ~100 columns. */
export function wrap(text: string, width = 100): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      if (line && line.length + 1 + word.length > width) {
        out.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    out.push(line);
  }
  return out;
}

/* ------------------------------------------------------------------ verification on the written file */

export interface NativeExportCheck {
  platform: NativePlatform;
  /** Colour values read back out of the file and compared, per scheme. */
  compared: number;
  /** One per (scheme, fg, bg) in contrast-pairs.json, on the colours read back out of the file. */
  checks: ContrastCheck[];
  /** Empty when every value matches the theme byte for byte and every pair passes. */
  problems: string[];
}

/** Returns the text between the "(" that ends `start` and its matching ")". */
function argumentBlock(source: string, start: string): string | undefined {
  const at = source.indexOf(start);
  if (at < 0) return undefined;
  let depth = 1;
  const from = at + start.length;
  for (let i = from; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') depth++;
    else if (ch === ')' && --depth === 0) return source.slice(from, i);
  }
  return undefined;
}

/**
 * Reads every colour of the colour group back out of generated Kotlin or Swift text:
 * variant → property → colour. Only understands the exact forms the exporters write.
 */
export function readExportedColors(source: string, platform: NativePlatform, model: NativeModel): Record<string, Record<string, NativeColor>> {
  const group = colorGroup(model);
  const out: Record<string, Record<string, NativeColor>> = {};
  for (const variant of group.variants) {
    const inst = nativeInstanceName(platform, group, variant);
    const start = platform === 'compose' ? `val ${inst}: ${group.cls} = ${group.cls}(` : `static let ${inst} = ${group.cls}(`;
    const block = argumentBlock(source, start);
    const found: Record<string, NativeColor> = {};
    out[variant] = found;
    if (block === undefined) continue;
    const re =
      platform === 'compose'
        ? /^\s*`?(\w+)`?\s*=\s*Color\(0x([0-9A-F]{2})([0-9A-F]{6})\)(?:\.copy\(alpha = ([0-9.]+)f\))?,?/gm
        : /^\s*`?(\w+)`?:\s*srgb\(0x([0-9A-F]{6})(?:, opacity: ([0-9.]+))?\),?/gm;
    for (const m of block.matchAll(re)) {
      if (platform === 'compose') {
        if (m[2] !== 'FF') throw new Error(`${inst}.${m[1]}: alpha byte ${m[2]} (the exporter only writes FF)`);
        found[m[1]!] = { hex: `#${m[3]!.toLowerCase()}`, alpha: m[4] ? parseFloat(m[4]) : 1 };
      } else {
        found[m[1]!] = { hex: `#${m[2]!.toLowerCase()}`, alpha: m[3] ? parseFloat(m[3]) : 1 };
      }
    }
  }
  return out;
}

/**
 * The check ADR-019 asks for: read the colours back out of the generated file, compare them with
 * the theme byte for byte, then run every pair in contrast-pairs.json on what was read.
 */
export function verifyNativeExport(theme: Theme, source: string, platform: NativePlatform, model: NativeModel = buildNativeModel(theme)): NativeExportCheck {
  const group = colorGroup(model);
  const parsed = readExportedColors(source, platform, model);
  const problems: string[] = [];
  const checks: ContrastCheck[] = [];
  let compared = 0;
  const propOf = new Map(group.entries.map((e) => [e.cssVar, e.prop]));

  for (const scheme of SCHEMES) {
    const found = parsed[scheme] ?? {};
    const inst = nativeInstanceName(platform, group, scheme);
    if (Object.keys(found).length === 0) {
      problems.push(`${platform}: no ${group.cls} ${inst} block found`);
      continue;
    }
    // Every entry of the model, as written.
    for (const e of group.entries) {
      const want = e.values[scheme] as NativeColor;
      const got = found[e.prop];
      compared++;
      if (!got) problems.push(`${platform} ${inst}.${e.prop}: missing`);
      else if (got.hex !== want.hex || got.alpha !== want.alpha) {
        problems.push(`${platform} ${inst}.${e.prop}: ${got.hex}@${got.alpha} in the file, ${want.hex}@${want.alpha} in the theme`);
      }
    }
    for (const prop of Object.keys(found)) {
      if (!group.entries.some((e) => e.prop === prop)) problems.push(`${platform} ${inst}.${prop}: not in the theme`);
    }
    // Roles straight from the Theme object (not via the CSS output), then the contrast pairs.
    const roles = {} as Record<Role, ResolvedColor>;
    let complete = true;
    for (const role of ROLES) {
      const prop = propOf.get(roleToCssVar(role));
      const got = prop ? found[prop] : undefined;
      if (!got) {
        problems.push(`${platform} ${inst}: role ${role} not found`);
        complete = false;
        continue;
      }
      if (got.hex !== theme.schemes[scheme].roles[role].hex || got.alpha !== 1) {
        problems.push(`${platform} ${inst}.${prop}: ${got.hex} in the file, role ${role} is ${theme.schemes[scheme].roles[role].hex}`);
      }
      roles[role] = { hex: got.hex };
    }
    if (!complete) continue;
    for (const c of checkScheme(scheme, roles)) {
      checks.push(c);
      if (!c.pass) problems.push(`${platform} ${scheme}: ${c.fg} on ${c.bg} = ${c.ratio.toFixed(3)}:1, needs ${c.required}:1`);
    }
  }
  return { platform, compared, checks, problems };
}
