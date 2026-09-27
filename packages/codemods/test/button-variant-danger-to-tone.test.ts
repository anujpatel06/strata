import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jscodeshift, { type Options } from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import transform from '../transforms/button-variant-danger-to-tone';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/button-variant-danger-to-tone');

/** Runs the transform on a fixture. `output` is undefined when the transform leaves the file alone. */
function run(name: string, options: Options = {}) {
  const file = path.join(fixtures, `${name}.input.tsx`);
  const source = readFileSync(file, 'utf8');
  const reports: string[] = [];
  const j = jscodeshift.withParser('tsx');
  const output = transform({ path: `${name}.input.tsx`, source }, { jscodeshift: j, j, stats: () => {}, report: (m) => reports.push(m) }, options);
  const expectedFile = path.join(fixtures, `${name}.output.tsx`);
  const expected = existsSync(expectedFile) ? readFileSync(expectedFile, 'utf8') : undefined;
  const notes = reports.join('\n').split('\n').map((l) => l.trim()).filter(Boolean);
  return { source, output, expected, notes };
}

describe('button-variant-danger-to-tone', () => {
  it('rewrites a literal danger variant, as a string, an expression or a template, and keeps other props', () => {
    const { output, expected, notes } = run('basic');
    expect(output).toBe(expected);
    expect(notes).toEqual([]);
  });

  it('follows renamed imports, namespace imports and the per-component entry; leaves other components alone', () => {
    const { output, expected, notes } = run('renamed-and-namespace');
    expect(output).toBe(expected);
    expect(notes).toEqual([]);
  });

  it('leaves a Button from another library alone and reports nothing', () => {
    const { output, notes } = run('other-library');
    expect(output).toBeUndefined();
    expect(notes).toEqual([]);
  });

  it('reports what it can’t be sure of, with file and line, and changes nothing', () => {
    const { output, notes } = run('unsure');
    expect(output).toBeUndefined();
    expect(notes).toEqual([
      expect.stringMatching(/^unsure\.input\.tsx:8 {2}variant is an expression/),
      expect.stringMatching(/^unsure\.input\.tsx:9 {2}variant is an expression/),
      expect.stringMatching(/^unsure\.input\.tsx:10 {2}props arrive through a spread/),
      expect.stringMatching(/^unsure\.input\.tsx:11 {2}a spread after variant may override it/),
      expect.stringMatching(/^unsure\.input\.tsx:14 {2}has variant="danger" and a tone already/),
      expect.stringMatching(/^unsure\.input\.tsx:17 {2}Button is created with a props object/),
    ]);
  });

  it('rewrites the sure cases and reports the rest in the same file', () => {
    const { output, expected, notes } = run('mixed');
    expect(output).toBe(expected);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatch(/^mixed\.input\.tsx:9 {2}variant is an expression/);
  });

  it('ignores a registry install by default and rewrites it with --source', () => {
    expect(run('registry-install').output).toBeUndefined();
    const { output, expected } = run('registry-install', { source: '@/components/ui/button' });
    expect(output).toBe(expected);
  });

  it('stays quiet about a choice between literals when none of them is danger', () => {
    const { output, notes } = run('never-danger');
    expect(output).toBeUndefined();
    expect(notes).toEqual([expect.stringMatching(/^never-danger\.input\.tsx:11 {2}variant is an expression/)]);
  });

  it('is idempotent: a second run changes nothing', () => {
    const { output } = run('basic');
    const j = jscodeshift.withParser('tsx');
    const again = transform({ path: 'again.tsx', source: output! }, { jscodeshift: j, j, stats: () => {}, report: () => {} }, {});
    expect(again).toBeUndefined();
  });
});
