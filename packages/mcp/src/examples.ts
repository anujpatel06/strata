/** Example source files from apps/docs/examples/<component>/. These are the files the docs site renders. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { closest, requireComponent } from './components';
import { ToolError, inside, isSafeName, repoPath, SAFE_NAME_MESSAGE } from './root';

const EXAMPLES_DIR = 'apps/docs/examples';

function exampleNames(root: string, component: string): string[] {
  const dir = inside(root, EXAMPLES_DIR, component);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => f.slice(0, -'.tsx'.length))
    .filter(isSafeName)
    .sort();
}

export function getExample(root: string, component: string, example?: string): Record<string, unknown> {
  const meta = requireComponent(root, component);
  const name = example ?? `${meta.name}-demo`;
  if (!isSafeName(name)) throw new ToolError(`"${name}" is not an example name. ${SAFE_NAME_MESSAGE}`);
  const names = exampleNames(root, meta.name);
  if (!names.includes(name)) {
    throw new ToolError(`No example named "${name}" for ${meta.name}. Use one of the examples listed.`, {
      closest: closest(name, names),
      examples: names,
    });
  }
  const file = inside(root, EXAMPLES_DIR, meta.name, `${name}.tsx`);
  return { component: meta.name, example: name, source: repoPath(root, file), code: readFileSync(file, 'utf8') };
}
