#!/usr/bin/env node
/**
 * Prepares what every eval run starts from. Run it once before `run.mjs`, and again whenever a package changes.
 *
 *   node evals/setup.mjs
 *
 * 1. Builds @syntara/react and the tenant tokens.
 * 2. Packs @syntara/react, @syntara/icons and @syntara/tokens into tarballs, the same files npm would publish.
 *    Runs install from these, so an agent sees what a real consumer sees: built code and types, not this repo's
 *    meta files, docs or examples.
 * 3. Installs the template app once, in the system's temp folder and outside this repo (see lib/common.mjs).
 *    Each run's workspace links to that node_modules.
 * 4. Writes llms.txt for the llms condition, generated from the same meta.json files as the docs.
 * 5. Records the commit and any uncommitted package changes in evals/.cache/source.json.
 *
 *   node evals/setup.mjs --clean     build from a fresh checkout of HEAD (see below)
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CACHE, EVALS, INSTALLED, PACKS, PREPARED, REPO, flag, git, sourceState } from './lib/common.mjs';

const sh = (cmd, args, cwd = REPO) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });

/**
 * --clean: build from a fresh checkout of HEAD instead of the working tree, so uncommitted work in progress can't
 * get into the packages, the MCP server's data or the auditor. Use it for any run whose numbers will be published.
 */
const clean = flag('clean', false) === true;
let SRC = REPO;
if (clean) {
  SRC = path.join(PREPARED, 'source');
  console.log(`0/5 fresh checkout of ${git('rev-parse', '--short', 'HEAD')} → ${SRC}`);
  if (existsSync(SRC)) git('worktree', 'remove', '--force', SRC);
  git('worktree', 'prune');
  mkdirSync(PREPARED, { recursive: true });
  git('worktree', 'add', '--detach', SRC, 'HEAD');
  sh('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], SRC);
}

console.log('1/5 build @syntara/react and tokens');
sh('pnpm', ['--filter', '@syntara/react', 'build'], SRC);
sh('pnpm', ['tokens'], SRC);

console.log('2/5 pack');
mkdirSync(CACHE, { recursive: true });
rmSync(PACKS, { recursive: true, force: true });
mkdirSync(PACKS, { recursive: true });
const packs = {};
for (const name of ['react', 'icons', 'tokens']) {
  sh('pnpm', ['pack', '--pack-destination', PACKS], path.join(SRC, 'packages', name));
  const file = readdirSync(PACKS).find((f) => f.startsWith(`syntara-${name}-`) && f.endsWith('.tgz'));
  if (!file) throw new Error(`pack of ${name} produced no tarball`);
  packs[name] = `file:${path.join(PACKS, file)}`;
}

console.log('3/5 install the template');
rmSync(INSTALLED, { recursive: true, force: true });
cpSync(path.join(EVALS, 'template'), INSTALLED, { recursive: true });
const pkgFile = path.join(INSTALLED, 'package.json');
writeFileSync(
  pkgFile,
  readFileSync(pkgFile, 'utf8').replaceAll('__PACK_REACT__', packs.react).replaceAll('__PACK_ICONS__', packs.icons).replaceAll('__PACK_TOKENS__', packs.tokens),
);
// --ignore-workspace: the template must install like an app outside this monorepo.
sh('pnpm', ['install', '--ignore-workspace', '--no-frozen-lockfile'], INSTALLED);
// template/.npmrc sets node-linker=hoisted: plain folders, as npm installs them, with no links for a file search to miss.
if (lstatSync(path.join(INSTALLED, 'node_modules/@syntara/react')).isSymbolicLink()) throw new Error('node_modules/@syntara/react is a link; the install must be hoisted');
for (const dep of ['@syntara/react', '@syntara/icons', '@syntara/tokens']) {
  if (!existsSync(path.join(INSTALLED, 'node_modules', dep, 'package.json'))) throw new Error(`${dep} did not install`);
}

console.log('4/5 llms.txt');
const metaDir = path.join(SRC, 'packages/react/meta');
const metas = readdirSync(metaDir).filter((f) => f.endsWith('.meta.json')).sort().map((f) => JSON.parse(readFileSync(path.join(metaDir, f), 'utf8')));
const lines = ['# Syntara', '', '> A multi-brand design system: React components on React Aria, themed by CSS variables. Import components from `@syntara/react` and icons from `@syntara/icons`.', ''];
for (const m of metas) {
  lines.push(`## ${m.title}`, '', m.description, '', `Exports: ${m.exports.map((e) => `\`${e}\``).join(', ')}`, '');
  for (const p of m.props) {
    const dep = p.deprecatedValues?.map((d) => ` Deprecated value ${d.value}: use ${d.replacement}.`).join('') ?? '';
    lines.push(`- \`${p.component}.${p.name}\`: \`${p.type}\`${p.default ? `, default \`${p.default}\`` : ''}${p.required ? ', required' : ''}. ${p.description}${dep}`);
  }
  lines.push('', '```tsx', m.usage, '```', '');
  if (m.guidelines.dont.length) lines.push(...m.guidelines.dont.map((d) => `- ${d}`), '');
}
writeFileSync(path.join(CACHE, 'llms.txt'), lines.join('\n'));

console.log('5/5 record the source');
const live = sourceState();
const state = { commit: live.commit, dirty: clean ? [] : live.dirty, clean, root: SRC, packs, preparedAt: new Date().toISOString(), node: process.version };
writeFileSync(path.join(CACHE, 'source.json'), JSON.stringify(state, null, 2) + '\n');
console.log(`\nReady. Packed from ${state.commit.slice(0, 7)}${state.dirty.length ? ` with ${state.dirty.length} uncommitted change(s) in the packages (listed in .cache/source.json)` : ', clean'}.`);
