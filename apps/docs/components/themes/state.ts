/**
 * /themes state + URL format. Isomorphic: the server page parses the query string with it (so links and
 * screenshots render the right theme on first paint), and the client mirrors changes back into the URL.
 *
 *   ?tenant=<preset id>          preset (brand defaults + preview locale); default: the first preset
 *   &primary=RRGGBB  &accent=RRGGBB|none
 *   &neutral=cool|neutral|warm  &shape=sharp|soft|round  &type=<type pair id>  &density=comfortable|compact
 *   &scheme=light|dark  &tab=preview|accessibility|tokens|export  &format=css|dtcg|figma|shadcn|registry
 *
 * Anything missing or invalid falls back to the preset. Only values that differ from it are written back.
 * Ported from the Phase 1 generator (apps/generator/src/url-state.ts).
 */
import {
  TYPE_PAIRS,
  isValidHex,
  normalizeHex,
  type BrandInput,
  type Density,
  type NeutralTemperature,
  type Scheme,
  type Shape,
  type TypePairId,
} from '@strata/theme-engine';

/** A starting point: a tenant's brand.json plus what the preview needs from its content.json. */
export interface ThemePreset {
  /** Folder name under tenants/, e.g. "vela". Also the registry item suffix. */
  id: string;
  /** Card title, e.g. "Vela" or "House". */
  label: string;
  brand: BrandInput;
  /** BCP 47, e.g. "ar-AE-u-nu-latn". The preview renders in it, so Qamar stays right-to-left. */
  locale: string;
  dir: 'ltr' | 'rtl';
  /** Industry in the tenant's own language, with its language tag. */
  industry: string;
  industryLang: string;
}

export const TABS = ['preview', 'accessibility', 'tokens', 'export'] as const;
export type Tab = (typeof TABS)[number];

export const FORMATS = ['css', 'dtcg', 'figma', 'shadcn', 'registry'] as const;
export type ExportFormat = (typeof FORMATS)[number];

export const NEUTRALS: readonly NeutralTemperature[] = ['cool', 'neutral', 'warm'];
export const SHAPES: readonly Shape[] = ['sharp', 'soft', 'round'];
export const DENSITIES: readonly Density[] = ['comfortable', 'compact'];
export const SCHEMES: readonly Scheme[] = ['light', 'dark'];
const TYPE_PAIR_IDS = Object.keys(TYPE_PAIRS) as TypePairId[];

export interface ThemesState {
  tenant: string;
  /** The edited brand inputs. Always valid; drafts live in the fields. */
  brand: BrandInput;
  scheme: Scheme;
  tab: Tab;
  format: ExportFormat;
}

export type ThemesAction =
  | { type: 'selectPreset'; preset: ThemePreset }
  | { type: 'reset'; preset: ThemePreset }
  | { type: 'setPrimary'; hex: string }
  | { type: 'setAccent'; hex: string | undefined }
  | { type: 'setNeutral'; neutral: NeutralTemperature }
  | { type: 'setShape'; shape: Shape }
  | { type: 'setTypePair'; typePair: TypePairId }
  | { type: 'setDensity'; density: Density }
  | { type: 'setScheme'; scheme: Scheme }
  | { type: 'setTab'; tab: Tab }
  | { type: 'setFormat'; format: ExportFormat };

/* ------------------------------------------------------------------ helpers */

export function oneOf<T extends string>(value: string | null | undefined, options: readonly T[]): T | undefined {
  return value != null && (options as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Accepts "3d45d6", "#3D45D6", "3d4". Returns lowercase #rrggbb, or undefined. */
export function parseHex(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(withHash) || !isValidHex(withHash)) return undefined;
  return normalizeHex(withHash);
}

export function isTypePairId(value: string | null | undefined): value is TypePairId {
  return oneOf(value, TYPE_PAIR_IDS) !== undefined;
}

/** A preset's brand with normalised hex values (and no accent key when it has none). */
export function presetBrand(preset: ThemePreset): BrandInput {
  const copy: BrandInput = { ...preset.brand, primary: parseHex(preset.brand.primary) ?? preset.brand.primary };
  const accent = parseHex(preset.brand.accent);
  if (accent) copy.accent = accent;
  else delete copy.accent;
  return copy;
}

export function findPreset(presets: readonly ThemePreset[], id: string | null | undefined): ThemePreset {
  const fallback = presets[0];
  if (!fallback) throw new Error('Strata /themes: no presets found under tenants/');
  return presets.find((p) => p.id === id) ?? fallback;
}

/** Inputs that differ from the preset. Drives the "edited" state, Reset and URL minimisation. */
export function brandDiff(brand: BrandInput, preset: ThemePreset): Array<keyof BrandInput> {
  const base = presetBrand(preset);
  const diff: Array<keyof BrandInput> = [];
  if (parseHex(brand.primary) !== base.primary) diff.push('primary');
  if (parseHex(brand.accent) !== base.accent) diff.push('accent');
  if (brand.neutral !== base.neutral) diff.push('neutral');
  if (brand.shape !== base.shape) diff.push('shape');
  if (brand.typePair !== base.typePair) diff.push('typePair');
  if (brand.density !== base.density) diff.push('density');
  return diff;
}

/* ------------------------------------------------------------------ read / write */

type Query = Pick<URLSearchParams, 'get'>;

/** Next's `searchParams` object → URLSearchParams (first value wins for repeated keys). */
export function toQuery(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first != null) q.set(key, first);
  }
  return q;
}

export function readState(q: Query, presets: readonly ThemePreset[]): ThemesState {
  const preset = findPreset(presets, q.get('tenant'));
  const brand = presetBrand(preset);

  const primary = parseHex(q.get('primary'));
  if (primary) brand.primary = primary;

  const accentParam = q.get('accent');
  if (accentParam === 'none') delete brand.accent;
  else {
    const accent = parseHex(accentParam);
    if (accent) brand.accent = accent;
  }

  brand.neutral = oneOf(q.get('neutral'), NEUTRALS) ?? brand.neutral;
  brand.shape = oneOf(q.get('shape'), SHAPES) ?? brand.shape;
  brand.typePair = oneOf(q.get('type'), TYPE_PAIR_IDS) ?? brand.typePair;
  brand.density = oneOf(q.get('density'), DENSITIES) ?? brand.density;

  return {
    tenant: preset.id,
    brand,
    scheme: oneOf(q.get('scheme'), SCHEMES) ?? 'light',
    tab: oneOf(q.get('tab'), TABS) ?? 'preview',
    format: oneOf(q.get('format'), FORMATS) ?? 'css',
  };
}

const OWN_KEYS = ['tenant', 'scheme', 'tab', 'format', 'primary', 'accent', 'neutral', 'shape', 'type', 'density'];

/** State → query string (without "?"). Keeps unrelated params that were already there. */
export function toSearch(state: ThemesState, presets: readonly ThemePreset[], existing = ''): string {
  const q = new URLSearchParams(existing);
  for (const key of OWN_KEYS) q.delete(key);

  q.set('tenant', state.tenant);
  const preset = findPreset(presets, state.tenant);
  const { brand } = state;
  for (const field of brandDiff(brand, preset)) {
    switch (field) {
      case 'primary':
        q.set('primary', (parseHex(brand.primary) ?? brand.primary).slice(1));
        break;
      case 'accent': {
        const accent = parseHex(brand.accent);
        q.set('accent', accent ? accent.slice(1) : 'none');
        break;
      }
      case 'neutral':
        q.set('neutral', brand.neutral);
        break;
      case 'shape':
        q.set('shape', brand.shape);
        break;
      case 'typePair':
        q.set('type', brand.typePair);
        break;
      case 'density':
        q.set('density', brand.density);
        break;
      default:
        break;
    }
  }
  if (state.scheme !== 'light') q.set('scheme', state.scheme);
  if (state.tab !== 'preview') q.set('tab', state.tab);
  if (state.format !== 'css') q.set('format', state.format);
  return q.toString();
}

/* ------------------------------------------------------------------ reducer */

export function reducer(state: ThemesState, action: ThemesAction): ThemesState {
  switch (action.type) {
    case 'selectPreset':
      return { ...state, tenant: action.preset.id, brand: presetBrand(action.preset) };
    case 'reset':
      return { ...state, brand: presetBrand(action.preset) };
    case 'setPrimary': {
      const hex = parseHex(action.hex);
      return hex && hex !== state.brand.primary ? { ...state, brand: { ...state.brand, primary: hex } } : state;
    }
    case 'setAccent': {
      const hex = parseHex(action.hex);
      if (hex === state.brand.accent) return state;
      const brand = { ...state.brand };
      if (hex) brand.accent = hex;
      else delete brand.accent;
      return { ...state, brand };
    }
    case 'setNeutral':
      return { ...state, brand: { ...state.brand, neutral: action.neutral } };
    case 'setShape':
      return { ...state, brand: { ...state.brand, shape: action.shape } };
    case 'setTypePair':
      return { ...state, brand: { ...state.brand, typePair: action.typePair } };
    case 'setDensity':
      return { ...state, brand: { ...state.brand, density: action.density } };
    case 'setScheme':
      return { ...state, scheme: action.scheme };
    case 'setTab':
      return { ...state, tab: action.tab };
    case 'setFormat':
      return { ...state, format: action.format };
    default:
      return state;
  }
}
