/**
 * prepareScreen(doc): what a client does with a document before drawing it. No React import.
 *
 * validateScreen is strict, for producers. A client has to be tolerant instead, because a server may already speak a
 * newer minor version than the app installed on a phone. The rules (README "Unknowns"):
 *
 * - A document for another major → not drawn; the host's screen fallback is shown. Reported.
 * - A newer minor → drawn. Reported once.
 * - An unknown node type → its `fallback` node if it has one, otherwise nothing. Reported. Never raw JSON.
 * - An unknown prop, slot or field → ignored. Reported.
 * - An unknown enum value or icon → the prop is dropped, so the component's default applies. Reported.
 * - An unknown action type → the node is treated as unknown (fallback or nothing): a control that can't act
 *   shouldn't be drawn. Reported.
 * - What remains is validated strictly. If it's still invalid (a wrong type, a missing accessible name, an unsafe
 *   link), the whole screen falls back. Reported with every error.
 */
import { MAX_DEPTH, SCHEMA_VERSION, SUPPORTED_MAJOR, parseVersion } from './contract';
import type { Literal, ManifestNode } from './manifest-types';
import { manifest } from './manifest';
import { validateScreen } from './validate';
import { CLIENT_OWNED, CLIENT_OWNED_REASON, EXCLUDED_EVERYWHERE, MARKUP_KEYS, MARKUP_REASON } from './wire';

export type IssueCode =
  | 'invalid-document'
  | 'unsupported-version'
  | 'newer-minor'
  | 'unknown-component'
  | 'unknown-prop'
  | 'unknown-value'
  | 'unknown-field'
  | 'unknown-action'
  | 'deprecated-value'
  | 'too-deep'
  | 'duplicate-id'
  | 'render-error'
  | 'no-action-handler';

export interface Issue {
  code: IssueCode;
  /** JSON pointer into the document as sent. */
  path: string;
  message: string;
  /** The node the issue is about, if any. */
  nodeType?: string;
  /** For invalid-document: the accessibility rule that failed. */
  rule?: string;
}

export interface Action {
  type: 'navigate' | 'event';
  href?: string;
  name?: string;
  payload?: Record<string, string | number | boolean | null>;
}

/** A node after preparation: known type, known props and values only. */
export interface PreparedNode {
  type: string;
  id?: string;
  props?: Record<string, unknown>;
  children?: unknown;
  slots?: Record<string, PreparedNode>;
  action?: Action;
  fallback?: PreparedNode;
}

export interface ScreenDocument {
  schemaVersion: string;
  screen: { id: string; title: string; locale?: string };
  root: PreparedNode;
}

export type Prepared = { ok: true; document: ScreenDocument; issues: Issue[] } | { ok: false; issues: Issue[] };

const CLIENT = parseVersion(SCHEMA_VERSION)!;
const NODES = new Map<string, ManifestNode>(Object.entries(manifest.nodes));
const ICONS = new Set(manifest.icons);
const NODE_KEYS = new Set(['type', 'id', 'props', 'children', 'slots', 'action', 'fallback']);

const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const esc = (k: string) => k.replace(/~/g, '~0').replace(/\//g, '~1');

function whyIgnored(key: string): string {
  if ((CLIENT_OWNED as readonly string[]).includes(key)) return CLIENT_OWNED_REASON;
  if ((MARKUP_KEYS as readonly string[]).includes(key)) return MARKUP_REASON;
  return EXCLUDED_EVERYWHERE[key] ?? `This client (schema ${SCHEMA_VERSION}) doesn't know it.`;
}

export function prepareScreen(input: unknown): Prepared {
  const issues: Issue[] = [];
  const fail = (code: IssueCode, message: string, path = ''): Prepared => ({ ok: false, issues: [...issues, { code, path, message }] });

  if (!isObject(input)) return fail('invalid-document', 'The document must be a JSON object.');
  const version = parseVersion(input.schemaVersion);
  if (!version) return fail('invalid-document', 'schemaVersion is missing or not a semver string like "1.0.0".', '/schemaVersion');
  if (version.major !== SUPPORTED_MAJOR)
    return fail(
      'unsupported-version',
      `The document is for schema ${input.schemaVersion as string}; this client supports ${SUPPORTED_MAJOR}.x. The screen fallback is shown.`,
      '/schemaVersion',
    );
  if (version.minor > CLIENT.minor)
    issues.push({
      code: 'newer-minor',
      path: '/schemaVersion',
      message: `The document is for schema ${input.schemaVersion as string}; this client knows ${SCHEMA_VERSION}. Anything newer is ignored or falls back.`,
    });

  for (const key of Object.keys(input)) {
    if (!['schemaVersion', 'screen', 'root'].includes(key))
      issues.push({ code: 'unknown-field', path: `/${esc(key)}`, message: `"${key}" is ignored. ${whyIgnored(key)}` });
  }
  let screen: unknown = input.screen;
  if (isObject(input.screen)) {
    const s: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input.screen)) {
      if (['id', 'title', 'locale'].includes(key)) s[key] = value;
      else issues.push({ code: 'unknown-field', path: `/screen/${esc(key)}`, message: `screen.${key} is ignored. ${whyIgnored(key)}` });
    }
    screen = s;
  }

  const root = prepareNode(input.root, '/root', 0, issues);
  if (root === null) return fail('invalid-document', 'The root node could not be drawn, so the screen fallback is shown.', '/root');
  const document = { schemaVersion: input.schemaVersion, screen, root };

  const result = validateScreen(document);
  if (!result.valid)
    return {
      ok: false,
      issues: [
        ...issues,
        ...result.errors.map((e) => ({ code: 'invalid-document' as const, path: e.path, message: e.message, ...(e.rule ? { rule: e.rule } : {}) })),
      ],
    };
  return { ok: true, document: document as ScreenDocument, issues };
}

/** Returns the prepared node, the fallback that replaces it, or null (draw nothing). Non-nodes pass through for validation to reject. */
function prepareNode(value: unknown, path: string, depth: number, issues: Issue[]): PreparedNode | null {
  if (depth > MAX_DEPTH) {
    issues.push({ code: 'too-deep', path, message: `Nodes nested deeper than ${MAX_DEPTH} levels are not drawn.` });
    return null;
  }
  if (!isObject(value) || typeof value.type !== 'string') return value as PreparedNode;
  const type = value.type;
  const spec = NODES.get(type);
  const replace = (code: IssueCode, message: string): PreparedNode | null => {
    const hasFallback = own(value, 'fallback') && value.fallback != null;
    issues.push({ code, path, nodeType: type, message: `${message} ${hasFallback ? 'Its fallback is drawn instead.' : 'Nothing is drawn.'}` });
    return hasFallback ? prepareNode(value.fallback, `${path}/fallback`, depth + 1, issues) : null;
  };
  if (!spec) return replace('unknown-component', `Unknown node type ${JSON.stringify(type)}.`);
  if (own(value, 'action') && isObject(value.action) && !['navigate', 'event'].includes(value.action.type as string))
    return replace('unknown-action', `${type}: unknown action type ${JSON.stringify(value.action.type)}.`);

  const out: PreparedNode = { type };
  for (const key of Object.keys(value)) {
    const v = value[key];
    const at = `${path}/${esc(key)}`;
    if (!NODE_KEYS.has(key)) {
      issues.push({ code: 'unknown-field', path: at, nodeType: type, message: `${type}: "${key}" is ignored. ${whyIgnored(key)}` });
      continue;
    }
    switch (key) {
      case 'type':
        break;
      case 'id':
        out.id = v as string;
        break;
      case 'props':
        out.props = isObject(v) ? prepareProps(type, spec, v, at, issues) : (v as Record<string, unknown>);
        break;
      case 'children': {
        const children = prepareChildren(type, spec, v, at, depth, issues);
        if (children !== undefined) out.children = children;
        break;
      }
      case 'slots':
        if (!isObject(v)) {
          out.slots = v as Record<string, PreparedNode>;
          break;
        }
        out.slots = {};
        for (const [name, slot] of Object.entries(v)) {
          if (!own(spec.slots, name)) {
            issues.push({ code: 'unknown-field', path: `${at}/${esc(name)}`, nodeType: type, message: `${type}: slot "${name}" is ignored. ${whyIgnored(name)}` });
            continue;
          }
          const prepared = prepareNode(slot, `${at}/${esc(name)}`, depth + 1, issues);
          if (prepared !== null) out.slots[name] = prepared;
        }
        break;
      case 'action':
        out.action = v as Action;
        break;
      case 'fallback': {
        // Kept for a node that fails while drawing (the renderer's error boundary draws it).
        const prepared = prepareNode(v, at, depth + 1, issues);
        if (prepared !== null) out.fallback = prepared;
        break;
      }
    }
  }
  return out;
}

function prepareProps(type: string, spec: ManifestNode, props: Record<string, unknown>, path: string, issues: Issue[]) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    const at = `${path}/${esc(key)}`;
    const def = own(spec.props, key) ? spec.props[key] : undefined;
    if (!def) {
      const excluded = spec.excluded.find((x) => x.prop === key && x.value === undefined);
      const asAction = spec.action?.from.includes(key) ? "Send it as the node's action." : undefined;
      issues.push({
        code: 'unknown-prop',
        path: at,
        nodeType: type,
        message: `${type}: props.${key} is ignored. ${asAction ?? excluded?.reason ?? whyIgnored(key)}`,
      });
      continue;
    }
    if (def.kind === 'enum' && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
      const deprecated = def.deprecatedValues?.find((d) => d.value === value);
      if (deprecated)
        issues.push({ code: 'deprecated-value', path: at, nodeType: type, message: `${type}: props.${key} ${JSON.stringify(value)} is deprecated; use ${deprecated.replacement}.` });
      else if (!(def.values ?? []).includes(value as Literal)) {
        issues.push({
          code: 'unknown-value',
          path: at,
          nodeType: type,
          message: `${type}: props.${key} ${JSON.stringify(value)} isn't known to this client, so the default${def.default !== undefined ? ` (${JSON.stringify(def.default)})` : ''} is used.`,
        });
        continue;
      }
    }
    if ((def.kind === 'icon' || def.kind === 'icon-or-false') && isObject(value) && typeof value.icon === 'string' && !ICONS.has(value.icon)) {
      issues.push({ code: 'unknown-value', path: at, nodeType: type, message: `${type}: icon ${JSON.stringify(value.icon)} isn't known to this client, so no icon is drawn.` });
      continue;
    }
    out[key] = value;
  }
  return out;
}

function prepareChildren(type: string, spec: ManifestNode, children: unknown, path: string, depth: number, issues: Issue[]): unknown {
  const unknownIcon = (icon: unknown, at: string) => {
    issues.push({ code: 'unknown-value', path: at, nodeType: type, message: `${type}: icon ${JSON.stringify(icon)} isn't known to this client, so it is left out.` });
  };
  switch (spec.children.kind) {
    case 'nodes': {
      if (!Array.isArray(children)) return children;
      const out: PreparedNode[] = [];
      const ids = new Set<string>();
      children.forEach((child, i) => {
        const prepared = prepareNode(child, `${path}/${i}`, depth + 1, issues);
        if (prepared === null) return;
        if (typeof prepared.id === 'string') {
          if (ids.has(prepared.id))
            issues.push({ code: 'duplicate-id', path: `${path}/${i}/id`, nodeType: prepared.type, message: `id ${JSON.stringify(prepared.id)} is used twice among siblings; the position is used as the key instead.` });
          ids.add(prepared.id);
        }
        out.push(prepared);
      });
      return out;
    }
    case 'inline': {
      if (!Array.isArray(children)) return children;
      const out = children.filter((item, i) => {
        if (isObject(item) && typeof item.icon === 'string' && !ICONS.has(item.icon)) {
          unknownIcon(item.icon, `${path}/${i}`);
          return false;
        }
        return true;
      });
      return out.length ? out : undefined;
    }
    case 'icon':
      if (isObject(children) && typeof children.icon === 'string' && !ICONS.has(children.icon)) {
        unknownIcon(children.icon, path);
        return undefined;
      }
      return children;
    default:
      return children;
  }
}
