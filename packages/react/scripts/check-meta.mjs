#!/usr/bin/env node
/**
 * Validates every packages/react/meta/<name>.meta.json against meta/schema.ts and the files it points at.
 *
 *   pnpm check:meta          (repo root; = node packages/react/scripts/check-meta.mjs)
 *
 * Per meta: required fields and types · name = file name · files exist in src/ui · every listed export is exported
 * by the component's .tsx · props[].component is a listed export · examples exist in apps/docs/examples/<name>/ and
 * the first is <name>-demo · registryDependencies have metas · imports match dependencies/registryDependencies
 * (the same rules the registry build enforces). Also flags src/ui/*.tsx files with no meta.
 * Prints a table, then every problem. Exit 1 on any error. Options: --pkg <dir>, --examples <dir>.
 *
 * Maturity criteria (the "Maturity" section of apps/docs/content/docs/governance.mdx; keep the two in step):
 *   alpha  = the floor: ≥3 examples · a test file · if meta lists keyboard interactions, a test drives the keyboard.
 *   beta   = alpha + imported from '@strata/react' by a block (apps/docs/blocks/**) or the homepage showcase.
 *   stable = beta + published on npm + a dated manual accessibility review (meta.review.a11y).
 * A declared beta or stable that misses a criterion is an error. A declared alpha that misses the floor is a warning:
 * there is no lower level to move it to, so the gap is listed until someone closes it. Axe (0 violations on the docs
 * page, light and dark) and the five-tenant render are browser checks: scripts/axe-sweep.mjs and the playground, not this file.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REPO_ROOT, importProblems, listMeta, readJson } from './build-registry.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const flag = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const pkgDir = path.resolve(flag('pkg') ?? path.resolve(here, '..'));
const examplesDir = path.resolve(flag('examples') ?? path.join(REPO_ROOT, 'apps/docs/examples'));
const uiDir = path.join(pkgDir, 'src/ui');

const CATEGORIES = ['actions', 'inputs', 'overlays', 'feedback', 'display', 'navigation', 'data', 'layout'];
const MATURITY = ['alpha', 'beta', 'stable'];

/**
 * @strata/react has never been published to npm (0.1.0 is built, not released), so nothing may be declared stable.
 * package.json can't tell us this: it has publishConfig ready and no `private` flag, on purpose. Flip this to true
 * in the release that actually publishes the package.
 */
const PUBLISHED_ON_NPM = false;
const MIN_EXAMPLES = 3;
const blocksDir = path.join(REPO_ROOT, 'apps/docs/blocks');
const showcaseDir = path.join(REPO_ROOT, 'apps/docs/components/showcase');
const testDir = path.join(pkgDir, 'test');

/** Every name imported from '@strata/react' by a block or the homepage showcase → the files that import it. */
function productUsage() {
  const walk = (dir) =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.tsx') ? [path.join(dir, e.name)] : [],
        )
      : [];
  const files = [...walk(blocksDir), ...(existsSync(showcaseDir) ? readdirSync(showcaseDir).filter((f) => f.endsWith('.tsx')).map((f) => path.join(showcaseDir, f)) : [])];
  const used = new Map();
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const m of source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@strata\/react['"]/g)) {
      for (const part of m[1].split(',')) {
        const n = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0];
        if (!n) continue;
        if (!used.has(n)) used.set(n, new Set());
        used.get(n).add(path.relative(REPO_ROOT, file));
      }
    }
  }
  return used;
}

/** A test "drives the keyboard" if it presses keys: user.keyboard(), user.tab() or fireEvent.keyDown/keyUp. */
const drivesKeyboard = (source) => /\.keyboard\(|\.tab\(|fireEvent\.key(?:Down|Up)\(/.test(source);

/**
 * The criteria each level adds, as plain-words failures (empty = met). Not cumulative: beta's list is only what beta adds.
 */
function maturityGaps(meta, usage) {
  const alpha = [];
  const beta = [];
  const stable = [];
  const examples = Array.isArray(meta.examples) ? meta.examples.length : 0;
  if (examples < MIN_EXAMPLES) alpha.push(`has ${examples} example(s); alpha needs at least ${MIN_EXAMPLES}`);
  const testFile = path.join(testDir, `${meta.name}.test.tsx`);
  const testSource = existsSync(testFile) ? readFileSync(testFile, 'utf8') : null;
  if (testSource === null) alpha.push(`has no test file (test/${meta.name}.test.tsx)`);
  const keys = meta.accessibility?.keyboard?.length ?? 0;
  if (testSource !== null && keys > 0 && !drivesKeyboard(testSource)) {
    alpha.push(`meta lists ${keys} keyboard interaction(s) but no test presses a key`);
  }
  const exports = isStrArr(meta.exports) ? meta.exports : [];
  const where = new Set(exports.flatMap((e) => [...(usage.get(e) ?? [])]));
  if (where.size === 0) beta.push('is not used in any block or the homepage showcase');
  if (!PUBLISHED_ON_NPM) stable.push('@strata/react is not published on npm yet, so nothing can be stable');
  if (!isStr(meta.review?.a11y)) stable.push('has no recorded manual accessibility review (review.a11y)');
  return { alpha, beta, stable, usedIn: [...where].sort() };
}

/** The highest level whose criteria (and every lower level's) are met; 'none' if even alpha's floor isn't. */
function levelMet(gaps) {
  if (gaps.alpha.length) return 'none';
  if (gaps.beta.length) return 'alpha';
  if (gaps.stable.length) return 'beta';
  return 'stable';
}

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string');

/** Names a TS/TSX module exports: declarations, `export { A, B as C, type D }` lists and re-exports. */
export function exportedNames(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const names = new Set();
  const decl = /\bexport\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|interface|type|enum|abstract\s+class)\s+([A-Za-z_$][\w$]*)/g;
  for (const m of code.matchAll(decl)) names.add(m[1]);
  for (const m of code.matchAll(/\bexport\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const s = part.trim().replace(/^type\s+/, '');
      if (!s) continue;
      const alias = /\bas\s+([A-Za-z_$][\w$]*)$/.exec(s);
      names.add(alias ? alias[1] : s.split(/\s+/)[0]);
    }
  }
  return names;
}

function checkMeta(name, file) {
  const errors = [];
  const warnings = [];
  let meta;
  try {
    meta = readJson(file);
  } catch (err) {
    return { meta: null, errors: [`not valid JSON: ${err.message}`], warnings };
  }

  // Required fields and shapes (meta/schema.ts).
  for (const k of ['name', 'title', 'description', 'usage']) if (!isStr(meta[k])) errors.push(`${k}: required non-empty string`);
  if (!CATEGORIES.includes(meta.category)) errors.push(`category: must be one of ${CATEGORIES.join(' | ')}`);
  if (!MATURITY.includes(meta.maturity)) errors.push(`maturity: must be one of ${MATURITY.join(' | ')}`);
  for (const k of ['exports', 'files', 'dependencies', 'registryDependencies', 'tokens']) {
    if (!isStrArr(meta[k])) errors.push(`${k}: required string[]`);
  }
  for (const k of ['exports', 'files']) if (isStrArr(meta[k]) && meta[k].length === 0) errors.push(`${k}: must not be empty`);
  if (meta.reactAria !== undefined && !isStr(meta.reactAria)) errors.push('reactAria: must be a string when present');
  if (!Array.isArray(meta.examples) || meta.examples.length === 0) errors.push('examples: required, at least one');
  else meta.examples.forEach((e, i) => {
    if (!isStr(e?.name) || !isStr(e?.title)) errors.push(`examples[${i}]: needs name and title`);
  });
  if (!Array.isArray(meta.props)) errors.push('props: required array');
  else meta.props.forEach((p, i) => {
    for (const k of ['component', 'name', 'type', 'description']) if (!isStr(p?.[k])) errors.push(`props[${i}].${k}: required string`);
  });
  const a11y = meta.accessibility;
  if (!a11y || !Array.isArray(a11y.keyboard) || !isStrArr(a11y.notes)) errors.push('accessibility: needs keyboard[] and notes[]');
  else a11y.keyboard.forEach((k, i) => {
    if (!isStr(k?.keys) || !isStr(k?.action)) errors.push(`accessibility.keyboard[${i}]: needs keys and action`);
  });
  if (!meta.guidelines || !isStrArr(meta.guidelines.do) || !isStrArr(meta.guidelines.dont)) errors.push('guidelines: needs do[] and dont[]');
  if (meta.review !== undefined) {
    const date = meta.review?.a11y;
    if (typeof meta.review !== 'object' || meta.review === null) errors.push('review: must be an object when present');
    else if (date !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))) errors.push(`review.a11y: "${date}" must be a YYYY-MM-DD date`);
    else if (date !== undefined && Date.parse(date) > Date.now()) errors.push(`review.a11y: ${date} is in the future`);
  }

  // Identity.
  if (meta.name !== name) errors.push(`name: "${meta.name}" must equal the file name "${name}"`);

  // Files exist, flat.
  const files = isStrArr(meta.files) ? meta.files : [];
  for (const f of files) {
    if (f.includes('/')) errors.push(`files: "${f}" must be a flat file name in src/ui`);
    else if (!existsSync(path.join(uiDir, f))) errors.push(`files: src/ui/${f} does not exist`);
  }
  if (!files.includes(`${name}.tsx`)) errors.push(`files: must include ${name}.tsx`);

  // Exports exist in the component's TSX files.
  const exported = new Set();
  for (const f of files.filter((x) => /\.tsx?$/.test(x))) {
    const abs = path.join(uiDir, f);
    if (existsSync(abs)) for (const n of exportedNames(readFileSync(abs, 'utf8'))) exported.add(n);
  }
  if (exported.size) {
    for (const e of isStrArr(meta.exports) ? meta.exports : []) {
      if (!exported.has(e)) errors.push(`exports: "${e}" is not exported by ${files.filter((x) => /\.tsx?$/.test(x)).join(', ')}`);
    }
  }
  const listed = new Set(isStrArr(meta.exports) ? meta.exports : []);
  for (const p of Array.isArray(meta.props) ? meta.props : []) {
    if (isStr(p?.component) && !listed.has(p.component)) errors.push(`props: component "${p.component}" is not in exports`);
  }

  // Examples exist; first is the hero.
  const examples = Array.isArray(meta.examples) ? meta.examples : [];
  if (examples.length && examples[0]?.name !== `${name}-demo`) errors.push(`examples[0]: must be "${name}-demo" (got "${examples[0]?.name}")`);
  for (const e of examples) {
    if (isStr(e?.name) && !existsSync(path.join(examplesDir, name, `${e.name}.tsx`))) {
      errors.push(`examples: apps/docs/examples/${name}/${e.name}.tsx does not exist`);
    }
  }
  const exDir = path.join(examplesDir, name);
  if (existsSync(exDir)) {
    const known = new Set(examples.map((e) => e?.name));
    for (const f of readdirSync(exDir).filter((x) => x.endsWith('.tsx'))) {
      if (!known.has(f.slice(0, -4))) warnings.push(`examples: ${f} exists but isn't listed in meta.examples`);
    }
  }

  // Registry dependencies + imports.
  for (const dep of isStrArr(meta.registryDependencies) ? meta.registryDependencies : []) {
    if (!existsSync(path.join(pkgDir, 'meta', `${dep}.meta.json`))) errors.push(`registryDependencies: no meta/${dep}.meta.json`);
    if (dep === name) errors.push('registryDependencies: lists itself');
  }
  if (isStrArr(meta.files)) errors.push(...importProblems(meta, uiDir));
  if (isStr(meta.usage) && !/from ['"]@strata\/react['"]/.test(meta.usage)) warnings.push("usage: should import from '@strata/react'");

  return { meta, errors, warnings, exported };
}

function table(rows) {
  const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => String(r[c]).length)));
  const line = (r) => r.map((cell, c) => String(cell).padEnd(widths[c])).join('  ').trimEnd();
  return [line(rows[0]), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.slice(1).map(line)].join('\n');
}

function main() {
  const metas = listMeta(path.join(pkgDir, 'meta'));
  const usage = productUsage();
  const rows = [['component', 'maturity', 'meets', 'files', 'exports', 'examples', 'deps', 'reg deps', 'errors', 'status']];
  const problems = [];
  const notes = [];
  const maturityNotes = [];
  for (const { name, file } of metas) {
    const { meta, errors, warnings } = checkMeta(name, file);
    let met = '-';
    if (meta && MATURITY.includes(meta.maturity)) {
      // Maturity criteria: a declared level must be met; the floor (alpha) can only be flagged.
      const gaps = maturityGaps(meta, usage);
      met = levelMet(gaps);
      const required = { alpha: ['alpha'], beta: ['alpha', 'beta'], stable: ['alpha', 'beta', 'stable'] }[meta.maturity];
      for (const level of required) {
        for (const gap of gaps[level]) {
          if (level === 'alpha' && meta.maturity === 'alpha') maturityNotes.push(`${name}: below the alpha bar: ${gap}`);
          else errors.push(`maturity: declared ${meta.maturity}, but ${gap} (${level === "alpha" ? "an" : "a"} ${level} criterion)`);
        }
      }
      if (meta.maturity === 'alpha' && met === 'beta') maturityNotes.push(`${name}: declared alpha but meets beta (used in ${gaps.usedIn.length} block/showcase file(s)); promote it if the API is settled`);
    }
    const n = (v) => (Array.isArray(v) ? v.length : '-');
    rows.push([name, meta?.maturity ?? '-', met, n(meta?.files), n(meta?.exports), n(meta?.examples), n(meta?.dependencies), n(meta?.registryDependencies), errors.length, errors.length ? 'FAIL' : 'ok']);
    problems.push(...errors.map((e) => `${name}: ${e}`));
    notes.push(...warnings.map((w) => `${name}: ${w}`));
  }
  const withMeta = new Set(metas.map((m) => m.name));
  const orphans = existsSync(uiDir)
    ? readdirSync(uiDir).filter((f) => f.endsWith('.tsx')).map((f) => f.slice(0, -4)).filter((n) => !withMeta.has(n)).sort()
    : [];
  for (const n of orphans) {
    rows.push([n, '-', '-', '-', '-', '-', '-', '-', 1, 'NO META']);
    problems.push(`${n}: src/ui/${n}.tsx has no meta/${n}.meta.json`);
  }

  console.log(table(rows));
  const ok = rows.slice(1).filter((r) => r.at(-1) === 'ok').length;
  console.log(`\n${ok}/${rows.length - 1} component(s) pass · ${metas.length} meta file(s) · ${orphans.length} component(s) without meta`);
  const levels = Object.fromEntries(MATURITY.map((l) => [l, rows.slice(1).filter((r) => r[1] === l).length]));
  console.log(`maturity: ${MATURITY.map((l) => `${levels[l]} ${l}`).join(' · ')} (criteria: apps/docs/content/docs/governance.mdx#maturity)`);
  if (maturityNotes.length) console.warn(`\n! ${maturityNotes.length} maturity note(s) (not errors):\n  ${maturityNotes.join('\n  ')}`);
  if (notes.length) console.warn(`\n! ${notes.length} warning(s):\n  ${notes.join('\n  ')}`);
  if (problems.length) {
    console.error(`\n✗ ${problems.length} error(s):\n  ${problems.join('\n  ')}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main();
