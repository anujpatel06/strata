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
  const rows = [['component', 'maturity', 'files', 'exports', 'examples', 'deps', 'reg deps', 'errors', 'status']];
  const problems = [];
  const notes = [];
  for (const { name, file } of metas) {
    const { meta, errors, warnings } = checkMeta(name, file);
    const n = (v) => (Array.isArray(v) ? v.length : '-');
    rows.push([name, meta?.maturity ?? '-', n(meta?.files), n(meta?.exports), n(meta?.examples), n(meta?.dependencies), n(meta?.registryDependencies), errors.length, errors.length ? 'FAIL' : 'ok']);
    problems.push(...errors.map((e) => `${name}: ${e}`));
    notes.push(...warnings.map((w) => `${name}: ${w}`));
  }
  const withMeta = new Set(metas.map((m) => m.name));
  const orphans = existsSync(uiDir)
    ? readdirSync(uiDir).filter((f) => f.endsWith('.tsx')).map((f) => f.slice(0, -4)).filter((n) => !withMeta.has(n)).sort()
    : [];
  for (const n of orphans) {
    rows.push([n, '-', '-', '-', '-', '-', '-', 1, 'NO META']);
    problems.push(`${n}: src/ui/${n}.tsx has no meta/${n}.meta.json`);
  }

  console.log(table(rows));
  const ok = rows.slice(1).filter((r) => r.at(-1) === 'ok').length;
  console.log(`\n${ok}/${rows.length - 1} component(s) pass · ${metas.length} meta file(s) · ${orphans.length} component(s) without meta`);
  if (notes.length) console.warn(`\n! ${notes.length} warning(s):\n  ${notes.join('\n  ')}`);
  if (problems.length) {
    console.error(`\n✗ ${problems.length} error(s):\n  ${problems.join('\n  ')}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main();
