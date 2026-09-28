/**
 * validateScreen(doc): checks a screen document against the generated schema (ajv, JSON Schema draft 2020-12, strict
 * mode) and returns errors a backend engineer can act on: a JSON pointer and a sentence. No React import.
 *
 * This is the strict check, for producers: a backend runs it before sending a screen, in CI or at publish time.
 * The renderer is tolerant of newer minor versions (prepareScreen); see README "Unknowns".
 */
import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import { urn } from './contract';
import { manifest } from './manifest';
import { SCHEMAS } from './schemas.generated';
import { CLIENT_OWNED, CLIENT_OWNED_REASON, EXCLUDED_EVERYWHERE, MARKUP_KEYS, MARKUP_REASON } from './wire';

export interface ValidationError {
  /** JSON pointer into the document, e.g. "/root/children/2/props/ariaLabel". "" is the document itself. */
  path: string;
  /** One or two sentences: what's wrong and what to send instead. */
  message: string;
  /** The accessibility rule that failed, e.g. "button-name". */
  rule?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Keywords the schema files use besides JSON Schema's own. Other validators ignore x- keywords; ajv needs them named. */
export const STRATA_KEYWORDS = ['x-strata', 'x-strata-rule', 'x-strata-message'] as const;

/** A strict ajv instance with every schema added. Exposed for tests and for tools that want the raw validator. */
export function createAjv(): Ajv2020 {
  const ajv = new Ajv2020({ strict: true, allErrors: true, verbose: true, discriminator: true });
  ajv.addVocabulary([...STRATA_KEYWORDS]);
  for (const schema of SCHEMAS) ajv.addSchema(schema);
  return ajv;
}

let compiled: ValidateFunction | undefined;
function screenValidator(): ValidateFunction {
  if (!compiled) {
    const fn = createAjv().getSchema(urn('screen'));
    if (!fn) throw new Error('screen schema missing: run pnpm --filter @strata/sdui generate');
    compiled = fn;
  }
  return compiled;
}

export function validateScreen(doc: unknown): ValidationResult {
  const validate = screenValidator();
  if (validate(doc)) return { valid: true, errors: [] };
  return { valid: false, errors: formatErrors(doc, validate.errors ?? []) };
}

/* ------------------------------------------------------------------ *
 * Error messages
 * ------------------------------------------------------------------ */

type Schema = Record<string, unknown>;

const segments = (pointer: string): string[] =>
  pointer === '' ? [] : pointer.slice(1).split('/').map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));

/** The nearest node (an object with a string `type`) at or above a pointer. */
function nodeAt(doc: unknown, pointer: string): { type: string; path: string } | null {
  let cur: unknown = doc;
  let found: { type: string; path: string } | null = null;
  let path = '';
  const check = () => {
    if (cur && typeof cur === 'object' && !Array.isArray(cur) && typeof (cur as Schema).type === 'string' && path !== '')
      found = { type: (cur as Schema).type as string, path };
  };
  check();
  for (const seg of segments(pointer)) {
    if (cur === null || typeof cur !== 'object') break;
    cur = (cur as Record<string, unknown>)[seg];
    path += `/${seg.replace(/~/g, '~0').replace(/\//g, '~1')}`;
    // Actions have a `type` too; they aren't nodes. A slot can also be named "action" (Alert, EmptyState), and what
    // sits in a slot is a node, so only a node's own `action` field is skipped.
    if (!path.endsWith('/action') || path.endsWith('/slots/action')) check();
  }
  return found;
}

const last = (pointer: string) => segments(pointer).at(-1) ?? 'document';
const firstSentence = (s: unknown) => (typeof s === 'string' ? (/^.*?[.!?](\s|$)/.exec(s)?.[0].trim() ?? s) : '');
const list = (values: unknown[]) => values.map((v) => JSON.stringify(v)).join(', ');
const refName = (ref: string) => ref.split(':').at(-1) ?? ref;

function message(doc: unknown, e: ErrorObject): { message: string; rule?: string } {
  const parent = (e.parentSchema ?? {}) as Schema;
  const node = nodeAt(doc, e.instancePath);
  const who = node ? `${node.type}` : 'Screen';
  const rule = parent['x-strata-rule'] as { id: string; message: string } | undefined;
  if (rule) return { message: rule.message, rule: rule.id };
  const custom = parent['x-strata-message'];
  if (typeof custom === 'string') return { message: `${who}: ${last(e.instancePath)} ${custom}` };

  switch (e.keyword) {
    case 'additionalProperties': {
      const key = (e.params as { additionalProperty: string }).additionalProperty;
      const inProps = last(e.instancePath) === 'props';
      if ((CLIENT_OWNED as readonly string[]).includes(key)) return { message: `${who}: "${key}" isn't allowed. ${CLIENT_OWNED_REASON}` };
      if ((MARKUP_KEYS as readonly string[]).includes(key)) return { message: `${who}: "${key}" isn't allowed. ${MARKUP_REASON}` };
      if (EXCLUDED_EVERYWHERE[key]) return { message: `${who}: "${key}" isn't allowed. ${EXCLUDED_EVERYWHERE[key]}` };
      const excluded = node && inProps ? manifest.nodes[node.type]?.excluded.find((x) => x.prop === key && x.value === undefined) : undefined;
      if (excluded) return { message: `${who}: props.${key} stays on the client. ${excluded.reason}` };
      const action = node && inProps ? manifest.nodes[node.type]?.action?.from.includes(key) : false;
      if (action) return { message: `${who}: props.${key} isn't sent. Use the node's "action" instead.` };
      const known = Object.keys((parent.properties ?? {}) as Schema);
      return {
        message: `${who}: "${key}" isn't part of ${inProps ? `${who}'s props` : `this ${node ? 'node' : 'object'}`}. Known: ${known.join(', ') || 'none'}.`,
      };
    }
    case 'enum': {
      const allowed = (e.params as { allowedValues: unknown[] }).allowedValues;
      const field = last(e.instancePath);
      if (field === 'icon')
        return { message: `${who}: unknown icon ${JSON.stringify(e.data)}. Icon names come from @strata/icons (schema/manifest.json "icons").` };
      const excluded = node ? manifest.nodes[node.type]?.excluded.find((x) => x.prop === field && x.value === e.data) : undefined;
      if (excluded) return { message: `${who}: ${field} ${JSON.stringify(e.data)} isn't accepted. ${excluded.reason}` };
      return { message: `${who}: ${field} ${JSON.stringify(e.data)} isn't one of ${list(allowed)}.` };
    }
    case 'discriminator': {
      const tag = (e.params as { tagValue?: unknown }).tagValue;
      const allowed = ((parent.oneOf ?? []) as Array<{ $ref: string }>).map((b) => refName(b.$ref));
      const isAction = allowed.includes('NavigateAction') || last(e.instancePath) === 'action';
      if (isAction) return { message: `${who}: action type ${JSON.stringify(tag)} isn't known. Use "navigate" or "event".` };
      const excludedNode = manifest.excludedNodes.find((x) => x.node === tag);
      if (excludedNode) return { message: `${JSON.stringify(tag)} isn't on the wire. ${excludedNode.reason}` };
      const part = typeof tag === 'string' && manifest.nodes[tag]?.part;
      return {
        message: `Unknown node type ${JSON.stringify(tag)} at ${e.instancePath || '/'}${part ? ' (it only goes inside its parent)' : ''}. Allowed here: ${allowed.join(', ')}.`,
      };
    }
    case 'required': {
      const missing = (e.params as { missingProperty: string }).missingProperty;
      const described = firstSentence(((parent.properties ?? {}) as Record<string, Schema>)[missing]?.description);
      const where = last(e.instancePath) === 'props' ? `props.${missing}` : `"${missing}"`;
      return { message: `${who}: ${where} is required.${described ? ` ${described}` : ''}` };
    }
    case 'const': {
      const allowed = (e.params as { allowedValue: unknown }).allowedValue;
      const field = last(e.instancePath);
      if (field === 'type' && e.instancePath.endsWith('/action/type'))
        return { message: `${who}: action type must be ${JSON.stringify(allowed)} here.` };
      return { message: `${who}: ${field} must be ${JSON.stringify(allowed)}.` };
    }
    case 'type':
      return { message: `${who}: ${last(e.instancePath)} must be ${(e.params as { type: string }).type}.` };
    case 'pattern':
      return { message: `${who}: ${last(e.instancePath)} ${JSON.stringify(e.data)} doesn't match ${(e.params as { pattern: string }).pattern}.` };
    default:
      return { message: `${who}: ${last(e.instancePath)} ${e.message ?? 'is invalid'}.` };
  }
}

/** Accessibility rules by node type: node schema allOf[i] carries `x-strata-rule`. */
const RULES = new Map<string, Array<{ id: string; message: string } | undefined>>(
  SCHEMAS.filter((s) => Array.isArray(s.allOf)).map((s) => [
    (s['x-strata'] as { node: string }).node,
    (s.allOf as Schema[]).map((r) => r['x-strata-rule'] as { id: string; message: string } | undefined),
  ]),
);

/**
 * The rule an error comes from. Ajv restarts schema paths at every $ref, and every node is checked through a $ref
 * to its own schema, so "#/allOf/<i>/…" is rule i of the nearest node at or above the error.
 */
function ruleOf(doc: unknown, e: ErrorObject): { rule: { id: string; message: string }; path: string } | undefined {
  const m = /^#\/allOf\/(\d+)(\/|$)/.exec(e.schemaPath);
  if (!m) return undefined;
  const node = nodeAt(doc, e.instancePath);
  const rule = node ? RULES.get(node.type)?.[Number(m[1])] : undefined;
  return rule && node ? { rule, path: node.path } : undefined;
}

const COMBINATORS = ['if', 'anyOf', 'oneOf'];
const isDeeper = (path: string, than: string) => path.startsWith(`${than}/`);

/**
 * Turns ajv's errors into one message per problem:
 * - Every error inside an accessibility rule (a node schema's allOf) becomes that rule's message, once per node.
 * - A combinator with its own shape message (x-strata-message) replaces its branch errors at the same spot, and
 *   gives way to a more specific error deeper in (an unknown icon inside a label).
 * - Other combinator failures add nothing to their branch errors and are dropped.
 * - A wrong action kind (a Link with an event) is reported once, not as three field errors.
 */
export function formatErrors(doc: unknown, errors: ErrorObject[]): ValidationError[] {
  const out: ValidationError[] = [];
  const seen = new Set<string>();
  const push = (path: string, message: string, rule?: string) => {
    const key = `${path}\u0000${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ path, message, ...(rule ? { rule } : {}) });
  };

  const plain: ErrorObject[] = [];
  for (const e of errors) {
    const found = ruleOf(doc, e);
    if (found) push(found.path, found.rule.message, found.rule.id);
    else plain.push(e);
  }

  const shaped = plain.filter((e) => COMBINATORS.includes(e.keyword) && ((e.parentSchema ?? {}) as Schema)['x-strata-message']);
  const wrongAction = plain.filter((e) => e.keyword === 'const' && e.instancePath.endsWith('/action/type'));
  const kept = plain.filter((e) => {
    if (shaped.includes(e)) return !plain.some((x) => x !== e && !COMBINATORS.includes(x.keyword) && isDeeper(x.instancePath, e.instancePath));
    if (COMBINATORS.includes(e.keyword)) return false;
    if (shaped.some((c) => c.instancePath === e.instancePath)) return false;
    if (wrongAction.some((c) => c !== e && e.instancePath === c.instancePath.slice(0, -'/type'.length))) return false;
    return true;
  });
  for (const e of kept) {
    const m = message(doc, e);
    push(e.instancePath, m.message, m.rule);
  }
  return out;
}
