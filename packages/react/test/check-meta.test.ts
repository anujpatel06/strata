import { describe, expect, it } from 'vitest';
// @ts-expect-error a plain .mjs script with no type declarations
import { deprecationProblems } from '../scripts/check-meta.mjs';

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
