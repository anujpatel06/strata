#!/usr/bin/env node
/**
 * syntara-codemods <transform> <path…> [--dry] [--print] [--source=<module>]
 *
 *   npx @syntara/codemods button-variant-danger-to-tone src
 *
 * Runs one transform from ../transforms over .tsx, .ts, .jsx and .js files with jscodeshift. `--dry` changes nothing
 * and shows what would change; add `--print` to see the new source. Every line the transform reports is a place it
 * didn't rewrite because it couldn't be sure: read those by hand.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const transformsDir = path.resolve(here, '../transforms');
const available = readdirSync(transformsDir)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => f.slice(0, -3))
  .sort();

const [name, ...rest] = process.argv.slice(2);
const paths = rest.filter((a) => !a.startsWith('-'));
const flags = rest.filter((a) => a.startsWith('-'));

if (!name || name === '--help' || name === '-h' || paths.length === 0) {
  console.log(`Usage: syntara-codemods <transform> <path…> [--dry] [--print] [--source=<module>]\n\nTransforms:\n  ${available.join('\n  ')}`);
  process.exit(name && name !== '--help' && name !== '-h' ? 1 : 0);
}
const transform = path.join(transformsDir, `${name}.ts`);
if (!existsSync(transform)) {
  console.error(`No transform named "${name}". Available:\n  ${available.join('\n  ')}`);
  process.exit(1);
}

/** Build output and dependencies: never source a person wrote. */
const IGNORED = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next*/**', '**/.turbo/**'];

const require = createRequire(import.meta.url);
const jscodeshift = path.join(path.dirname(require.resolve('jscodeshift/package.json')), 'bin/jscodeshift.js');
const result = spawnSync(
  process.execPath,
  [jscodeshift, '--transform', transform, '--parser', 'tsx', '--extensions', 'tsx,ts,jsx,js', ...IGNORED.flatMap((g) => ['--ignore-pattern', g]), ...flags, ...paths],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
