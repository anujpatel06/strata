/**
 * App state + URL sync. A generated brand is shareable as a link, and screenshots are taken via these params,
 * so the state is read synchronously from the URL before first render.
 *
 *   ?tenant=vela|harbor|qamar      preset (brand defaults + preview copy)
 *   &scheme=light|dark             preview scheme
 *   &tab=preview|accessibility|tokens
 *   &format=css|dtcg|figma         export format on the Tokens tab
 *   &primary=RRGGBB  &accent=RRGGBB|none
 *   &neutral=cool|neutral|warm  &shape=sharp|soft|round  &type=<type pair id>  &density=comfortable|compact
 *
 * Anything missing or invalid falls back to the tenant preset. Only values that differ from the preset are written.
 */
import { useEffect, useReducer, type Dispatch } from 'react';
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
import { getTenant, isTenantId, type TenantId } from './tenants';

export const TABS = ['preview', 'accessibility', 'tokens'] as const;
export type Tab = (typeof TABS)[number];

export const EXPORT_FORMATS = ['css', 'dtcg', 'figma'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const NEUTRALS: readonly NeutralTemperature[] = ['cool', 'neutral', 'warm'];
export const SHAPES: readonly Shape[] = ['sharp', 'soft', 'round'];
export const DENSITIES: readonly Density[] = ['comfortable', 'compact'];
const SCHEMES: readonly Scheme[] = ['light', 'dark'];

export interface AppState {
  tenant: TenantId;
  /** The edited copy of the brand inputs. Always holds valid values; drafts live in the input components. */
  brand: BrandInput;
  scheme: Scheme;
  tab: Tab;
  format: ExportFormat;
}

export type AppAction =
  | { type: 'selectTenant'; tenant: TenantId }
  | { type: 'resetBrand' }
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

function oneOf<T extends string>(value: string | null, options: readonly T[]): T | undefined {
  return value !== null && (options as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Accepts "3d45d6", "#3D45D6", "3d4". Returns lowercase #rrggbb or undefined. */
export function parseHex(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(withHash) || !isValidHex(withHash)) return undefined;
  return normalizeHex(withHash);
}

const TYPE_PAIR_IDS = Object.keys(TYPE_PAIRS) as TypePairId[];

function presetBrand(tenant: TenantId): BrandInput {
  const brand = getTenant(tenant).brand;
  const copy: BrandInput = { ...brand, primary: parseHex(brand.primary) ?? brand.primary };
  const accent = parseHex(brand.accent);
  if (accent) copy.accent = accent;
  else delete copy.accent;
  return copy;
}

/** Field-by-field comparison with the tenant preset; drives the "edited" tag and URL minimisation. */
export function brandDiff(brand: BrandInput, tenant: TenantId): Array<keyof BrandInput> {
  const preset = presetBrand(tenant);
  const diff: Array<keyof BrandInput> = [];
  if (parseHex(brand.primary) !== preset.primary) diff.push('primary');
  if (parseHex(brand.accent) !== preset.accent) diff.push('accent');
  if (brand.neutral !== preset.neutral) diff.push('neutral');
  if (brand.shape !== preset.shape) diff.push('shape');
  if (brand.typePair !== preset.typePair) diff.push('typePair');
  if (brand.density !== preset.density) diff.push('density');
  return diff;
}

/* ------------------------------------------------------------------ read / write */

const OWN_KEYS = ['tenant', 'scheme', 'tab', 'format', 'primary', 'accent', 'neutral', 'shape', 'type', 'density'];

export function readState(search: string): AppState {
  const q = new URLSearchParams(search);
  const tenant = isTenantId(q.get('tenant')) ? (q.get('tenant') as TenantId) : 'vela';
  const brand = presetBrand(tenant);

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
    tenant,
    brand,
    scheme: oneOf(q.get('scheme'), SCHEMES) ?? 'light',
    tab: oneOf(q.get('tab'), TABS) ?? 'preview',
    format: oneOf(q.get('format'), EXPORT_FORMATS) ?? 'css',
  };
}

export function toSearch(state: AppState, existing = ''): string {
  const q = new URLSearchParams(existing);
  for (const key of OWN_KEYS) q.delete(key);

  q.set('tenant', state.tenant);
  if (state.scheme !== 'light') q.set('scheme', state.scheme);
  if (state.tab !== 'preview') q.set('tab', state.tab);
  if (state.format !== 'css') q.set('format', state.format);

  const { brand } = state;
  for (const field of brandDiff(brand, state.tenant)) {
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
  return q.toString();
}

function readInitialState(): AppState {
  try {
    // Hosted demos may only pass a bare #token (no query string), so `#qamar` also picks the tenant.
    const q = new URLSearchParams(window.location.search);
    const hashTenant = window.location.hash.replace(/^#/, '');
    if (!q.has('tenant') && isTenantId(hashTenant)) q.set('tenant', hashTenant);
    return readState(q.toString());
  } catch {
    return readState('');
  }
}

function writeUrl(state: AppState): void {
  try {
    const { pathname, search, hash } = window.location;
    const next = toSearch(state, search);
    if (`?${next}` === search) return;
    window.history.replaceState(window.history.state, '', `${pathname}?${next}${hash}`);
  } catch {
    // Sandboxed iframes (opaque origins) can refuse history access. The app still works; the link just won't update.
  }
}

/* ------------------------------------------------------------------ reducer */

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'selectTenant':
      return { ...state, tenant: action.tenant, brand: presetBrand(action.tenant) };
    case 'resetBrand':
      return { ...state, brand: presetBrand(state.tenant) };
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

/** App state initialised from the URL on first render and mirrored back with history.replaceState. */
export function useAppState(): [AppState, Dispatch<AppAction>] {
  const [state, dispatch] = useReducer(reducer, undefined, readInitialState);
  useEffect(() => writeUrl(state), [state]);
  return [state, dispatch];
}
