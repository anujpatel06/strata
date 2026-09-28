import { describe, expect, it } from 'vitest';
// @ts-expect-error a plain .mjs script with no type declarations
import { consumerImportsProblems, deprecationProblems, packageLookup, typeNoteProblems } from '../scripts/check-meta.mjs';

/** The record in meta/button.meta.json, which points at a codemod and an RFC that exist in this repo. */
const record = {
  since: '0.2.0',
  removal: '1.0.0',
  replacement: 'tone="danger"',
  reason: 'Status belongs in tone.',
  codemod: 'button-variant-danger-to-tone',
  rfc: '001-button-tone',
};
const problems = (change: Record<string, unknown>): string[] => deprecationProblems({ ...record, ...change }, 'd');

describe('check-meta: deprecation records (GOVERNANCE.md §5)', () => {
  it('accepts a complete record', () => {
    expect(problems({})).toEqual([]);
  });

  it('requires every field', () => {
    for (const key of Object.keys(record)) {
      expect(problems({ [key]: undefined }).some((p) => p.startsWith(`d.${key}: required`))).toBe(true);
    }
  });

  it('rejects a removal that isn’t later than since', () => {
    expect(problems({ since: '1.0.0', removal: '1.0.0' })).toContainEqual(expect.stringContaining('must be later than'));
  });

  it('rejects a removal in a minor or patch release', () => {
    expect(problems({ removal: '0.4.0' })).toContainEqual(expect.stringContaining("isn't a major release"));
    expect(problems({ removal: '1.0.1' })).toContainEqual(expect.stringContaining("isn't a major release"));
  });

  it('rejects versions that aren’t releases', () => {
    expect(problems({ since: 'next' })).toContainEqual(expect.stringContaining('must be a release like'));
  });

  it('rejects a codemod or an RFC that doesn’t exist', () => {
    expect(problems({ codemod: 'no-such-transform' })).toContainEqual(expect.stringContaining('does not exist'));
    expect(problems({ rfc: '999-nothing' })).toContainEqual(expect.stringContaining('does not exist'));
  });
});

/** The real packages/react install, so the name checks run against what consumers get. */
// The package folder. Vitest runs from it. Declared here because this package's tsconfig has no Node types.
declare const process: { cwd(): string };
const lookup = packageLookup(process.cwd());
const dateImport = {
  package: '@internationalized/date',
  names: ['parseDate', 'type DateValue'],
  why: 'Values are DateValue objects.',
};
const importsOf = (change: Record<string, unknown>, deps = ['@internationalized/date']): string[] =>
  consumerImportsProblems([{ ...dateImport, ...change }], deps, lookup);

describe('check-meta: imports (meta/schema.ts ImportDoc)', () => {
  it('accepts names the package exports, runtime and type-only', () => {
    expect(importsOf({})).toEqual([]);
  });

  it('rejects a name the package does not export', () => {
    expect(importsOf({ names: ['parseDate', 'parseDay'] })).toContainEqual(expect.stringContaining("doesn't export parseDay"));
    expect(importsOf({ names: ['type DateThing'] })).toContainEqual(expect.stringContaining("doesn't export the type DateThing"));
  });

  it('rejects a type listed as a runtime name', () => {
    expect(importsOf({ names: ['DateValue'] })).toContainEqual(expect.stringContaining("doesn't export DateValue"));
  });

  it('rejects a package that is not one of the component’s dependencies', () => {
    expect(importsOf({}, [])).toContainEqual(expect.stringContaining("isn't in dependencies"));
    expect(importsOf({ package: '@strata/react' })).toContainEqual(expect.stringContaining('already the import line'));
  });

  it('requires names and why, and rejects malformed or repeated names', () => {
    expect(importsOf({ names: [] })).toContainEqual(expect.stringContaining('names: required'));
    expect(importsOf({ why: '' })).toContainEqual(expect.stringContaining('why: required'));
    expect(importsOf({ why: 'x'.repeat(201) })).toContainEqual(expect.stringContaining('keep it under 200'));
    expect(importsOf({ names: ['parse Date'] })).toContainEqual(expect.stringContaining("isn't a name"));
    expect(importsOf({ names: ['parseDate', 'parseDate'] })).toContainEqual(expect.stringContaining('twice'));
  });

  it('rejects an empty list and a package that is not installed', () => {
    expect(consumerImportsProblems([], [], lookup)).toEqual(['imports: must be a non-empty array when present']);
    expect(importsOf({ package: 'no-such-package-xyz', names: ['a'] }, ['no-such-package-xyz'])).toContainEqual(expect.stringContaining("can't be resolved"));
  });
});

const props = [{ name: 'selectedKeys / defaultSelectedKeys' }, { name: 'onSelectionChange' }];
const notesOf = (change: Record<string, unknown>): string[] =>
  typeNoteProblems([{ prop: 'onSelectionChange', note: 'Called with a Set<Key>.', example: 'onSelectionChange={(keys) => f(keys)}', ...change }], props);

describe('check-meta: typeNotes (meta/schema.ts TypeNote)', () => {
  it('accepts a short note about a documented prop, and a note with no prop', () => {
    expect(notesOf({})).toEqual([]);
    expect(notesOf({ prop: undefined, example: undefined })).toEqual([]);
  });

  it('accepts either name of a prop documented as "a / b"', () => {
    expect(notesOf({ prop: 'defaultSelectedKeys' })).toEqual([]);
  });

  it('rejects a prop the meta does not document', () => {
    expect(notesOf({ prop: 'onChange' })).toContainEqual(expect.stringContaining("isn't a prop listed"));
  });

  it('keeps notes and examples short, and examples on one line', () => {
    expect(notesOf({ note: '' })).toContainEqual(expect.stringContaining('note: required'));
    expect(notesOf({ note: 'x'.repeat(301) })).toContainEqual(expect.stringContaining('keep it under 300'));
    expect(notesOf({ example: 'a\nb' })).toContainEqual(expect.stringContaining('one line'));
    expect(notesOf({ example: 'x'.repeat(201) })).toContainEqual(expect.stringContaining('keep it under 200'));
  });

  it('rejects an empty list', () => {
    expect(typeNoteProblems([], props)).toEqual(['typeNotes: must be a non-empty array when present']);
  });
});
