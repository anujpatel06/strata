/**
 * The contract's version and identifiers. No React, no Node APIs: safe for any runtime.
 *
 * Versioning (README "Versions"): `schemaVersion` is semver. A client supports one major. Minor versions only add
 * (a node, a prop, an enum value, an icon). Removing or renaming anything, or tightening a rule, is a major.
 */
export const SCHEMA_VERSION = '1.0.0';

export const SUPPORTED_MAJOR = Number(SCHEMA_VERSION.split('.')[0]);

/** `$id` of a schema file. URNs, so nobody expects them to resolve over the network. */
export const urn = (name: string): string => `urn:syntara:sdui:v${SUPPORTED_MAJOR}:${name}`;

export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseVersion(v: unknown): { major: number; minor: number; patch: number } | null {
  if (typeof v !== 'string') return null;
  const m = SEMVER.exec(v);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

/**
 * Where a navigate action may point: an https URL, or a path in the app that starts with one "/".
 * Everything else is rejected: javascript:, data:, vbscript:, http:, protocol-relative "//host" and "/\host"
 * (browsers read a backslash as a slash), mailto: and tel: (send an event and let the app decide), and any
 * whitespace or control character.
 */
const SAFE = '[^\\s\\\\\\x00-\\x1f\\x7f]'; // no whitespace, backslash or control character
const HOST_START = '[^\\s\\\\\\x00-\\x1f\\x7f/?#@]';
export const HREF_PATTERN = `^(?:https://${HOST_START}${SAFE}*|/(?![/\\\\])${SAFE}*)$`;

/** Images (Avatar, IconTile) load from https only. */
export const IMAGE_URL_PATTERN = `^https://${HOST_START}${SAFE}*$`;

/** Text a person must be able to read: at least one character that isn't whitespace. */
export const NON_BLANK = '\\S';

/** Event names: lower case, dot or underscore separated, e.g. "order.track" or "kyc_update". */
export const EVENT_NAME_PATTERN = '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$';

/** Node ids: used for React keys and passed back with actions. Never rendered as a DOM id. */
export const NODE_ID_PATTERN = '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$';

/** Deeper trees are cut off by the renderer and reported. JSON Schema can't limit depth, so this is renderer-only. */
export const MAX_DEPTH = 32;

/**
 * The writing direction of a locale, or undefined when the locale is missing or can't be read.
 *
 * A screen's copy has a language, and direction is a property of that language. English copy shown in a
 * right-to-left app must still run left to right, or the browser reorders it: "−₹1,240" reads "₹1,240−".
 * So the renderer sets `dir` from `screen.locale`. A document with no locale follows the client.
 * Number formatting, theme, scheme and density still belong to the client.
 */
const RTL_SCRIPTS = new Set(['Arab', 'Hebr', 'Thaa', 'Syrc', 'Nkoo', 'Adlm', 'Rohg']);
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb', 'syr', 'nqo']);
export function directionOf(locale: unknown): 'ltr' | 'rtl' | undefined {
  if (typeof locale !== 'string' || locale.trim() === '') return undefined;
  try {
    const l = new Intl.Locale(locale);
    // An explicit script wins: "pa-Arab" runs right to left, "pa" (Gurmukhi) doesn't.
    if (l.script) return RTL_SCRIPTS.has(l.script) ? 'rtl' : 'ltr';
    return RTL_LANGUAGES.has(l.language) ? 'rtl' : 'ltr';
  } catch {
    return undefined;
  }
}

/**
 * Keywords the schema files use besides JSON Schema's own. Other validators ignore x- keywords; ajv needs them
 * named. Declared here, not in validate.ts, because the build-time generator needs them and validate.ts imports
 * the validator that generator produces.
 */
export const SYNTARA_KEYWORDS = ['x-syntara', 'x-syntara-rule', 'x-syntara-message'] as const;
