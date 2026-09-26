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
  return { folder, source: readFileSync(path.join(/*turbopackIgnore: true*/ EXAMPLES_DIR, folder, `${name}.tsx`), 'utf8') };
}
