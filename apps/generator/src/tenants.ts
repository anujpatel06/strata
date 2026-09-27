/**
 * The three reference tenants. A tenant is data, not code: brand.json (≤6 inputs) + content.json (copy).
 * The JSON is shape-checked at load so a malformed file fails loudly with the path, not as a blank preview.
 */
import { TYPE_PAIRS, isValidHex, type BrandInput } from '@strata/theme-engine';
import type { TenantContent } from './preview/content-types';

import velaBrand from '../../../tenants/vela/brand.json';
import velaContent from '../../../tenants/vela/content.json';
import harborBrand from '../../../tenants/harbor/brand.json';
import harborContent from '../../../tenants/harbor/content.json';
import qamarBrand from '../../../tenants/qamar/brand.json';
import qamarContent from '../../../tenants/qamar/content.json';

export const TENANT_IDS = ['vela', 'harbor', 'qamar'] as const;
export type TenantId = (typeof TENANT_IDS)[number];

export interface Tenant {
  id: TenantId;
  brand: BrandInput;
  content: TenantContent;
}

const NEUTRALS = ['cool', 'neutral', 'warm', 'paper'];
const SHAPES = ['sharp', 'soft', 'round'];
const DENSITIES = ['comfortable', 'compact'];

function fail(path: string, problem: string): never {
  throw new Error(`Strata: tenants/${path} ${problem}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkBrand(id: TenantId, raw: unknown): BrandInput {
  const path = `${id}/brand.json`;
  if (!isRecord(raw)) fail(path, 'must be a JSON object');
  const { name, primary, accent, neutral, shape, typePair, density } = raw;
  if (typeof name !== 'string' || !name) fail(path, '"name" must be a non-empty string');
  if (typeof primary !== 'string' || !isValidHex(primary)) fail(path, '"primary" must be a hex colour');
  if (accent !== undefined && (typeof accent !== 'string' || !isValidHex(accent)))
    fail(path, '"accent" must be a hex colour when present');
  if (typeof neutral !== 'string' || !NEUTRALS.includes(neutral)) fail(path, `"neutral" must be one of ${NEUTRALS.join(', ')}`);
  if (typeof shape !== 'string' || !SHAPES.includes(shape)) fail(path, `"shape" must be one of ${SHAPES.join(', ')}`);
  if (typeof typePair !== 'string' || !Object.hasOwn(TYPE_PAIRS, typePair))
    fail(path, `"typePair" must be one of ${Object.keys(TYPE_PAIRS).join(', ')}`);
  if (typeof density !== 'string' || !DENSITIES.includes(density)) fail(path, `"density" must be one of ${DENSITIES.join(', ')}`);
  return raw as unknown as BrandInput;
}

function checkContent(id: TenantId, raw: unknown): TenantContent {
  const path = `${id}/content.json`;
  if (!isRecord(raw)) fail(path, 'must be a JSON object');
  if (typeof raw.locale !== 'string') fail(path, '"locale" must be a BCP 47 string');
  if (raw.dir !== 'ltr' && raw.dir !== 'rtl') fail(path, '"dir" must be "ltr" or "rtl"');
  if (typeof raw.currency !== 'string') fail(path, '"currency" must be an ISO 4217 code');
  if (!isRecord(raw.product) || !isRecord(raw.overview)) fail(path, 'needs "product" and "overview" objects');
  if (!Array.isArray(raw.nav)) fail(path, '"nav" must be an array');
  return raw as unknown as TenantContent;
}

export const TENANTS: Tenant[] = [
  { id: 'vela', brand: checkBrand('vela', velaBrand), content: checkContent('vela', velaContent) },
  { id: 'harbor', brand: checkBrand('harbor', harborBrand), content: checkContent('harbor', harborContent) },
  { id: 'qamar', brand: checkBrand('qamar', qamarBrand), content: checkContent('qamar', qamarContent) },
];

export function isTenantId(value: unknown): value is TenantId {
  return typeof value === 'string' && (TENANT_IDS as readonly string[]).includes(value);
}

export function getTenant(id: TenantId): Tenant {
  // TENANTS always contains every TenantId, so the fallback is unreachable; it keeps the type non-optional.
  return TENANTS.find((t) => t.id === id) ?? (TENANTS[0] as Tenant);
}

/** One-line descriptor shown on preset cards: "Neobank · English". */
export const TENANT_TAGLINES: Record<TenantId, { industry: string; language: string; languageLang: string }> = {
  vela: { industry: 'Neobank', language: 'English', languageLang: 'en' },
  harbor: { industry: 'Insurer', language: 'English', languageLang: 'en' },
  qamar: { industry: 'Grocery & loyalty', language: 'العربية', languageLang: 'ar' },
};
