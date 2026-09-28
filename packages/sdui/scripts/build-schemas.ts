/**
 * Builds the wire contract from meta.json and the wire rules (src/wire.ts). Pure: no file writes.
 * `pnpm --filter @syntara/sdui generate` writes the result to schema/ (scripts/generate.ts), and
 * test/generate.test.ts regenerates it in memory and fails if the committed files are stale.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComponentMeta, Deprecation, PropDoc } from '../../react/meta/schema';
import {
  EVENT_NAME_PATTERN,
  HREF_PATTERN,
  IMAGE_URL_PATTERN,
  NODE_ID_PATTERN,
  NON_BLANK,
  SCHEMA_VERSION,
  SUPPORTED_MAJOR,
  parseVersion,
  urn,
} from '../src/contract';
import {
  EXCLUDED_EVERYWHERE,
  EXCLUDED_NODES,
  NODES,
  OUT_OF_SLICE,
  type ChildrenKind,
  type NodeSpec,
  type PropRule,
} from '../src/wire';
import type { Manifest, ManifestNode, ManifestProp } from '../src/manifest-types';

type Json = Record<string, unknown>;
type Literal = string | number | boolean;

const here = path.dirname(fileURLToPath(import.meta.url));
export const PKG_DIR = path.resolve(here, '..');
export const REPO_ROOT = path.resolve(PKG_DIR, '../..');
export const META_DIR = path.join(REPO_ROOT, 'packages/react/meta');
export const SCHEMA_DIR = path.join(PKG_DIR, 'schema');
const DRAFT = 'https://json-schema.org/draft/2020-12/schema';

export interface Inputs {
  metas: Map<string, ComponentMeta>;
  iconNames: string[];
  gapTokens: string[];
  /** The committed manifest, if any: decides which deprecated values stay (see `deprecationPolicy`). */
  previous?: Manifest;
  schemaVersion?: string;
}

/* ------------------------------------------------------------------ *
 * Inputs from disk
 * ------------------------------------------------------------------ */

export function readMetas(): Map<string, ComponentMeta> {
  const out = new Map<string, ComponentMeta>();
  for (const file of readdirSync(META_DIR).filter((f) => f.endsWith('.meta.json')).sort()) {
    const meta = JSON.parse(readFileSync(path.join(META_DIR, file), 'utf8')) as ComponentMeta;
    out.set(meta.name, meta);
  }
  return out;
}

/** Icon names from the real exports of @syntara/icons: every export that carries an `iconName`. */
export function iconNamesFrom(mod: Record<string, unknown>): string[] {
  const names = Object.values(mod)
    .filter((v): v is { iconName: string } => typeof v === 'function' && typeof (v as { iconName?: unknown }).iconName === 'string')
    .map((v) => v.iconName);
  return [...new Set(names)].sort();
}

/**
 * Gap tokens from the theme engine's token contract (packages/theme-engine/src/types.ts): every `space` key as
 * `space-<key>`, plus `section-gap`, which follows the client's density.
 */
export function readGapTokens(): string[] {
  const source = readFileSync(path.join(REPO_ROOT, 'packages/theme-engine/src/types.ts'), 'utf8');
  const block = /\bspace:\s*\{([^}]*)\}/.exec(source);
  if (!block?.[1]) throw new Error('theme-engine types.ts: no `space: { … }` block found; the gap tokens come from it.');
  const keys = [...block[1].matchAll(/'(\d+)'\s*:/g)].map((m) => m[1]!).sort((a, b) => Number(a) - Number(b));
  if (keys.length === 0) throw new Error('theme-engine types.ts: the space block has no keys.');
  if (!source.includes('--syntara-section-gap')) throw new Error('theme-engine types.ts no longer lists --syntara-section-gap.');
  return [...keys.map((k) => `space-${k}`), 'section-gap'];
}

export function readPrevious(): Manifest | undefined {
  const file = path.join(SCHEMA_DIR, 'manifest.json');
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Manifest) : undefined;
}

/* ------------------------------------------------------------------ *
 * Meta type strings → JSON Schema
 * ------------------------------------------------------------------ */

/** Splits a TypeScript type on top-level `|`. */
function splitUnion(type: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of type) {
    if ('(<{['.includes(ch)) depth++;
    if (')>}]'.includes(ch)) depth--;
    if (ch === '|' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/** A literal written as in TypeScript: 'x', 12, true. */
export function parseLiteral(text: string): Literal | undefined {
  const t = text.trim();
  const q = /^'([^']*)'$/.exec(t) ?? /^"([^"]*)"$/.exec(t);
  if (q) return q[1];
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t === 'true') return true;
  if (t === 'false') return false;
  return undefined;
}

export interface Derived {
  schema: Json;
  kind: ManifestProp['kind'];
  values?: Literal[];
}

/**
 * The safe derivations, and only these: boolean, number, string, number[] and unions of literals (optionally with
 * boolean). Anything else returns null, and the prop needs a rule in src/wire.ts.
 */
export function deriveType(type: string): Derived | null {
  const t = type.trim();
  if (t === 'boolean') return { schema: { type: 'boolean' }, kind: 'boolean' };
  if (t === 'number') return { schema: { type: 'number' }, kind: 'number' };
  if (t === 'string') return { schema: { type: 'string' }, kind: 'string' };
  if (t === 'number[]') return { schema: { type: 'array', items: { type: 'number' } }, kind: 'numbers' };
  const parts = splitUnion(t);
  const values: Literal[] = [];
  for (const part of parts) {
    if (part === 'boolean') values.push(true, false);
    else {
      const lit = parseLiteral(part);
      if (lit === undefined) return null;
      values.push(lit);
    }
  }
  if (values.length === 0) return null;
  const unique = [...new Set(values)];
  if (unique.every((v) => typeof v === 'string')) return { schema: { type: 'string', enum: unique }, kind: 'enum', values: unique };
  if (unique.every((v) => typeof v === 'number')) {
    const integer = unique.every((v) => Number.isInteger(v));
    return { schema: { type: integer ? 'integer' : 'number', enum: unique }, kind: 'enum', values: unique };
  }
  return { schema: { enum: unique }, kind: 'enum', values: unique };
}

/* ------------------------------------------------------------------ *
 * Deprecations (GOVERNANCE.md §5)
 * ------------------------------------------------------------------ */

export interface PolicyResult {
  keep: Literal[];
  deprecated: Array<{ value: Literal; record: Deprecation }>;
  excluded: Array<{ value: Literal; reason: string; replacement: string }>;
}

/**
 * How a deprecation in meta reaches the wire.
 * - A value deprecated before it ever reached this major of the contract is left out: a new contract doesn't start
 *   with deprecated API.
 * - A value that is already in this major (it's in the committed manifest) stays, marked deprecated, until the next
 *   major removes it. Clients keep accepting it, and the renderer reports it.
 * - A new major drops every deprecated value.
 */
export function deprecationPolicy(
  node: string,
  prop: string,
  values: Literal[],
  deprecations: Array<Deprecation & { value: string }> | undefined,
  previous: Manifest | undefined,
  schemaVersion: string,
): PolicyResult {
  const out: PolicyResult = { keep: [], deprecated: [], excluded: [] };
  const sameMajor = previous !== undefined && parseVersion(previous.schemaVersion)?.major === parseVersion(schemaVersion)?.major;
  const before = sameMajor ? previous.nodes[node]?.props[prop] : undefined;
  const hadBefore = (v: Literal) =>
    !!before && ((before.values ?? []).includes(v) || (before.deprecatedValues ?? []).some((d) => d.value === v));
  for (const v of values) {
    const record = deprecations?.find((d) => parseLiteral(d.value) === v);
    if (!record) out.keep.push(v);
    else if (hadBefore(v)) out.deprecated.push({ value: v, record });
    else
      out.excluded.push({
        value: v,
        replacement: record.replacement,
        reason: `Deprecated in @syntara/react ${record.since} (use ${record.replacement}; RFC ${record.rfc}). A new contract doesn't start with deprecated API.`,
      });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Building
 * ------------------------------------------------------------------ */

const defsRef = (name: string) => `${urn('defs')}#/$defs/${name}`;
const nodeFile = (type: string) => `nodes/${type.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}.schema.json`;
const nodeRef = (type: string) => urn(`node:${type}`);

/** A node union: a discriminated oneOf over the listed node types. */
function nodeUnion(types: string[], description?: string): Json {
  return {
    ...(description ? { description } : {}),
    type: 'object',
    required: ['type'],
    properties: { type: { type: 'string' } },
    discriminator: { propertyName: 'type' },
    oneOf: types.map((t) => ({ $ref: nodeRef(t) })),
  };
}

function resolveLocalRefs(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(resolveLocalRefs);
  if (schema && typeof schema === 'object') {
    const out: Json = {};
    for (const [k, v] of Object.entries(schema)) {
      out[k] = k === '$ref' && typeof v === 'string' && v.startsWith('#/$defs/') ? defsRef(v.slice('#/$defs/'.length)) : resolveLocalRefs(v);
    }
    return out;
  }
  return schema;
}

const CHILDREN_NOTE: Record<ChildrenKind['kind'], string> = {
  none: '',
  text: 'On the wire: a string.',
  inline: 'On the wire: a string, or an array of strings and { icon } references in reading order. Icons are decorative.',
  icon: 'On the wire: one { icon } reference.',
  nodes: 'On the wire: an array of nodes, in order.',
};

function childrenSchema(kind: ChildrenKind, metaDescription: string | undefined): Json | null {
  const only = kind.kind === 'nodes' && kind.only ? ` Only ${kind.only.join(', ')}.` : '';
  const description = [metaDescription, CHILDREN_NOTE[kind.kind] + only].filter(Boolean).join(' ');
  const d = description ? { description } : {};
  switch (kind.kind) {
    case 'none':
      return null;
    case 'text':
      return { ...d, type: 'string' };
    case 'inline':
      return { ...d, $ref: defsRef('InlineContent') };
    case 'icon':
      return { ...d, $ref: defsRef('IconRef') };
    case 'nodes':
      return {
        ...d,
        type: 'array',
        items: kind.only ? nodeUnion(kind.only) : { $ref: `${urn('screen')}#/$defs/Node` },
      };
  }
}

interface BuiltNode {
  schema: Json;
  manifest: ManifestNode;
}

function buildNode(spec: NodeSpec, inputs: Inputs, version: string): BuiltNode {
  const meta = spec.meta ? inputs.metas.get(spec.meta) : undefined;
  if (spec.meta && !meta) throw new Error(`${spec.type}: meta "${spec.meta}" not found in packages/react/meta.`);
  if (meta && !meta.exports.includes(spec.type)) throw new Error(`${spec.type}: not an export of ${spec.meta} (meta.exports).`);

  const metaProps: PropDoc[] = meta ? meta.props.filter((p) => p.component === spec.type) : [];
  const rules = spec.props ?? {};
  for (const name of Object.keys(rules)) {
    const known = metaProps.some((p) => p.name === name) || EXCLUDED_EVERYWHERE[name] !== undefined;
    const exampleOnly = rules[name]?.as === 'exclude' || rules[name]?.as === 'action' || rules[name]?.as === 'children';
    if (!known && !exampleOnly) throw new Error(`${spec.type}: wire rule for "${name}", which meta doesn't list.`);
  }

  const properties: Json = {};
  const required: string[] = [];
  const manifestProps: Record<string, ManifestProp> = {};
  const excluded: ManifestNode['excluded'] = [];
  const slots: Json = {};
  const manifestSlots: ManifestNode['slots'] = {};
  const actionFrom: string[] = [];
  let childrenDescription: string | undefined;

  for (const prop of metaProps) {
    const rule: PropRule | undefined =
      rules[prop.name] ??
      (EXCLUDED_EVERYWHERE[prop.name] ? { as: 'exclude', reason: EXCLUDED_EVERYWHERE[prop.name]! } : undefined);
    const as = rule?.as ?? 'derive';
    if (prop.deprecated) {
      // A whole deprecated prop follows the same policy as a value: out unless this major already had it.
      const had = inputs.previous?.nodes[spec.type]?.props[prop.name] !== undefined;
      if (!had) {
        excluded.push({ prop: prop.name, reason: `Deprecated in @syntara/react ${prop.deprecated.since} (use ${prop.deprecated.replacement}). A new contract doesn't start with deprecated API.` });
        continue;
      }
    }
    if (as === 'exclude') {
      excluded.push({ prop: prop.name, reason: (rule as { reason: string }).reason });
      continue;
    }
    if (as === 'action') {
      actionFrom.push(prop.name);
      continue;
    }
    if (as === 'children') {
      childrenDescription = prop.description;
      continue;
    }
    if (as === 'slot') {
      const only = (rule as { only: string[] }).only;
      slots[prop.name] = nodeUnion(only, prop.description);
      manifestSlots[prop.name] = { from: prop.name, only };
      continue;
    }

    let wireName = prop.name;
    let schema: Json;
    let entry: ManifestProp;
    const description = prop.description;
    if (as === 'text') {
      schema = { type: 'string' };
      entry = { from: prop.name, kind: 'text' };
    } else if (as === 'icon') {
      const orFalse = (rule as { orFalse?: boolean }).orFalse;
      schema = orFalse
        ? {
            anyOf: [{ $ref: defsRef('IconRef') }, { const: false }],
            'x-syntara-message': 'must be { "icon": "<name>" } or false (no icon).',
          }
        : { $ref: defsRef('IconRef') };
      entry = { from: prop.name, kind: orFalse ? 'icon-or-false' : 'icon' };
    } else if (as === 'image-url') {
      schema = { $ref: defsRef('ImageUrl') };
      entry = { from: prop.name, kind: 'image-url' };
    } else {
      const derived = deriveType(prop.type);
      if (!derived)
        throw new Error(
          `${spec.type}.${prop.name}: meta type "${prop.type}" can't be derived safely. Add a rule for it in src/wire.ts (text, icon, slot, action or exclude).`,
        );
      const r = (rule ?? { as: 'derive' }) as Extract<PropRule, { as: 'derive' }>;
      wireName = r.rename ?? prop.name;
      schema = { ...derived.schema };
      entry = { from: prop.name, kind: derived.kind };
      if (r.pattern) schema.pattern = r.pattern;
      if (r.minItems) schema.minItems = r.minItems;
      if (derived.values) {
        const policy = deprecationPolicy(spec.type, wireName, derived.values, prop.deprecatedValues, inputs.previous, version);
        for (const x of policy.excluded) excluded.push({ prop: prop.name, value: x.value, reason: x.reason, replacement: x.replacement });
        const base = { ...schema, enum: policy.keep };
        schema = policy.deprecated.length
          ? {
              anyOf: [
                base,
                ...policy.deprecated.map((d) => ({
                  const: d.value,
                  deprecated: true,
                  description: `Deprecated since @syntara/react ${d.record.since}; removed in the next major of this schema. Use ${d.record.replacement}.`,
                })),
              ],
            }
          : base;
        entry.values = policy.keep;
        if (policy.deprecated.length)
          entry.deprecatedValues = policy.deprecated.map((d) => ({ value: d.value, replacement: d.record.replacement }));
      }
    }
    const def = prop.default !== undefined ? parseLiteral(prop.default) : undefined;
    const defaultOk =
      def !== undefined &&
      (entry.values ? entry.values.includes(def) : (entry.kind === 'boolean' && typeof def === 'boolean') || (entry.kind === 'number' && typeof def === 'number') || ((entry.kind === 'string' || entry.kind === 'text') && typeof def === 'string'));
    properties[wireName] = { description, ...schema, ...(defaultOk ? { default: def } : {}) };
    if (defaultOk) entry.default = def;
    if (prop.required) {
      required.push(wireName);
      entry.required = true;
    }
    manifestProps[wireName] = entry;
  }

  for (const extra of spec.extraProps ?? []) {
    const schema = resolveLocalRefs(extra.schema) as Json;
    properties[extra.name] = { description: extra.description, ...schema };
    const e = extra.schema as { enum?: Literal[]; type?: string; default?: Literal; $ref?: string };
    const values = e.enum ?? (e.$ref === '#/$defs/Gap' ? inputs.gapTokens : undefined);
    manifestProps[extra.name] = {
      from: extra.from ?? extra.name,
      kind: values ? 'enum' : e.type === 'boolean' ? 'boolean' : e.type === 'number' ? 'number' : 'string',
      ...(values ? { values } : {}),
      ...(e.default !== undefined ? { default: e.default } : {}),
      source: extra.source,
    };
  }

  // Props in the wire rules that meta doesn't list (e.g. Link rel): recorded as exclusions for the examples check.
  for (const [name, rule] of Object.entries(rules)) {
    if (metaProps.some((p) => p.name === name)) continue;
    if (rule.as === 'exclude') excluded.push({ prop: name, reason: rule.reason });
    if (rule.as === 'action' && !actionFrom.includes(name)) actionFrom.push(name);
  }

  if (spec.action && actionFrom.length === 0 && spec.meta)
    throw new Error(`${spec.type}: takes an action but no meta prop maps to it.`);

  const nodeProps: Json = {
    type: { const: spec.type },
    id: { $ref: defsRef('NodeId') },
  };
  const hasProps = Object.keys(properties).length > 0;
  if (hasProps)
    nodeProps.props = {
      type: 'object',
      additionalProperties: false,
      properties,
      ...(required.length ? { required } : {}),
    };
  const children = childrenSchema(spec.children, childrenDescription ?? metaProps.find((p) => p.name === 'children')?.description);
  if (children) nodeProps.children = children;
  if (Object.keys(slots).length) nodeProps.slots = { type: 'object', additionalProperties: false, properties: slots };
  if (spec.action)
    nodeProps.action = {
      description: 'What happens on press. The renderer calls the host app\'s onAction with it.',
      $ref: defsRef(spec.action.kinds.length === 1 ? 'NavigateAction' : 'Action'),
    };
  nodeProps.fallback = {
    description: 'Rendered instead of this node by a client that doesn\'t know its type. Must be a node that client knows.',
    $ref: `${urn('screen')}#/$defs/Node`,
  };

  const nodeRequired = ['type'];
  if (required.length) nodeRequired.push('props');
  if ('required' in spec.children && spec.children.required) nodeRequired.push('children');
  if (spec.action?.required) nodeRequired.push('action');

  const maturity = meta?.maturity ?? 'alpha';
  const description = spec.description ?? meta?.description ?? '';
  const schema: Json = {
    $schema: DRAFT,
    $id: nodeRef(spec.type),
    title: spec.type,
    description,
    'x-syntara': {
      node: spec.type,
      component: spec.meta ?? null,
      export: spec.meta ? spec.type : null,
      maturity,
      schemaVersion: version,
      source: spec.meta ? 'meta' : 'sdui',
    },
    type: 'object',
    required: nodeRequired,
    properties: nodeProps,
    additionalProperties: false,
    ...(spec.rules?.length
      ? { allOf: spec.rules.map((r) => ({ 'x-syntara-rule': { id: r.id, message: r.message }, ...r.schema })) }
      : {}),
  };

  const manifest: ManifestNode = {
    source: spec.meta ? 'meta' : 'sdui',
    component: spec.meta ?? null,
    maturity,
    ...(spec.part ? { part: true } : {}),
    description,
    props: manifestProps,
    children: { kind: spec.children.kind, ...('required' in spec.children && spec.children.required ? { required: true } : {}), ...(spec.children.kind === 'nodes' && spec.children.only ? { only: spec.children.only } : {}) },
    slots: manifestSlots,
    ...(spec.action ? { action: { kinds: spec.action.kinds, required: spec.action.required, from: actionFrom } } : {}),
    rules: (spec.rules ?? []).map((r) => ({ id: r.id, message: r.message })),
    excluded,
  };
  return { schema, manifest };
}

function buildDefs(inputs: Inputs, version: string): Json {
  return {
    $schema: DRAFT,
    $id: urn('defs'),
    title: 'Syntara SDUI shared definitions',
    description: 'Actions, icons, links, images and layout tokens shared by every node schema.',
    'x-syntara': { schemaVersion: version, source: 'sdui' },
    $defs: {
      NodeId: {
        description: 'Identifies a node among its siblings (a stable React key) and is passed back with its actions. Never rendered as a DOM id.',
        type: 'string',
        pattern: NODE_ID_PATTERN,
      },
      IconName: {
        description: 'An icon from @syntara/icons, by its kebab-case name. Generated from the package\'s exports.',
        type: 'string',
        enum: inputs.iconNames,
      },
      IconRef: {
        description: 'An icon. Always decorative: the text next to it carries the meaning.',
        type: 'object',
        required: ['icon'],
        properties: { icon: { $ref: '#/$defs/IconName' } },
        additionalProperties: false,
      },
      InlineContent: {
        description: 'A label: a string, or an array of strings and icons in reading order. Strings are always rendered as text, never as markup.',
        anyOf: [
          { type: 'string' },
          {
            type: 'array',
            minItems: 1,
            items: {
              anyOf: [{ type: 'string' }, { $ref: '#/$defs/IconRef' }],
              'x-syntara-message': 'must be a string or { "icon": "<name>" }.',
            },
          },
        ],
        'x-syntara-message': 'must be a string, or a non-empty array of strings and { "icon": "<name>" } references.',
      },
      Href: {
        description: 'An https:// URL, or a path in the app that starts with a single "/".',
        type: 'string',
        pattern: HREF_PATTERN,
        'x-syntara-message':
          'must be an https:// URL or an app path that starts with one "/". javascript:, data:, http:, mailto:, tel: and "//host" links are rejected; send an event action for anything the app should decide.',
      },
      ImageUrl: {
        description: 'An image URL. https only.',
        type: 'string',
        pattern: IMAGE_URL_PATTERN,
        'x-syntara-message': 'must be an https:// URL. data:, http: and relative image URLs are rejected.',
      },
      NavigateAction: {
        description: 'Go to a destination. The host app decides how (router, in-app browser, system browser).',
        type: 'object',
        required: ['type', 'href'],
        properties: { type: { const: 'navigate' }, href: { $ref: '#/$defs/Href' } },
        additionalProperties: false,
      },
      EventAction: {
        description: 'Tell the host app that something happened. The app decides what to do.',
        type: 'object',
        required: ['type', 'name'],
        properties: {
          type: { const: 'event' },
          name: { type: 'string', pattern: EVENT_NAME_PATTERN, description: 'e.g. "order.track".' },
          payload: {
            description: 'Flat data for the handler: strings, numbers, booleans and null. Never rendered.',
            type: 'object',
            maxProperties: 32,
            additionalProperties: {
              anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }],
            },
          },
        },
        additionalProperties: false,
      },
      Action: {
        type: 'object',
        required: ['type'],
        properties: { type: { type: 'string' } },
        discriminator: { propertyName: 'type' },
        oneOf: [{ $ref: '#/$defs/NavigateAction' }, { $ref: '#/$defs/EventAction' }],
      },
      Gap: {
        description: 'A space token (--syntara-space-*), or section-gap, which follows the client\'s density.',
        type: 'string',
        enum: inputs.gapTokens,
      },
    },
  };
}

function buildScreen(topLevel: string[], version: string): Json {
  return {
    $schema: DRAFT,
    $id: urn('screen'),
    title: 'Syntara screen',
    description:
      'A screen sent from a server and drawn with Syntara components. It has no theme, tenant, scheme or density: those belong to the client that renders it.',
    'x-syntara': { schemaVersion: version, source: 'sdui' },
    type: 'object',
    required: ['schemaVersion', 'screen', 'root'],
    properties: {
      schemaVersion: {
        description: `The schema version the document was written for. semver; this schema accepts major ${SUPPORTED_MAJOR}.`,
        type: 'string',
        pattern: `^${SUPPORTED_MAJOR}\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$`,
        'x-syntara-message': `must be a ${SUPPORTED_MAJOR}.x.y version. A client supports one major; a document for another major is shown as the screen fallback.`,
      },
      screen: {
        type: 'object',
        required: ['id', 'title'],
        properties: {
          id: { $ref: defsRef('NodeId') },
          title: {
            description: "The screen's name, for the host app's title bar or document title. The renderer doesn't draw it.",
            type: 'string',
            pattern: NON_BLANK,
          },
          locale: {
            description: 'The language the copy is written in (BCP 47), set as lang on the screen. Formatting and direction still follow the client.',
            type: 'string',
            pattern: '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$',
          },
        },
        additionalProperties: false,
      },
      root: { $ref: '#/$defs/Node' },
    },
    additionalProperties: false,
    $defs: { Node: nodeUnion(topLevel, 'Any node that can stand on its own. Card parts only go inside a Card.') },
  };
}

/** Everything the manifest compares across versions: node → prop → values. */
function surface(m: Manifest): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const [node, n] of Object.entries(m.nodes)) {
    const s = new Set<string>();
    for (const [p, def] of Object.entries(n.props)) {
      s.add(`prop ${p}`);
      for (const v of def.values ?? []) s.add(`prop ${p} = ${JSON.stringify(v)}`);
      for (const d of def.deprecatedValues ?? []) s.add(`prop ${p} = ${JSON.stringify(d.value)}`);
    }
    for (const slot of Object.keys(n.slots)) s.add(`slot ${slot}`);
    out.set(node, s);
  }
  out.set('(icons)', new Set(m.icons));
  return out;
}

/**
 * "Minor versions only add": within one major, nothing that was on the wire may disappear, and any addition needs a
 * newer version than the committed one. Returns the problems (empty = fine).
 */
export function evolutionProblems(previous: Manifest | undefined, next: Manifest): string[] {
  if (!previous) return [];
  const a = parseVersion(previous.schemaVersion);
  const b = parseVersion(next.schemaVersion);
  if (!a || !b) return ['schemaVersion must be semver'];
  if (b.major !== a.major) return b.major > a.major ? [] : [`schemaVersion went backwards: ${previous.schemaVersion} → ${next.schemaVersion}`];
  const prev = surface(previous);
  const cur = surface(next);
  const removed: string[] = [];
  const added: string[] = [];
  for (const [node, items] of prev) {
    const now = cur.get(node);
    if (!now) removed.push(`node ${node}`);
    else for (const i of items) if (!now.has(i)) removed.push(`${node}: ${i}`);
  }
  for (const [node, items] of cur) {
    const before = prev.get(node);
    if (!before) added.push(`node ${node}`);
    else for (const i of items) if (!before.has(i)) added.push(`${node}: ${i}`);
  }
  const problems: string[] = [];
  if (removed.length)
    problems.push(`Removing from the wire is a major change (${previous.schemaVersion} → ${a.major + 1}.0.0). Removed: ${removed.join('; ')}`);
  const newer = b.minor > a.minor || (b.minor === a.minor && b.patch > a.patch);
  if (added.length && !newer)
    problems.push(`The wire gained ${added.join('; ')}. Bump SCHEMA_VERSION in src/contract.ts to ${a.major}.${a.minor + 1}.0.`);
  return problems;
}

export function buildSchemas(inputs: Inputs): Record<string, Json> {
  const version = inputs.schemaVersion ?? SCHEMA_VERSION;
  const files: Record<string, Json> = {};
  const nodes: Record<string, ManifestNode> = {};
  for (const spec of NODES) {
    const built = buildNode(spec, inputs, version);
    files[nodeFile(spec.type)] = built.schema;
    nodes[spec.type] = built.manifest;
  }
  for (const spec of NODES) {
    const kids = spec.children.kind === 'nodes' ? spec.children.only ?? [] : [];
    for (const k of kids) if (!nodes[k]) throw new Error(`${spec.type}: children lists unknown node ${k}.`);
  }
  const topLevel = NODES.filter((n) => !n.part).map((n) => n.type);
  files['defs.schema.json'] = buildDefs(inputs, version);
  files['screen.schema.json'] = buildScreen(topLevel, version);

  const excludedNodes = Object.entries(EXCLUDED_NODES).map(([node, reason]) => {
    const meta = [...inputs.metas.values()].find((m) => m.exports.includes(node));
    if (!meta) throw new Error(`EXCLUDED_NODES: ${node} isn't an export of any meta.`);
    return { node, component: meta.name, reason };
  });
  const manifest: Manifest = {
    $comment: 'Generated by `pnpm --filter @syntara/sdui generate` from packages/react/meta and src/wire.ts. Do not edit.',
    schemaVersion: version,
    nodes,
    files: Object.fromEntries(NODES.map((n) => [n.type, nodeFile(n.type)])),
    excludedNodes,
    excludedEverywhere: Object.entries(EXCLUDED_EVERYWHERE).map(([prop, reason]) => ({ prop, reason })),
    outOfSlice: OUT_OF_SLICE,
    gapTokens: inputs.gapTokens,
    icons: inputs.iconNames,
  };
  const problems = evolutionProblems(inputs.previous, manifest);
  if (problems.length) throw new Error(`Schema evolution:\n- ${problems.join('\n- ')}`);
  files['manifest.json'] = manifest as unknown as Json;
  return files;
}

/** src/schemas.generated.ts: static imports of every schema file, so any bundler can load them. */
export function schemasModule(files: Record<string, Json>): string {
  const names = Object.keys(files).filter((f) => f.endsWith('.schema.json')).sort();
  const ident = (f: string) => f.replace(/^nodes\//, 'node_').replace(/\.schema\.json$/, '').replace(/[^a-zA-Z0-9]+/g, '_');
  return [
    '// Generated by `pnpm --filter @syntara/sdui generate` (scripts/build-schemas.ts). Do not edit.',
    ...names.map((f) => `import ${ident(f)} from '../schema/${f}';`),
    "import manifest from '../schema/manifest.json';",
    '',
    '/** Every schema file: shared definitions, the screen, and one per node. */',
    `export const SCHEMAS: ReadonlyArray<Record<string, unknown>> = [${names.map(ident).join(', ')}];`,
    'export const MANIFEST_JSON: unknown = manifest;',
    '',
  ].join('\n');
}

/** Serialises a generated file exactly as it's committed. */
export const serialise = (value: unknown): string => JSON.stringify(value, null, 2) + '\n';
