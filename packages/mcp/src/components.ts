/**
 * Components, read from packages/react/meta/<name>.meta.json (ADR-007). Nothing here is written by hand:
 * if a field is wrong, fix the meta file and the docs, the registry and this server all change together.
 */
import { existsSync, readdirSync } from 'node:fs';
import { cachedFile } from './cache';
import { ToolError, inside, isSafeName, SAFE_NAME_MESSAGE } from './root';

export const CATEGORIES = ['actions', 'inputs', 'overlays', 'feedback', 'display', 'navigation', 'data', 'layout'] as const;
export type Category = (typeof CATEGORIES)[number];

interface DeprecationRecord {
  since: string;
  removal: string;
  replacement: string;
  reason: string;
  codemod: string;
  rfc: string;
}

interface PropDoc {
  component: string;
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
  deprecated?: DeprecationRecord;
  deprecatedValues?: Array<DeprecationRecord & { value: string }>;
}

interface ImportDoc {
  package: string;
  names: string[];
  why: string;
}

interface TypeNote {
  prop?: string;
  note: string;
  example?: string;
}

/** The fields of ComponentMeta (packages/react/meta/schema.ts) that this server reads. */
export interface ComponentMeta {
  name: string;
  title: string;
  description: string;
  category: Category;
  maturity: 'alpha' | 'beta' | 'stable';
  exports: string[];
  usage: string;
  examples: Array<{ name: string }>;
  props: PropDoc[];
  accessibility: { keyboard: Array<{ keys: string; action: string }>; notes: string[] };
  guidelines: { do: string[]; dont: string[] };
  tokens: string[];
  imports?: ImportDoc[];
  typeNotes?: TypeNote[];
}

export interface Deprecation {
  /** As it is written in code, e.g. `Button variant="danger"`. */
  what: string;
  replacement: string;
  since: string;
  removal: string;
  codemod: string;
}

const META_DIR = 'packages/react/meta';
const SUFFIX = '.meta.json';

export function componentNames(root: string): string[] {
  const dir = inside(root, META_DIR);
  return readdirSync(dir)
    .filter((f) => f.endsWith(SUFFIX))
    .map((f) => f.slice(0, -SUFFIX.length))
    .filter(isSafeName)
    .sort();
}

function readMeta(root: string, name: string): ComponentMeta {
  return cachedFile('meta', inside(root, META_DIR, name + SUFFIX), (text) => JSON.parse(text) as ComponentMeta);
}

export function allComponents(root: string): ComponentMeta[] {
  return componentNames(root).map((name) => readMeta(root, name));
}

/** `'danger'` → `"danger"`, the way it is written in JSX. */
function asJsxValue(value: string): string {
  const bare = value.replace(/^['"]|['"]$/g, '');
  return bare === value ? `{${value}}` : `"${bare}"`;
}

export function deprecationsOf(meta: ComponentMeta): Deprecation[] {
  const out: Deprecation[] = [];
  for (const prop of meta.props) {
    const pick = (what: string, d: DeprecationRecord): Deprecation => ({
      what,
      replacement: d.replacement,
      since: d.since,
      removal: d.removal,
      codemod: d.codemod,
    });
    if (prop.deprecated) out.push(pick(`${prop.component} ${prop.name}`, prop.deprecated));
    for (const d of prop.deprecatedValues ?? []) {
      out.push(pick(`${prop.component} ${prop.name}=${asJsxValue(d.value)}`, d));
    }
  }
  return out;
}

export function listComponents(root: string, category?: Category): Record<string, unknown> {
  const components = allComponents(root)
    .filter((m) => category === undefined || m.category === category)
    .map((m) => {
      const n = deprecationsOf(m).length;
      return {
        name: m.name,
        title: m.title,
        maturity: m.maturity,
        purpose: m.description,
        ...(n > 0 ? { deprecations: n } : {}),
      };
    });
  return { count: components.length, components };
}

/** Edit distance, for "did you mean". */
function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length]!;
}

/** Up to `max` names nearest to `input`: names that contain it (or that it contains) first, then by edit distance. */
export function closest(input: string, names: readonly string[], max = 3): string[] {
  const q = input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
  if (q === '') return [];
  return names
    .map((name) => {
      const contains = name.includes(q) || q.includes(name);
      return { name, score: distance(q, name) - (contains ? 100 : 0) };
    })
    .filter((c) => c.score <= Math.max(2, Math.ceil(q.length / 2)))
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, max)
    .map((c) => c.name);
}

/** Throws a ToolError with the closest names when `name` isn't a component. */
export function requireComponent(root: string, name: string): ComponentMeta {
  if (!isSafeName(name)) throw new ToolError(`"${name}" is not a component name. ${SAFE_NAME_MESSAGE}`);
  const names = componentNames(root);
  if (!names.includes(name) || !existsSync(inside(root, META_DIR, name + SUFFIX))) {
    const near = closest(name, names);
    throw new ToolError(
      near.length > 0
        ? `No component named "${name}". Call get_component with one of the closest names.`
        : `No component named "${name}". Call list_components to see every name.`,
      { closest: near },
    );
  }
  return readMeta(root, name);
}

/** `{ package, names }` → the import line a consumer writes, e.g. `import { parseDate, type DateValue } from '@internationalized/date';`. */
export function importLine(doc: ImportDoc): string {
  return `import { ${doc.names.join(', ')} } from '${doc.package}';`;
}

export function getComponent(root: string, name: string): Record<string, unknown> {
  const m = requireComponent(root, name);
  const many = m.exports.length > 1;
  return {
    name: m.name,
    title: m.title,
    maturity: m.maturity,
    purpose: m.description,
    import: `import { ${m.exports.join(', ')} } from '@syntara/react';`,
    // Only present when the component needs another package. Absent means '@syntara/react' is enough.
    ...(m.imports?.length ? { imports: m.imports.map((i) => ({ line: importLine(i), why: i.why })) } : {}),
    props: m.props.map((p) => ({
      // Which export the prop belongs to only matters when there is more than one.
      ...(many ? { component: p.component } : {}),
      name: p.name,
      type: p.type,
      ...(p.default !== undefined ? { default: p.default } : {}),
      ...(p.required ? { required: true } : {}),
      description: p.description,
    })),
    ...(m.typeNotes?.length
      ? {
          typeNotes: m.typeNotes.map((t) => ({
            ...(t.prop !== undefined ? { prop: t.prop } : {}),
            note: t.note,
            ...(t.example !== undefined ? { example: t.example } : {}),
          })),
        }
      : {}),
    deprecations: deprecationsOf(m),
    keyboard: m.accessibility.keyboard,
    accessibility: m.accessibility.notes,
    do: m.guidelines.do,
    dont: m.guidelines.dont,
    tokens: m.tokens,
    usage: m.usage,
    examples: m.examples.map((e) => e.name),
  };
}
