/**
 * Hand-built Theme for exporter tests (no engine code involved), plus pure validators
 * shared by exporters.test.ts and exporters.integration.test.ts. Validators return a list of
 * problems so a failing assertion prints exactly what is wrong.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type {
  Adjustment,
  ContrastCheck,
  Foundations,
  RampName,
  ResolvedColor,
  Role,
  Scheme,
  SchemeTheme,
  Theme,
  TypePair,
} from '../src/types';
import { ROLES, roleToCssVar } from '../src/types';

/* ================================================================== fixture */

const RAMPS: RampName[] = ['primary', 'accent', 'neutral', 'success', 'warning', 'danger', 'info'];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}
/** 12 steps interpolated in sRGB between two anchors (fixture only — the engine uses OKLCH). */
function ramp(from: string, to: string): string[] {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    return rgbToHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
  });
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const LIGHT_ANCHORS: Record<RampName, [string, string]> = {
  primary: ['#f5f6ff', '#141852'],
  accent: ['#effcfa', '#063d38'],
  neutral: ['#fbfcfd', '#11151c'],
  success: ['#f1fbf4', '#0b3d1f'],
  warning: ['#fff9eb', '#4a2c00'],
  danger: ['#fff5f5', '#5a0f12'],
  info: ['#f2f8ff', '#0b2c55'],
};
const DARK_ANCHORS: Record<RampName, [string, string]> = {
  primary: ['#0e1030', '#e8eaff'],
  accent: ['#04201d', '#d9f7f3'],
  neutral: ['#0c0e12', '#eef0f3'],
  success: ['#071f10', '#dcf5e4'],
  warning: ['#261700', '#fff0cc'],
  danger: ['#2a0709', '#ffe0e0'],
  info: ['#06172c', '#dcebff'],
};

/** Role → "ramp.step" (resolved against the ramp) or a literal hex. */
const LIGHT_MAP: Record<Role, string> = {
  'surface.canvas': 'neutral.1',
  'surface.default': '#ffffff',
  'surface.raised': '#ffffff',
  'surface.sunken': 'neutral.2',
  'surface.selected': 'primary.3',
  'surface.inverse': 'neutral.12',
  'text.default': 'neutral.12',
  'text.subtle': 'neutral.11',
  'text.disabled': 'neutral.8',
  'text.inverse': '#ffffff',
  'text.brand': 'primary.11',
  'border.subtle': 'neutral.5',
  'border.default': 'neutral.7',
  'border.strong': 'neutral.9',
  'action.primary.bg': 'primary.9',
  'action.primary.fg': '#ffffff',
  'action.primary.hover': 'primary.10',
  'action.primary.pressed': 'primary.11',
  'action.primary.border': 'primary.9',
  'action.secondary.bg': 'neutral.3',
  'action.secondary.fg': 'neutral.12',
  'action.secondary.hover': 'neutral.4',
  'action.secondary.pressed': 'neutral.5',
  'accent.bg': 'accent.9',
  'accent.fg': '#ffffff',
  'accent.subtle': 'accent.3',
  'accent.text': 'accent.11',
  'focus.ring': 'primary.8',
  'feedback.success.bg': 'success.2',
  'feedback.success.fg': 'success.11',
  'feedback.success.border': 'success.7',
  'feedback.success.solid': 'success.9',
  'feedback.success.onSolid': '#ffffff',
  'feedback.warning.bg': 'warning.2',
  'feedback.warning.fg': 'warning.11',
  'feedback.warning.border': 'warning.7',
  'feedback.warning.solid': 'warning.9',
  'feedback.warning.onSolid': 'neutral.12',
  'feedback.danger.bg': 'danger.2',
  'feedback.danger.fg': 'danger.11',
  'feedback.danger.border': 'danger.7',
  'feedback.danger.solid': 'danger.9',
  'feedback.danger.onSolid': '#ffffff',
  'feedback.info.bg': 'info.2',
  'feedback.info.fg': 'info.11',
  'feedback.info.border': 'info.7',
  'feedback.info.solid': 'info.9',
  'feedback.info.onSolid': '#ffffff',
};
const DARK_MAP: Record<Role, string> = {
  ...LIGHT_MAP,
  'surface.default': 'neutral.2',
  'surface.raised': 'neutral.3',
  'surface.sunken': 'neutral.1',
  'text.inverse': 'neutral.1',
  'action.primary.fg': '#ffffff',
  'accent.fg': 'neutral.1',
};

function buildScheme(scheme: Scheme): Omit<SchemeTheme, 'shadows'> {
  const anchors = scheme === 'light' ? LIGHT_ANCHORS : DARK_ANCHORS;
  const ramps = Object.fromEntries(RAMPS.map((r) => [r, ramp(...anchors[r])])) as Record<RampName, string[]>;
  const map = scheme === 'light' ? LIGHT_MAP : DARK_MAP;
  const roles = {} as Record<Role, ResolvedColor>;
  for (const role of ROLES) {
    const v = map[role];
    if (v.startsWith('#')) {
      roles[role] = { hex: v };
    } else {
      const [name, step] = v.split('.') as [RampName, string];
      roles[role] = { hex: ramps[name][Number(step) - 1]!, ref: v };
    }
  }
  // Hand-copied from the engine's Vela output (same primary/accent as this fixture); exporters only pass them through.
  const series = scheme === 'light' ? ['#3d45d6', '#ce5604', '#009582', '#d765b5'] : ['#4956e7', '#dc621e', '#00a28e', '#b14393'];
  const chart = { series, grid: roles['border.subtle'].hex, axis: roles['text.subtle'].hex };
  return { ramps, roles, glass: { opacity: 0.8, blur: 20 }, chart };
}

const FOUNDATIONS: Foundations = {
  space: { '0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64 },
  radius: { button: 8, field: 8, container: 12, badge: 6, pill: 9999 },
  fontSize: { xs: 12, sm: 13, md: 14, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40, '5xl': 48 },
  lineHeight: { tight: 1.2, snug: 1.35, normal: 1.5 },
  fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  motion: {
    durationFast: 120,
    durationNormal: 200,
    durationSlow: 320,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    easingOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    spring: { easing: 'linear(0, 0.5, 1)', duration: 360, stiffness: 260, damping: 22 },
  },
  density: {
    comfortable: { controlHeight: 40, controlPaddingInline: 16, tableRowHeight: 48, cardInset: 24, sectionGap: 24, fieldGap: 16 },
    compact: { controlHeight: 32, controlPaddingInline: 12, tableRowHeight: 36, cardInset: 16, sectionGap: 16, fieldGap: 12 },
  },
};

const TYPE_PAIR: TypePair = {
  id: 'precise',
  label: 'Precise — Inter Tight / Inter',
  heading: '"Inter Tight", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  body: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  headingTracking: '-0.01em',
  supportsArabic: false,
  googleFamilies: ['Inter Tight', 'Inter', 'JetBrains Mono'],
};

export const FIXTURE_SHADOWS: Record<Scheme, SchemeTheme['shadows']> = {
  light: {
    raised: '0 1px 2px rgb(16 24 40 / 0.06), 0 1px 3px rgb(16 24 40 / 0.10)',
    overlay: '0 12px 32px -4px rgb(16 24 40 / 0.16), 0 4px 8px -2px rgb(16 24 40 / 0.08)',
    highlight: 'inset 0 1px 0 rgb(255 255 255 / 0.20)',
  },
  dark: {
    raised: '0 1px 2px rgb(0 0 0 / 0.40)',
    overlay: '0 16px 40px -8px rgb(0 0 0 / 0.60)',
    highlight: 'inset 0 1px 0 rgb(255 255 255 / 0.12)',
  },
};

/** Literal (non-ramp) value the "solver" picked for the light focus ring. */
export const FIXTURE_FOCUS_RING_LIGHT = '#3a41c9';

export function makeFixtureTheme(): Theme {
  const light = buildScheme('light');
  const dark = buildScheme('dark');

  // Adjustment 1 — light focus ring moved off the ramp to a literal value (no ref).
  const ringFrom = light.roles['focus.ring'];
  light.roles['focus.ring'] = {
    hex: FIXTURE_FOCUS_RING_LIGHT,
    adjusted: { fromHex: ringFrom.hex, fromRef: ringFrom.ref, adjustmentId: 'light:focus.ring' },
  };
  // Adjustment 2 — dark brand text moved along the ramp (keeps a ref).
  const brandFrom = dark.roles['text.brand'];
  dark.roles['text.brand'] = {
    hex: dark.ramps.primary[11]!,
    ref: 'primary.12',
    adjusted: { fromHex: brandFrom.hex, fromRef: brandFrom.ref, adjustmentId: 'dark:text.brand' },
  };

  const adjustments: Adjustment[] = [
    {
      id: 'light:focus.ring',
      scheme: 'light',
      role: 'focus.ring',
      kind: 'contrast',
      label: 'Focus ring',
      fromHex: ringFrom.hex,
      toHex: FIXTURE_FOCUS_RING_LIGHT,
      against: ['surface.canvas', 'surface.default'],
      ratioBefore: ratio(ringFrom.hex, light.roles['surface.canvas'].hex),
      ratioAfter: ratio(FIXTURE_FOCUS_RING_LIGHT, light.roles['surface.canvas'].hex),
      required: 3,
      message: 'The focus ring was too faint against the page background, so it was darkened until it reached 3:1 contrast.',
    },
    {
      id: 'dark:text.brand',
      scheme: 'dark',
      role: 'text.brand',
      kind: 'contrast',
      label: 'Brand text',
      fromHex: brandFrom.hex,
      toHex: dark.ramps.primary[11]!,
      against: ['surface.canvas'],
      ratioBefore: ratio(brandFrom.hex, dark.roles['surface.canvas'].hex),
      ratioAfter: ratio(dark.ramps.primary[11]!, dark.roles['surface.canvas'].hex),
      required: 4.5,
      message: 'Brand-coloured text was hard to read on the dark background, so it was lightened to the next ramp step.',
    },
  ];

  const pairs: [Role, Role, number, ContrastCheck['kind']][] = [
    ['text.default', 'surface.canvas', 4.5, 'text'],
    ['text.subtle', 'surface.default', 4.5, 'text'],
    ['action.primary.fg', 'action.primary.bg', 4.5, 'text'],
    ['focus.ring', 'surface.canvas', 3, 'non-text'],
  ];
  const schemes = { light: { ...light, shadows: FIXTURE_SHADOWS.light }, dark: { ...dark, shadows: FIXTURE_SHADOWS.dark } };
  const checks: ContrastCheck[] = (['light', 'dark'] as const).flatMap((scheme) =>
    pairs.map(([fg, bg, required, kind]) => {
      const fgHex = schemes[scheme].roles[fg].hex;
      const bgHex = schemes[scheme].roles[bg].hex;
      const r = ratio(fgHex, bgHex);
      return { scheme, fg, bg, fgHex, bgHex, ratio: r, required, kind, pass: r >= required };
    }),
  );

  return {
    input: {
      name: 'Fixture',
      primary: '#3d45d6',
      accent: '#12b5a6',
      neutral: 'cool',
      shape: 'soft',
      typePair: 'precise',
      density: 'comfortable',
    },
    schemes,
    adjustments,
    checks,
    foundations: structuredClone(FOUNDATIONS),
    typePair: { ...TYPE_PAIR, googleFamilies: [...TYPE_PAIR.googleFamilies] },
    summary: {
      checks: checks.length,
      passed: checks.filter((c) => c.pass).length,
      failed: checks.filter((c) => !c.pass).length,
      adjustments: adjustments.length,
      tokenCount: 339,
      generationMs: 0,
    },
  };
}

/* ================================================================== contract */

/**
 * Every non-colour variable named in the CSS variable contract comment in src/types.ts,
 * parsed from the source so the tests fail if the contract grows without the exporter.
 * `{a,b}` groups are expanded; "--syntara-color-<role>" is covered by roleToCssVar.
 */
export function contractFoundationVars(): string[] {
  const src = readFileSync(fileURLToPath(new URL('../src/types.ts', import.meta.url)), 'utf8');
  const start = src.indexOf('CSS variable contract');
  const end = src.indexOf('----- *', start);
  const comment = src.slice(start, end);
  const names = new Set<string>();
  for (const m of comment.matchAll(/--syntara-[a-z0-9-]*(?:\{([^}]*)\})?/g)) {
    const [whole, group] = m;
    if (group !== undefined) {
      const prefix = whole.slice(0, whole.indexOf('{'));
      for (const item of group.split(',')) names.add(prefix + item.trim());
    } else if (!whole.endsWith('-') && !whole.startsWith('--syntara-color-')) {
      names.add(whole);
    }
  }
  return [...names];
}

export function contractCssVars(): string[] {
  return [...ROLES.map(roleToCssVar), ...contractFoundationVars()];
}

/** Problems with a toCssVariables() result for `theme`/`scheme`. */
export function cssVarProblems(vars: Record<string, string>, theme: Theme, scheme: Scheme): string[] {
  const problems: string[] = [];
  for (const name of contractCssVars()) {
    const v = vars[name];
    if (v === undefined) problems.push(`missing ${name}`);
    else if (v.trim() === '' || /undefined|NaN|null|\[object/.test(v)) problems.push(`bad value ${name}: "${v}"`);
  }
  for (const role of ROLES) {
    if (vars[roleToCssVar(role)] !== theme.schemes[scheme].roles[role].hex) problems.push(`colour mismatch ${role}`);
  }
  return problems;
}

/* ================================================================== CSS parsing */

export interface CssRule {
  /** Enclosing at-rule prelude, e.g. "@media (prefers-color-scheme: dark)". */
  at: string | null;
  selector: string;
  decls: Record<string, string>;
}

/** Minimal parser for the exporter's own output (no nested braces in values). */
export function parseCss(css: string): CssRule[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: CssRule[] = [];
  const stack: string[] = [];
  let buf = '';
  for (const ch of src) {
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      const selector = stack.pop();
      if (selector === undefined) throw new Error('Unbalanced "}" in CSS');
      if (buf.trim()) {
        const decls: Record<string, string> = {};
        for (const d of buf.split(';')) {
          const i = d.indexOf(':');
          if (i > 0) decls[d.slice(0, i).trim()] = d.slice(i + 1).trim();
        }
        rules.push({ at: stack.at(-1) ?? null, selector, decls });
      }
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (stack.length) throw new Error('Unbalanced "{" in CSS');
  return rules;
}

/* ================================================================== DTCG */

const DTCG_TYPES = new Set(['color', 'dimension', 'duration', 'cubicBezier', 'fontFamily', 'fontWeight', 'number', 'shadow']);

export interface Leaf {
  path: string;
  token: Record<string, unknown>;
  /** $type on the token or inherited from the nearest group. */
  type: string | undefined;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v);

export function collectLeaves(doc: unknown, path: string[] = [], inherited?: string): Leaf[] {
  if (!isObj(doc)) return [];
  const type = typeof doc.$type === 'string' ? doc.$type : inherited;
  if ('$value' in doc) return [{ path: path.join('.'), token: doc, type }];
  return Object.entries(doc)
    .filter(([k]) => !k.startsWith('$'))
    .flatMap(([k, v]) => collectLeaves(v, [...path, k], type));
}

const ALIAS = /^\{([^{}]+)\}$/;

/** Follows "{a.b.c}" (and chained aliases) to a leaf token. */
export function resolveAlias(doc: unknown, alias: string, depth = 0): Obj | undefined {
  const m = ALIAS.exec(alias);
  if (!m || depth > 10) return undefined;
  let node: unknown = doc;
  for (const key of m[1]!.split('.')) node = isObj(node) ? node[key] : undefined;
  if (!isObj(node) || !('$value' in node)) return undefined;
  return typeof node.$value === 'string' && ALIAS.test(node.$value) ? resolveAlias(doc, node.$value, depth + 1) : node;
}

function colorValueProblems(path: string, v: unknown): string[] {
  if (!isObj(v)) return [`${path}: colour $value is not an object`];
  const p: string[] = [];
  if (v.colorSpace !== 'srgb') p.push(`${path}: colorSpace ${String(v.colorSpace)}`);
  const c = v.components;
  if (!Array.isArray(c) || c.length !== 3) p.push(`${path}: components must be [r,g,b]`);
  else
    for (const n of c) {
      if (typeof n !== 'number' || n < 0 || n > 1 || Math.round(n * 10000) / 10000 !== n) p.push(`${path}: component ${String(n)}`);
    }
  if (typeof v.hex !== 'string' || !/^#[0-9a-f]{6}$/.test(v.hex)) p.push(`${path}: hex ${String(v.hex)}`);
  if (Array.isArray(c) && typeof v.hex === 'string') {
    const [r, g, b] = hexToRgb(v.hex).map((x) => Math.round((x / 255) * 10000) / 10000);
    if (c[0] !== r || c[1] !== g || c[2] !== b) p.push(`${path}: components do not match hex`);
  }
  if ('alpha' in v && (typeof v.alpha !== 'number' || v.alpha < 0 || v.alpha > 1)) p.push(`${path}: alpha ${String(v.alpha)}`);
  return p;
}

const isDim = (v: unknown, units = ['px', 'rem']): boolean =>
  isObj(v) && typeof v.value === 'number' && Number.isFinite(v.value) && units.includes(v.unit as string);

/** Structural + reference problems in a DTCG 2025.10 document produced by toDTCG(). */
export function dtcgProblems(doc: Obj): string[] {
  const problems: string[] = [];
  const leaves = collectLeaves(doc);
  const byPath = new Map(leaves.map((l) => [l.path, l] as const));
  for (const { path, token, type } of leaves) {
    if (!type || !DTCG_TYPES.has(type)) {
      problems.push(`${path}: unresolvable or unknown $type "${String(type)}"`);
      continue;
    }
    let value = token.$value;
    let hops = 0;
    while (typeof value === 'string' && value.startsWith('{')) {
      const target = byPath.get(ALIAS.exec(value)?.[1] ?? '');
      if (!target || ++hops > 10) {
        problems.push(`${path}: alias ${value} does not resolve to a token`);
        value = undefined;
        break;
      }
      if (target.type !== type) problems.push(`${path}: alias type ${type} → ${String(target.type)}`);
      value = target.token.$value;
    }
    if (value === undefined) continue;
    switch (type) {
      case 'color':
        problems.push(...colorValueProblems(path, value));
        break;
      case 'dimension':
        if (!isDim(value)) problems.push(`${path}: bad dimension ${JSON.stringify(value)}`);
        break;
      case 'duration':
        if (!isDim(value, ['ms', 's'])) problems.push(`${path}: bad duration ${JSON.stringify(value)}`);
        break;
      case 'cubicBezier':
        if (!Array.isArray(value) || value.length !== 4 || !value.every((n) => typeof n === 'number'))
          problems.push(`${path}: bad cubicBezier`);
        break;
      case 'fontFamily':
        if (!Array.isArray(value) || !value.length || value.some((f) => typeof f !== 'string' || /["']/.test(f) || !f.trim()))
          problems.push(`${path}: bad fontFamily ${JSON.stringify(value)}`);
        break;
      case 'fontWeight':
      case 'number':
        if (typeof value !== 'number' || !Number.isFinite(value)) problems.push(`${path}: bad ${type}`);
        break;
      case 'shadow': {
        const layers = Array.isArray(value) ? value : [value];
        for (const [i, l] of layers.entries()) {
          if (!isObj(l)) {
            problems.push(`${path}[${i}]: shadow layer not an object`);
            continue;
          }
          problems.push(...colorValueProblems(`${path}[${i}].color`, l.color));
          for (const k of ['offsetX', 'offsetY', 'blur', 'spread']) {
            if (!isDim(l[k])) problems.push(`${path}[${i}].${k}: bad dimension`);
          }
        }
        break;
      }
    }
  }
  return problems;
}

/** Semantic roles in the DTCG doc must resolve to the theme's hex, and adjusted roles must explain themselves. */
export function dtcgRoleProblems(doc: Obj, theme: Theme): string[] {
  const problems: string[] = [];
  const messages = new Map(theme.adjustments.map((a) => [a.id, a.message] as const));
  for (const scheme of ['light', 'dark'] as const) {
    for (const role of ROLES) {
      const path = `semantic.${scheme}.color.${role}`;
      const c = theme.schemes[scheme].roles[role];
      const tok = resolveAlias(doc, `{${path}}`);
      const raw = (() => {
        let n: unknown = doc;
        for (const k of path.split('.')) n = isObj(n) ? n[k] : undefined;
        return isObj(n) ? n : undefined;
      })();
      if (!tok || !raw) {
        problems.push(`${path}: missing`);
        continue;
      }
      const hex = isObj(tok.$value) ? tok.$value.hex : undefined;
      if (hex !== c.hex) problems.push(`${path}: resolves to ${String(hex)}, theme has ${c.hex}`);
      if (c.ref && raw.$value !== `{primitive.color.${scheme}.${c.ref}}`) problems.push(`${path}: expected alias to ${c.ref}`);
      if (!c.ref && typeof raw.$value === 'string') problems.push(`${path}: literal role exported as alias`);
      const ext = isObj(raw.$extensions) ? raw.$extensions['com.syntara.adjusted'] : undefined;
      if (c.adjusted) {
        const expected = messages.get(c.adjusted.adjustmentId);
        if (!isObj(ext)) problems.push(`${path}: adjusted role lacks com.syntara.adjusted`);
        else {
          if (typeof ext.reason !== 'string' || !ext.reason) problems.push(`${path}: adjusted role has no reason`);
          if (expected !== undefined && ext.reason !== expected) problems.push(`${path}: reason does not match adjustment message`);
          const from = c.adjusted.fromRef ? `{primitive.color.${scheme}.${c.adjusted.fromRef}}` : c.adjusted.fromHex;
          if (ext.from !== from) problems.push(`${path}: from ${String(ext.from)} ≠ ${from}`);
          if (typeof ext.from === 'string' && ext.from.startsWith('{') && !resolveAlias(doc, ext.from))
            problems.push(`${path}: adjusted.from alias does not resolve`);
        }
      } else if (ext !== undefined) {
        problems.push(`${path}: unadjusted role carries com.syntara.adjusted`);
      }
    }
  }
  return problems;
}

/* ================================================================== Figma */

export function figmaFileNames(name: string): string[] {
  return [
    `Brand.${name}.tokens.json`,
    'Semantic.Light.tokens.json',
    'Semantic.Dark.tokens.json',
    `Shape.${name}.tokens.json`,
    'Density.Comfortable.tokens.json',
    'Density.Compact.tokens.json',
    `Type.${name}.tokens.json`,
  ];
}

/** Deep copy without any "$description" keys (Semantic files may differ only there). */
export function stripDescriptions(doc: unknown): unknown {
  if (Array.isArray(doc)) return doc.map(stripDescriptions);
  if (!isObj(doc)) return doc;
  return Object.fromEntries(Object.entries(doc).filter(([k]) => k !== '$description').map(([k, v]) => [k, stripDescriptions(v)]));
}

interface FigmaLeaf extends Leaf {
  file: string;
}

/**
 * Resolves "{a.b.c}" across every Figma file, following chains to a final value.
 * Each hop must match exactly one token in exactly one file (Figma resolves by variable name).
 */
export function resolveFigmaAlias(
  index: ReadonlyMap<string, FigmaLeaf[]>,
  alias: string,
): { value: unknown; hops: string[] } | { error: string } {
  const hops: string[] = [];
  let value: unknown = alias;
  while (typeof value === 'string' && ALIAS.test(value)) {
    const path = ALIAS.exec(value)![1]!;
    const hits = index.get(path) ?? [];
    if (hits.length !== 1) return { error: `${value} matches ${hits.length} tokens` };
    hops.push(`${hits[0]!.file}:${path}`);
    if (hops.length > 10) return { error: `${alias}: alias cycle` };
    value = hits[0]!.token.$value;
  }
  return { value, hops };
}

export function figmaIndex(files: Record<string, Obj>): Map<string, FigmaLeaf[]> {
  const index = new Map<string, FigmaLeaf[]>();
  for (const [file, doc] of Object.entries(files)) {
    for (const leaf of collectLeaves(doc)) {
      const list = index.get(leaf.path) ?? [];
      list.push({ ...leaf, file });
      index.set(leaf.path, list);
    }
  }
  return index;
}

const getPath = (doc: unknown, path: string[]): Obj | undefined => {
  let n: unknown = doc;
  for (const k of path) n = isObj(n) ? n[k] : undefined;
  return isObj(n) ? n : undefined;
};

export function figmaProblems(files: Record<string, Obj>, theme: Theme): string[] {
  const problems: string[] = [];
  const name = theme.input.name;
  const expected = figmaFileNames(name);
  const actual = Object.keys(files);
  if (actual.length !== expected.length || expected.some((f) => !actual.includes(f)))
    problems.push(`files: expected ${expected.join(', ')}; got ${actual.join(', ')}`);
  const index = figmaIndex(files);

  // Every leaf: known $type, valid value; every alias resolves (across files) to a hex.
  for (const [file, doc] of Object.entries(files)) {
    if (typeof doc.$description !== 'string' || !/collection ".+", mode ".+"/.test(doc.$description))
      problems.push(`${file}: $description must name its collection and mode`);
    else if (!doc.$description.includes('single-mode export'))
      problems.push(`${file}: $description lacks the mode-limit note (pointing Starter users to the single-mode export)`);
    for (const { path, token, type } of collectLeaves(doc)) {
      const v = token.$value;
      if (type === 'color') {
        if (typeof v !== 'string') problems.push(`${file} ${path}: colour must be a string`);
        else if (v.startsWith('{')) {
          const r = resolveFigmaAlias(index, v);
          if ('error' in r) problems.push(`${file} ${path}: ${r.error}`);
          else if (typeof r.value !== 'string' || !/^#[0-9a-f]{6}$/.test(r.value))
            problems.push(`${file} ${path}: ${v} resolves to ${String(r.value)}`);
        } else if (!/^#[0-9a-f]{6}$/.test(v)) problems.push(`${file} ${path}: bad hex ${v}`);
      } else if (type === 'number') {
        if (typeof v !== 'number' || !Number.isFinite(v)) problems.push(`${file} ${path}: bad number`);
      } else if (type === 'string') {
        if (typeof v !== 'string' || !v || /["',]/.test(v)) problems.push(`${file} ${path}: bad string ${String(v)}`);
      } else problems.push(`${file} ${path}: unexpected $type ${String(type)}`);
    }
  }

  const brand = files[`Brand.${name}.tokens.json`];
  const messages = new Map(theme.adjustments.map((a) => [a.id, a.message] as const));
  for (const scheme of ['light', 'dark'] as const) {
    const semantic = files[`Semantic.${scheme === 'light' ? 'Light' : 'Dark'}.tokens.json`];
    for (const role of ROLES) {
      const c = theme.schemes[scheme].roles[role];
      // Brand role layer: alias to this file's ramp when the role is a ramp step, literal otherwise.
      const layer = getPath(brand, ['role', scheme, ...role.split('.')]);
      const want = c.ref ? `{color.${scheme}.${c.ref}}` : c.hex;
      if (layer?.$value !== want) problems.push(`Brand role.${scheme}.${role}: ${String(layer?.$value)} ≠ ${want}`);
      const msg = c.adjusted ? messages.get(c.adjusted.adjustmentId) : undefined;
      if (msg !== undefined && layer?.$description !== msg) problems.push(`Brand role.${scheme}.${role}: missing solver message`);
      if (!c.adjusted && layer?.$description !== undefined) problems.push(`Brand role.${scheme}.${role}: unexpected $description`);
      // Semantic: brand-independent alias into the role layer, resolving to the theme hex.
      const sem = getPath(semantic, ['color', ...role.split('.')]);
      if (sem?.$value !== `{role.${scheme}.${role}}`) problems.push(`Semantic.${scheme} ${role}: ${String(sem?.$value)}`);
      const r = resolveFigmaAlias(index, `{role.${scheme}.${role}}`);
      const hex = 'error' in r ? r.error : r.value;
      if (hex !== c.hex) problems.push(`Semantic.${scheme} ${role}: resolves to ${String(hex)}, theme has ${c.hex}`);
    }
  }
  return problems;
}

/* ================================================================== Figma, Starter (single-mode) layout */

/** "<Collection>.Value.tokens.json" → { collection, mode }, or undefined if the name doesn't parse. */
export function parseFigmaFileName(file: string): { collection: string; mode: string } | undefined {
  const m = /^(.+)\.([^.]+)\.tokens\.json$/.exec(file);
  return m ? { collection: m[1]!, mode: m[2]! } : undefined;
}

/** The four Starter collections for a brand, in emit order. */
export function figmaStarterCollections(name: string, density: 'comfortable' | 'compact'): string[] {
  const other = density === 'compact' ? 'comfortable' : 'compact';
  return [`${name} · Light`, `${name} · Dark`, `${name} · Size`, `${name} · Size ${other}`];
}

/**
 * Starter export checks: exactly one mode ("Value") per collection, file names parse, the expected
 * collections and nothing else, no alias anywhere, every role present as the theme's hex, every ramp step,
 * both densities (default in Size, the other alone), and valid leaf types.
 */
export function figmaStarterProblems(files: Record<string, Obj>, theme: Theme): string[] {
  const problems: string[] = [];
  const name = theme.input.name;
  const modesByCollection = new Map<string, Set<string>>();
  for (const file of Object.keys(files)) {
    const parsed = parseFigmaFileName(file);
    if (!parsed) {
      problems.push(`${file}: name does not parse as <Collection>.<Mode>.tokens.json`);
      continue;
    }
    const modes = modesByCollection.get(parsed.collection) ?? new Set();
    modes.add(parsed.mode);
    modesByCollection.set(parsed.collection, modes);
  }
  for (const [collection, modes] of modesByCollection) {
    if (modes.size !== 1 || !modes.has('Value')) problems.push(`${collection}: modes ${[...modes].join(', ')} (expected only "Value")`);
  }
  const expected = figmaStarterCollections(name, theme.input.density);
  const actual = [...modesByCollection.keys()];
  if (actual.length !== expected.length || expected.some((c) => !actual.includes(c)))
    problems.push(`collections: expected ${expected.join(' | ')}; got ${actual.join(' | ')}`);

  for (const [file, doc] of Object.entries(files)) {
    if (typeof doc.$description !== 'string' || !doc.$description.includes('Starter plan: one mode per collection'))
      problems.push(`${file}: $description lacks the Starter note`);
    for (const { path, token, type } of collectLeaves(doc)) {
      const v = token.$value;
      if (typeof v === 'string' && v.includes('{')) problems.push(`${file} ${path}: alias ${v}`);
      if (type === 'color' && (typeof v !== 'string' || !/^#[0-9a-f]{6}$/.test(v))) problems.push(`${file} ${path}: colour ${String(v)} is not #rrggbb`);
      else if (type === 'number' && typeof v !== 'number') problems.push(`${file} ${path}: number is ${typeof v}`);
      else if (type === 'string' && typeof v !== 'string') problems.push(`${file} ${path}: string is ${typeof v}`);
      else if (type !== 'color' && type !== 'number' && type !== 'string') problems.push(`${file} ${path}: $type ${String(type)}`);
    }
  }

  const get = (doc: unknown, path: string[]): unknown => path.reduce<unknown>((n, k) => (isObj(n) ? n[k] : undefined), doc);
  for (const scheme of ['light', 'dark'] as const) {
    const label = scheme === 'light' ? 'Light' : 'Dark';
    const doc = files[`${name} · ${label}.Value.tokens.json`];
    if (!doc) continue;
    const s = theme.schemes[scheme];
    for (const role of ROLES) {
      const hex = (get(doc.color, role.split('.')) as Obj | undefined)?.$value;
      if (hex !== s.roles[role].hex) problems.push(`${label} ${role}: ${String(hex)}, theme has ${s.roles[role].hex}`);
    }
    for (const [ramp, steps] of Object.entries(s.ramps)) {
      steps.forEach((hex, i) => {
        const v = (get(doc.ramp, [ramp, String(i + 1)]) as Obj | undefined)?.$value;
        if (v !== hex) problems.push(`${label} ramp.${ramp}.${i + 1}: ${String(v)} ≠ ${hex}`);
      });
    }
  }
  const [, , sizeName, otherName] = expected;
  const size = files[`${sizeName}.Value.tokens.json`];
  const other = files[`${otherName}.Value.tokens.json`];
  const otherDensity = theme.input.density === 'compact' ? 'comfortable' : 'compact';
  for (const [doc, d] of [[size, theme.input.density], [other, otherDensity]] as const) {
    if (!doc) continue;
    for (const [k, px] of Object.entries(theme.foundations.density[d])) {
      const v = (get(doc, ['density', k]) as Obj | undefined)?.$value;
      if (v !== px) problems.push(`${d} density.${k}: ${String(v)} ≠ ${px}`);
    }
  }
  if (other && Object.keys(other).some((k) => k !== '$description' && k !== 'density')) problems.push(`${otherName}: holds more than density`);
  return problems;
}
