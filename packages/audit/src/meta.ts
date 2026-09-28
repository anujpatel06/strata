/**
 * Reads packages/react/meta/*.meta.json: which components exist, and which props or prop values are deprecated.
 * Only the element → component-name mapping below is written by hand; whether the component exists, what it
 * exports and what is deprecated all come from the meta files.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './tokens';

interface DeprecationRecord {
  since: string;
  removal: string;
  replacement: string;
  reason: string;
  codemod: string;
  rfc: string;
}
interface PropRecord {
  component: string;
  name: string;
  deprecated?: DeprecationRecord;
  deprecatedValues?: Array<DeprecationRecord & { value: string }>;
}
interface MetaFile {
  name: string;
  exports: string[];
  files: string[];
  props: PropRecord[];
}

export interface SyntaraComponent {
  /** kebab-case meta name, e.g. "text-field". */
  name: string;
  /** The main export, e.g. "TextField". */
  exportName: string;
  files: string[];
}

export interface DeprecatedProp {
  component: string;
  prop: string;
  /** Present for a single deprecated value; the literal without quotes, e.g. "danger". */
  value?: string;
  record: DeprecationRecord;
}

export interface Meta {
  components: Map<string, SyntaraComponent>;
  /** Every exported name → its component. */
  exports: Map<string, SyntaraComponent>;
  deprecations: DeprecatedProp[];
}

/** Native element → the meta name of the component that replaces it. <input> depends on its type. */
export const NATIVE_TO_COMPONENT: Readonly<Record<string, string>> = {
  button: 'button',
  a: 'link',
  select: 'select',
  textarea: 'text-area',
  table: 'data-table',
  input: 'text-field',
};
/**
 * A literal type that is not listed here (color, time, week…) has no Syntara component, so the native
 * element is the right one and is not reported.
 */
export const INPUT_TYPE_TO_COMPONENT: Readonly<Record<string, string>> = {
  text: 'text-field',
  email: 'text-field',
  password: 'text-field',
  tel: 'text-field',
  url: 'text-field',
  number: 'text-field',
  checkbox: 'checkbox',
  radio: 'radio-group',
  range: 'slider',
  search: 'search-field',
  file: 'file-upload',
  date: 'date-picker',
  button: 'button',
  submit: 'button',
  reset: 'button',
};

let cached: Meta | undefined;
let cachedDir: string | undefined;

export function metaDir(): string {
  return process.env.SYNTARA_META_DIR ?? join(REPO_ROOT, 'packages/react/meta');
}

export function loadMeta(): Meta {
  const dir = metaDir();
  if (cached && cachedDir === dir) return cached;
  const meta: Meta = { components: new Map(), exports: new Map(), deprecations: [] };
  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.meta.json')).sort()) {
      let json: MetaFile;
      try {
        json = JSON.parse(readFileSync(join(dir, file), 'utf8')) as MetaFile;
      } catch {
        continue; // another session may be part-way through writing it
      }
      if (!json.name || !Array.isArray(json.exports) || json.exports.length === 0) continue;
      const component: SyntaraComponent = { name: json.name, exportName: json.exports[0]!, files: json.files ?? [] };
      meta.components.set(json.name, component);
      for (const name of json.exports) meta.exports.set(name, component);
      for (const prop of json.props ?? []) {
        if (prop.deprecated) meta.deprecations.push({ component: prop.component, prop: prop.name, record: prop.deprecated });
        for (const { value, ...record } of prop.deprecatedValues ?? []) {
          meta.deprecations.push({ component: prop.component, prop: prop.name, value: value.replace(/^['"]|['"]$/g, ''), record });
        }
      }
    }
  }
  cached = meta;
  cachedDir = dir;
  return meta;
}
