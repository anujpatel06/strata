#!/usr/bin/env node
/**
 * Builds the Strata shadcn registry from the same source as the npm package.
 *
 *   pnpm registry                                    (repo root; = node packages/react/scripts/build-registry.mjs)
 *   STRATA_REGISTRY_URL=https://strata.dev pnpm registry
 *
 * Reads  packages/react/meta/*.meta.json + packages/react/src/ui/*   and   tenants/<id>/brand.json
 * Writes apps/docs/public/r/
 *   registry.json                 index of every item (shadcn registry schema, files without content)
 *   <component>.json              registry:ui — .tsx + .module.css inlined, side by side in the user's ui folder
 *   strata-tokens-<id>.json       registry:file — styles/strata-<id>.css (the --strata-* variables components read)
 *   theme-<id>.json               registry:theme — the shadcn bridge: a Strata palette as shadcn cssVars
 *   strata.json                   registry:style — "init": house tokens + ThemeScope
 *
 * Install:  npx shadcn@latest add <base>/r/button.json
 *      or   components.json → "registries": { "@strata": "<base>/r/{name}.json" }, then  npx shadcn@latest add @strata/button
 *
 * Options: --out <dir> (default apps/docs/public/r) · --pkg <dir> (default packages/react; for fixtures)
 *          --tenants <dir> (default tenants) · --base <url> (overrides STRATA_REGISTRY_URL)
 * Re-runnable; wipes --out first. Components with errors are skipped and reported; exit 1 if any.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '../../..');
const DEFAULT_PKG = path.resolve(here, '..');

const ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json';
const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json';
/** Where component files sit in the registry. The CLI keeps the part after "ui/" → <user ui alias>/<file>. */
const UI_PREFIX = 'registry/strata/ui';

/** Used when tenants/house/brand.json doesn't exist. Placeholder until Anuj picks the house brand. */
export const HOUSE_FALLBACK = {
  name: 'Strata',
  primary: '#1c2230',
  accent: '#2f6fed',
  neutral: 'neutral',
  shape: 'soft',
  typePair: 'precise',
  density: 'comfortable',
};

/** Imports a component file may use without listing them (always present in a React project). */
const IMPLICIT_PACKAGES = new Set(['react', 'react-dom']);

/* ------------------------------------------------------------------ helpers (also used by check-meta.mjs) */

function flag(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** "@scope/pkg/sub" → "@scope/pkg"; "pkg/sub" → "pkg". */
export function packageName(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Every module specifier in a TS/TSX source: import/export … from '…', import '…', import('…'). */
export function importSpecifiers(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const specs = new Set();
  const patterns = [
    /\b(?:import|export)\s[^'"`;]*?\sfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) for (const m of code.matchAll(re)) specs.add(m[1]);
  return [...specs];
}

/**
 * Checks that a component's files only import what a registry install can satisfy:
 * sibling files it ships, sibling components listed in registryDependencies, and npm packages listed in dependencies.
 * Returns human-readable problems.
 */
export function importProblems(meta, uiDir) {
  const problems = [];
  const own = new Set(meta.files ?? []);
  const deps = new Set((meta.dependencies ?? []).map(packageName));
  const regDeps = new Set(meta.registryDependencies ?? []);
  for (const file of meta.files ?? []) {
    if (!/\.(tsx?|jsx?)$/.test(file)) continue;
    const abs = path.join(uiDir, file);
    if (!existsSync(abs)) continue;
    for (const spec of importSpecifiers(readFileSync(abs, 'utf8'))) {
      if (spec.startsWith('./')) {
        const target = spec.slice(2);
        if (target.includes('/')) {
          problems.push(`${file}: import '${spec}' reaches into a folder — src/ui is flat`);
          continue;
        }
        if (/\.css$/.test(target)) {
          if (!own.has(target)) problems.push(`${file}: imports '${spec}' but meta.files doesn't list ${target}`);
          continue;
        }
        const base = target.replace(/\.(tsx?|jsx?)$/, '');
        if (own.has(`${base}.tsx`) || own.has(`${base}.ts`)) continue;
        if (!regDeps.has(base)) problems.push(`${file}: imports sibling '${spec}' — add "${base}" to registryDependencies`);
        continue;
      }
      if (spec.startsWith('../') || spec.startsWith('@/') || spec.startsWith('~/') || spec.startsWith('/')) {
        problems.push(`${file}: import '${spec}' breaks registry installs — use a sibling './<name>' import`);
        continue;
      }
      if (spec.startsWith('@strata/')) {
        problems.push(`${file}: import '${spec}' — components must not import the barrel or other Strata packages`);
        continue;
      }
      const pkg = packageName(spec);
      if (!IMPLICIT_PACKAGES.has(pkg) && !deps.has(pkg)) problems.push(`${file}: imports '${spec}' — add "${pkg}" to dependencies`);
    }
  }
  return problems;
}

/** Lists meta files: [{ name, file }] sorted by name. */
export function listMeta(metaDir) {
  if (!existsSync(metaDir)) return [];
  return readdirSync(metaDir)
    .filter((f) => f.endsWith('.meta.json'))
    .sort()
    .map((f) => ({ name: f.slice(0, -'.meta.json'.length), file: path.join(metaDir, f) }));
}

/* ------------------------------------------------------------------ structural validation of our own output */

const ITEM_TYPES = new Set([
  'registry:lib', 'registry:block', 'registry:component', 'registry:ui', 'registry:hook', 'registry:page',
  'registry:file', 'registry:theme', 'registry:style', 'registry:item', 'registry:base', 'registry:font',
]);
const ITEM_KEYS = new Set([
  '$schema', 'extends', 'name', 'type', 'title', 'author', 'description', 'dependencies', 'devDependencies',
  'registryDependencies', 'files', 'tailwind', 'cssVars', 'css', 'envVars', 'meta', 'docs', 'categories',
]);

/** Mirrors the shadcn registry-item schema (shadcn@4.21 zod schema) closely enough to catch our own mistakes. */
export function itemProblems(item, { inline }) {
  const p = [];
  const at = `item "${item?.name ?? '?'}"`;
  if (!item || typeof item !== 'object') return [`${at}: not an object`];
  for (const k of Object.keys(item)) if (!ITEM_KEYS.has(k)) p.push(`${at}: unknown key "${k}"`);
  if (typeof item.name !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(item.name)) p.push(`${at}: name must be kebab-case`);
  if (!ITEM_TYPES.has(item.type)) p.push(`${at}: bad type ${JSON.stringify(item.type)}`);
  for (const k of ['dependencies', 'devDependencies', 'registryDependencies', 'categories']) {
    if (item[k] !== undefined && !(Array.isArray(item[k]) && item[k].every((s) => typeof s === 'string'))) p.push(`${at}: ${k} must be string[]`);
  }
  for (const dep of item.registryDependencies ?? []) {
    if (!/^https?:\/\/.+\.json$/.test(dep)) p.push(`${at}: registryDependency "${dep}" is not a fully-qualified .json URL`);
  }
  if (item.files !== undefined) {
    if (!Array.isArray(item.files)) p.push(`${at}: files must be an array`);
    else
      item.files.forEach((f, i) => {
        if (typeof f.path !== 'string' || !f.path) p.push(`${at}: files[${i}].path missing`);
        if (!ITEM_TYPES.has(f.type) || f.type === 'registry:font') p.push(`${at}: files[${i}].type bad`);
        if ((f.type === 'registry:file' || f.type === 'registry:page') && typeof f.target !== 'string') p.push(`${at}: files[${i}] needs a target`);
        if (inline && typeof f.content !== 'string') p.push(`${at}: files[${i}].content missing`);
        if (!inline && f.content !== undefined) p.push(`${at}: files[${i}].content must not be in the index`);
        if (/(^|\/)\.\.(\/|$)/.test(f.path) || /(^|\/)\.\.(\/|$)/.test(f.target ?? '')) p.push(`${at}: files[${i}] path escapes the project`);
      });
  }
  if (item.cssVars !== undefined) {
    for (const [k, v] of Object.entries(item.cssVars)) {
      if (!['theme', 'light', 'dark'].includes(k)) p.push(`${at}: cssVars.${k} not allowed`);
      else if (!v || typeof v !== 'object' || !Object.values(v).every((x) => typeof x === 'string')) p.push(`${at}: cssVars.${k} must be Record<string,string>`);
    }
  }
  return p;
}

/* ------------------------------------------------------------------ build */

async function loadEngine() {
  // theme-engine ships TypeScript source; Vite (already a devDependency here) runs it without a build step.
  const { runnerImport } = await import('vite');
  const { module } = await runnerImport('@strata/theme-engine', { root: DEFAULT_PKG, configFile: false, logLevel: 'silent' });
  return module;
}

function findTenants(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(dir, d.name, 'brand.json')))
    .map((d) => d.name)
    .sort();
}

const json = (v) => JSON.stringify(v, null, 2) + '\n';

function table(rows) {
  const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => String(r[c]).length)));
  const line = (r) => r.map((cell, c) => String(cell).padEnd(widths[c])).join('  ').trimEnd();
  return [line(rows[0]), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.slice(1).map(line)].join('\n');
}

export async function buildRegistry({
  pkgDir = DEFAULT_PKG,
  outDir = path.join(REPO_ROOT, 'apps/docs/public/r'),
  tenantsDir = path.join(REPO_ROOT, 'tenants'),
  base = process.env.STRATA_REGISTRY_URL || 'http://localhost:3000',
} = {}) {
  base = base.replace(/\/+$/, '');
  const url = (name) => `${base}/r/${name}.json`;
  const uiDir = path.join(pkgDir, 'src/ui');
  const pkg = readJson(path.join(pkgDir, 'package.json'));
  const versions = { ...pkg.peerDependencies, ...pkg.dependencies };
  /** "react-aria-components" → "react-aria-components@^1.21.0" (the range we build and test against). */
  const pin = (dep) => (versions[dep] && !dep.slice(1).includes('@') ? `${dep}@${versions[dep]}` : dep);

  const items = [];
  const errors = [];
  const warnings = [];
  const rows = [['item', 'type', 'files', 'deps', 'registry deps', 'status']];

  /* ---- components ---- */
  const metas = listMeta(path.join(pkgDir, 'meta'));
  const metaNames = new Set(metas.map((m) => m.name));
  for (const { name, file } of metas) {
    const problems = [];
    let meta;
    try {
      meta = readJson(file);
    } catch (err) {
      errors.push(`${name}: meta is not valid JSON (${err.message})`);
      rows.push([name, 'registry:ui', '-', '-', '-', 'ERROR']);
      continue;
    }
    if (meta.name !== name) problems.push(`meta.name "${meta.name}" ≠ file name "${name}"`);
    if (!Array.isArray(meta.files) || meta.files.length === 0) problems.push('meta.files is empty');
    for (const f of meta.files ?? []) {
      if (f.includes('/')) problems.push(`files: "${f}" must be a flat file name in src/ui`);
      else if (!existsSync(path.join(uiDir, f))) problems.push(`files: src/ui/${f} does not exist`);
    }
    for (const dep of meta.registryDependencies ?? []) {
      if (!metaNames.has(dep)) problems.push(`registryDependencies: no meta for "${dep}"`);
    }
    problems.push(...importProblems(meta, uiDir));
    if (problems.length) {
      errors.push(...problems.map((p) => `${name}: ${p}`));
      rows.push([name, 'registry:ui', (meta.files ?? []).length, (meta.dependencies ?? []).length, (meta.registryDependencies ?? []).length, 'ERROR — skipped']);
      continue;
    }
    items.push({
      $schema: ITEM_SCHEMA,
      name,
      type: 'registry:ui',
      title: meta.title,
      description: meta.description,
      dependencies: (meta.dependencies ?? []).map(pin),
      registryDependencies: (meta.registryDependencies ?? []).map(url),
      files: meta.files.map((f) => ({
        path: `${UI_PREFIX}/${f}`,
        type: 'registry:ui',
        content: readFileSync(path.join(uiDir, f), 'utf8'),
      })),
      categories: meta.category ? [meta.category] : undefined,
      // The CLI prints `docs` once per item in the tree, so only leaves carry the hint (it still shows once per install).
      docs: (meta.registryDependencies ?? []).length
        ? undefined
        : `Strata components read --strata-* tokens. Install them once: npx shadcn@latest add ${url('strata')}`,
      meta: { maturity: meta.maturity, exports: meta.exports },
    });
    rows.push([name, 'registry:ui', meta.files.length, (meta.dependencies ?? []).length, (meta.registryDependencies ?? []).length, 'ok']);
  }
  if (existsSync(uiDir)) {
    for (const f of readdirSync(uiDir).filter((x) => x.endsWith('.tsx'))) {
      const n = f.slice(0, -4);
      if (!metaNames.has(n)) warnings.push(`${n}: src/ui/${f} has no meta/${n}.meta.json — not in the registry`);
    }
  }

  /* ---- tokens + shadcn themes ---- */
  const engine = await loadEngine();
  const brands = findTenants(tenantsDir).map((id) => [id, readJson(path.join(tenantsDir, id, 'brand.json'))]);
  if (!brands.some(([id]) => id === 'house')) brands.push(['house', HOUSE_FALLBACK]);
  for (const [id, brand] of brands) {
    const theme = engine.generateTheme(brand);
    const failed = theme.checks.filter((c) => !c.pass);
    if (failed.length) errors.push(`${id}: ${failed.length} contrast check(s) fail — not published`);
    // :root carries the tenant; ThemeScope elements without a theme attribute re-scope scheme/density;
    // [data-strata-theme="<id>"] keeps working when several tenant files are loaded (the last one is the default).
    const selector = `:root, [data-strata-theme="${id}"], [data-strata-scheme]:not([data-strata-theme])`;
    const css = engine.toCSS(theme, { selector });
    const fonts = engine.googleFontsHref(theme.typePair);
    items.push({
      $schema: ITEM_SCHEMA,
      name: `strata-tokens-${id}`,
      type: 'registry:file',
      title: `Strata tokens — ${theme.input.name}`,
      description: `Every --strata-* variable for ${theme.input.name} (light, dark, both densities). Import styles/strata-${id}.css once, at your app root.`,
      files: [{ path: `registry/strata/styles/strata-${id}.css`, type: 'registry:file', target: `styles/strata-${id}.css`, content: css }],
      docs:
        `Import the tokens once at your app root, e.g. import './styles/strata-${id}.css' (Vite: src/main.tsx; Next: app/layout.tsx). ` +
        `Dark mode: <html data-strata-scheme="dark"> or <ThemeScope scheme="dark">. Fonts: ${fonts}`,
      categories: ['tokens'],
    });
    rows.push([`strata-tokens-${id}`, 'registry:file', 1, 0, 0, failed.length ? 'CONTRAST FAIL' : 'ok']);

    const cssVars = engine.toShadcnCssVars(theme);
    items.push({
      $schema: ITEM_SCHEMA,
      name: `theme-${id}`,
      type: 'registry:theme',
      title: `${theme.input.name} (Strata) for shadcn/ui`,
      description: `The ${theme.input.name} palette from Strata as shadcn/ui variables — light and dark, contrast-checked to WCAG 2.2 AA.`,
      cssVars,
      categories: ['theme'],
    });
    rows.push([`theme-${id}`, 'registry:theme', 0, 0, 0, failed.length ? 'CONTRAST FAIL' : 'ok']);
  }

  /* ---- init item ---- */
  const initDeps = ['strata-tokens-house', 'theme-scope'];
  const missingInit = initDeps.filter((d) => !items.some((i) => i.name === d));
  if (missingInit.length) errors.push(`strata: init item needs ${missingInit.join(', ')}`);
  items.push({
    $schema: ITEM_SCHEMA,
    name: 'strata',
    type: 'registry:style',
    title: 'Strata',
    description: 'Strata base: the house tokens (styles/strata-house.css) and ThemeScope. Install once before any component.',
    registryDependencies: initDeps.map(url),
    categories: ['style'],
  });
  rows.push(['strata', 'registry:style', 0, 0, initDeps.length, missingInit.length ? 'ERROR' : 'ok']);

  /* ---- validate + write ---- */
  for (const item of items) {
    for (const k of Object.keys(item)) if (item[k] === undefined) delete item[k];
    errors.push(...itemProblems(item, { inline: true }));
    for (const dep of item.registryDependencies ?? []) {
      const name = dep.slice(base.length + 3, -5);
      if (!dep.startsWith(`${base}/r/`) || !items.some((i) => i.name === name)) errors.push(`${item.name}: registryDependency ${dep} is not built`);
    }
  }
  const names = items.map((i) => i.name);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length) errors.push(`duplicate item names: ${[...new Set(dupes)].join(', ')}`);

  const index = {
    $schema: REGISTRY_SCHEMA,
    name: 'strata',
    homepage: base,
    items: items.map(({ $schema, ...item }) => ({
      ...item,
      files: item.files?.map(({ content, ...f }) => f),
    })),
  };
  for (const item of index.items) {
    if (item.files === undefined) delete item.files;
    errors.push(...itemProblems(item, { inline: false }));
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const item of items) writeFileSync(path.join(outDir, `${item.name}.json`), json(item));
  writeFileSync(path.join(outDir, 'registry.json'), json(index));

  return { items, index, errors, warnings, rows, base, outDir };
}

async function main() {
  const pkgDir = path.resolve(flag('pkg') ?? DEFAULT_PKG);
  const result = await buildRegistry({
    pkgDir,
    outDir: path.resolve(flag('out') ?? path.join(REPO_ROOT, 'apps/docs/public/r')),
    tenantsDir: path.resolve(flag('tenants') ?? path.join(REPO_ROOT, 'tenants')),
    base: flag('base') ?? process.env.STRATA_REGISTRY_URL ?? 'http://localhost:3000',
  });
  console.log(table(result.rows));
  const shown = result.outDir.startsWith(REPO_ROOT) ? path.relative(REPO_ROOT, result.outDir) : result.outDir;
  console.log(`\n${result.items.length} item(s) + registry.json → ${shown}  (base ${result.base})`);
  if (result.warnings.length) console.warn(`\n! ${result.warnings.length} warning(s):\n  ${result.warnings.join('\n  ')}`);
  if (result.errors.length) {
    console.error(`\n✗ ${result.errors.length} error(s):\n  ${result.errors.join('\n  ')}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(err);
      process.exitCode = 1;
    },
  );
}
