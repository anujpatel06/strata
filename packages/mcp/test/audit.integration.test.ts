/**
 * The one test that uses the real auditor. It is skipped, with the reason printed, while '@strata/audit'
 * doesn't export auditSource, scoreOf and findToken.
 *
 *   pnpm --filter @strata/mcp test audit.integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auditorAvailable } from '../src/audit-bridge';
import { connect, type Harness } from './helpers';

const available = await auditorAvailable();
if (!available.ok) {
  process.stdout.write(`SKIPPED: real-auditor integration test. ${available.reason}\n`);
}

describe.skipIf(!available.ok)('audit_snippet and find_token with the real @strata/audit', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await connect();
  });
  afterAll(async () => {
    await h.close();
  });

  it('finds a raw colour in CSS, offers a fix with a safe flag, and scores below 100', async () => {
    const r = await h.call('audit_snippet', { code: '.card {\n  color: #1f56e0;\n}\n', language: 'css' });
    expect(r.isError, r.text).toBe(false);
    expect(r.json.score).toBeGreaterThanOrEqual(0);
    expect(r.json.score).toBeLessThan(100);
    const finding = r.json.findings.find((f: { rule: string }) => f.rule === 'raw-color');
    expect(finding).toBeDefined();
    expect(finding.line).toBe(2);
    expect(typeof finding.message).toBe('string');
    expect(typeof finding.fix.description).toBe('string');
    expect(typeof finding.fix.safe).toBe('boolean');
  });

  it('scores clean code 100 with no findings', async () => {
    const r = await h.call('audit_snippet', { code: '.card {\n  color: var(--strata-color-text-default);\n}\n', language: 'css' });
    expect(r.isError, r.text).toBe(false);
    expect(r.json).toEqual({ score: 100, findings: [] });
  });

  it('finds a token for a value that get_tokens returns, under the same name', async () => {
    const tokens = (await h.call('get_tokens', { category: 'color' })).json.tokens as Array<{ token: string; cssVar: string; value: string }>;
    const target = tokens.find((t) => t.token === 'color.action.primary.bg')!;
    const r = await h.call('find_token', { value: target.value, category: 'color' });
    expect(r.isError, r.text).toBe(false);
    expect(r.json.exact).toBe(true);
    expect(r.json.distance).toBe(0);
    expect(r.json.value).toBe(target.value);
    // Several roles can share one value, so check the match against the whole list.
    expect(tokens).toContainEqual({ token: r.json.token, cssVar: r.json.cssVar, value: r.json.value });
  });
});
