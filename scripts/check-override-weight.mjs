#!/usr/bin/env node
/**
 * Docs styles that restyle a Syntara component must outweigh the component's own rule.
 *
 *   node scripts/check-override-weight.mjs          report, exit 1 on any finding
 *   node scripts/check-override-weight.mjs --fix    double the class in the stylesheet
 *
 * Why: a class passed to a Syntara component (`<Card className={styles.promo}>`) lands on the same element as the
 * component's own class. `.promo` and the component's `.root` weigh the same, so whichever stylesheet the bundler
 * emits later wins, and that order changes when the import graph changes. On 2026-09-28 adding one package to the
 * site reordered the stylesheets and the Portfolio block grew 8,000px wide.
 * Writing the class twice (`.promo.promo`) makes the site's rule win in any order. This script finds single-class
 * selectors for classes that are passed to a component imported from '@syntara/react' in the same folder's TSX.
 *
 * It reads `import styles from './x.module.css'` and `styles.name` inside the opening tag of a Syntara component.
 * It can't see a class that reaches a component some other way (a variable, a helper, a spread).
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['apps/docs/app', 'apps/docs/components', 'apps/docs/blocks'];
const fix = process.argv.includes('--fix');

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? (f === 'node_modules' || f.startsWith('.next') ? [] : walk(p)) : p.endsWith('.tsx') ? [p] : [];
  });

/** Class names from a stylesheet that the TSX passes to a Syntara component. */
function classesOnComponents(source) {
  const components = new Set();
  for (const m of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@syntara\/react['"]/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim();
      if (name && !name.startsWith('type ')) components.add(name.split(/\s+as\s+/).at(-1));
    }
  }
  const used = new Set();
  // An opening tag, allowing two levels of braces in its attributes.
  for (const tag of source.matchAll(/<([A-Z]\w*)\b((?:[^<>{}]|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*)>/g)) {
    if (!components.has(tag[1])) continue;
    for (const c of tag[2].matchAll(/\bstyles\.(\w+)/g)) used.add(c[1]);
  }
  return used;
}

/** Rewrites `.name` to `.name.name` in selectors, leaving declarations, comments and already-doubled classes alone. */
function double(css, names) {
  const found = new Map();
  let out = '';
  let i = 0;
  let depthIsSelector = true;
  const single = (name) => new RegExp(`\\.${name}(?![\\w-])`, 'g');
  // Walk the text in chunks: comments are copied, `{ … }` declaration blocks are copied, selectors are rewritten.
  const chunks = css.split(/(\/\*[\s\S]*?\*\/)/);
  let inDeclarations = 0;
  for (const chunk of chunks) {
    if (chunk.startsWith('/*')) {
      out += chunk;
      continue;
    }
    // Split into selector text and declaration text by tracking braces and at-rules.
    let buf = '';
    const flush = (isSelector) => {
      if (!isSelector) {
        out += buf;
      } else {
        let text = buf;
        for (const name of names) {
          text = text.replace(single(name), (m, offset, whole) => {
            const before = whole.slice(0, offset);
            const after = whole.slice(offset + m.length);
            if (after.startsWith(`.${name}`) && !/^[\w-]/.test(after.slice(name.length + 1))) return m; // first half of a doubled class
            if (before.endsWith(`.${name}`)) return m; // second half
            found.set(name, (found.get(name) ?? 0) + 1);
            return `${m}${m}`;
          });
        }
        out += text;
      }
      buf = '';
    };
    for (const ch of chunk) {
      if (ch === '{') {
        // Text before `{` is a selector unless it's an at-rule prelude that holds rules (@media, @supports, @container, @layer).
        const prelude = buf.trim();
        const holdsRules = /^@(media|supports|container|layer|scope|starting-style)\b/.test(prelude);
        const isKeyframes = /^@(keyframes|font-face|property)\b/.test(prelude);
        flush(inDeclarations === 0 && !prelude.startsWith('@'));
        out += ch;
        if (holdsRules) stack.push('rules');
        else {
          stack.push(isKeyframes ? 'raw' : 'decl');
          inDeclarations++;
        }
      } else if (ch === '}') {
        flush(false);
        out += ch;
        const kind = stack.pop();
        if (kind !== 'rules') inDeclarations--;
      } else buf += ch;
    }
    flush(false);
  }
  void i;
  void depthIsSelector;
  return { css: out, found };
}
const stack = [];

let total = 0;
let files = 0;
for (const dir of DIRS) {
  for (const tsx of walk(path.join(ROOT, dir))) {
    const source = readFileSync(tsx, 'utf8');
    const m = /import\s+styles\s+from\s+['"]\.\/([\w.-]+\.module\.css)['"]/.exec(source);
    if (!m) continue;
    const cssFile = path.join(path.dirname(tsx), m[1]);
    let css;
    try {
      css = readFileSync(cssFile, 'utf8');
    } catch {
      continue;
    }
    const names = classesOnComponents(source);
    if (names.size === 0) continue;
    stack.length = 0;
    const { css: next, found } = double(css, [...names]);
    if (found.size === 0) continue;
    files++;
    const count = [...found.values()].reduce((a, b) => a + b, 0);
    total += count;
    console.log(`${path.relative(ROOT, cssFile)}: ${[...found.keys()].sort().map((n) => `.${n}`).join(' ')}`);
    if (fix) writeFileSync(cssFile, next);
  }
}
if (total === 0) console.log('Every style that restyles a Syntara component outweighs the component’s own rule.');
else console.log(`\n${total} selector(s) in ${files} file(s) weigh the same as the component they restyle.${fix ? ' Doubled.' : ' Run with --fix, then check the pages.'}`);
process.exitCode = total > 0 && !fix ? 1 : 0;
