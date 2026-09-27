import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auditPaths } from '../src/index';
import { collectFiles, globToRegExp } from '../src/paths';

let root: string;
const RED = '.a { color: #ff0000; }\n';

beforeAll(() => {
  root = realpathSync(mkdtempSync(path.join(tmpdir(), 'strata-audit-')));
  const files: Record<string, string> = {
    'src/app.css': RED,
    'src/page.tsx': 'export const A = () => <a href="/x">x</a>;\n',
    'src/plain.ts': 'export const x = 1;\n',
    'src/legacy/old.css': RED,
    'src/dist/out.css': RED,
    'src/build/out.css': RED,
    'src/node_modules/pkg/index.css': RED,
    'src/.next/x.css': RED,
    'src/.next-agent/x.css': RED,
    'src/fixtures/f.css': RED,
    'src/examples.generated.tsx': 'export const A = () => <a href="/x">x</a>;\n',
  };
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), text);
  }
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('collectFiles', () => {
  it('finds tsx and css, and always skips node_modules, dist, build, .next*, *.generated.* and fixtures', () => {
    expect(collectFiles(['src'], [], root)).toEqual(['src/app.css', 'src/legacy/old.css', 'src/page.tsx']);
  });

  it('skips what --ignore names, as a folder or a glob', () => {
    expect(collectFiles(['src'], ['**/legacy/**'], root)).toEqual(['src/app.css', 'src/page.tsx']);
    expect(collectFiles(['src'], ['legacy/'], root)).toEqual(['src/app.css', 'src/page.tsx']);
    expect(collectFiles(['src'], ['*.css'], root)).toEqual(['src/page.tsx']);
    expect(collectFiles(['src'], ['src/page.tsx'], root)).toEqual(['src/app.css', 'src/legacy/old.css']);
  });

  it('takes single files, and still skips an ignored one', () => {
    expect(collectFiles(['src/app.css', 'src/dist/out.css', 'src/plain.ts'], [], root)).toEqual(['src/app.css']);
  });

  it('throws for a path that does not exist', () => {
    expect(() => collectFiles(['nope'], [], root)).toThrow();
  });
});

describe('globToRegExp', () => {
  it('** crosses folders, * does not', () => {
    expect(globToRegExp('**/dist/**').test('a/b/dist/c/d.css')).toBe(true);
    expect(globToRegExp('**/dist/**').test('dist/d.css')).toBe(true);
    expect(globToRegExp('**/dist/**').test('a/distant/d.css')).toBe(false);
    expect(globToRegExp('src/*.css').test('src/a.css')).toBe(true);
    expect(globToRegExp('src/*.css').test('src/a/b.css')).toBe(false);
    expect(globToRegExp('**/.next*/**').test('apps/docs/.next-agent/x.css')).toBe(true);
  });
});

describe('auditPaths', () => {
  it('adds up files, lines, opportunities and findings, and scores them', () => {
    const r = auditPaths([path.join(root, 'src')]);
    expect(r.stats.files).toBe(3);
    expect(r.stats.lines).toBe(3);
    expect(r.findings.map((f) => f.rule).sort()).toEqual(['native-element', 'raw-color', 'raw-color']);
    expect(r.stats.opportunitiesByRule).toEqual({ 'raw-color': 2, 'native-element': 1 });
    expect(r.stats.opportunities).toBe(3);
    expect(r.score).toBe(0);
    expect(r.findings.every((f) => f.file.endsWith('.css') || f.file.endsWith('.tsx'))).toBe(true);
  });
});
