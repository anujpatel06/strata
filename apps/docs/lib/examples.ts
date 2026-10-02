/** Server-only: example source files in apps/docs/examples/<component>/<name>.tsx. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { DOCS_ROOT } from './repo';

const EXAMPLES_DIR = path.join(/*turbopackIgnore: true*/ DOCS_ROOT, 'examples');

/** Folder that holds an example, e.g. "button-variants" → "button". */
export function exampleFolder(name: string): string | undefined {
  if (!existsSync(EXAMPLES_DIR)) return undefined;
  for (const dir of readdirSync(EXAMPLES_DIR)) {
    const full = path.join(/*turbopackIgnore: true*/ EXAMPLES_DIR, dir);
    if (statSync(full).isDirectory() && existsSync(path.join(/*turbopackIgnore: true*/ full, `${name}.tsx`))) return dir;
  }
  return undefined;
}

export function readExampleSource(name: string): { folder: string; source: string } | undefined {
  const folder = exampleFolder(name);
  if (!folder) return undefined;
  const source = readFileSync(path.join(/*turbopackIgnore: true*/ EXAMPLES_DIR, folder, `${name}.tsx`), 'utf8');
  return { folder, source: stripCopy(source) };
}

/**
 * Takes the docs-only translation calls (examples/_copy/use-copy.ts) back out, so the Code tab shows the plain
 * English example a reader would write: `aria-label={t('Settings')}` → `aria-label="Settings"`,
 * `{t('Save draft')}` → `Save draft`, any other `t('X')` → `'X'`.
 */
export function stripCopy(source: string): string {
  return source
    .replace(/^import \{ useCopy \} from '\.\.\/_copy\/use-copy';\n/m, '')
    .replace(/^[ \t]*const t = useCopy\(\);\n/m, '')
    .replace(/=\{t\((['"])(.*?)\1\)\}/g, '="$2"')
    .replace(/\{t\((['"])(.*?)\1\)\}/g, '$2')
    .replace(/\bt\((['"])(.*?)\1\)/g, '$1$2$1');
}
