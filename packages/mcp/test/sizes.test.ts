/**
 * Response sizes. Agents pay for every byte, so each response has a budget, and the measured sizes are printed.
 *
 *   pnpm --filter @strata/mcp test sizes
 *
 * A budget is a ceiling with some room over the size measured when it was set. If a response outgrows it, look at
 * what was added before raising the number.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { connect, type Harness } from './helpers';

vi.mock('../src/audit-bridge', async (original) => ({
  ...(await original<typeof import('../src/audit-bridge')>()),
  audit: async () => ({ findings: [], stats: { files: 1, lines: 1, opportunities: 0 }, score: 100 }),
  nearestToken: async () => null,
}));

const BUDGETS: Array<{ label: string; tool: string; args: Record<string, unknown>; budget: number }> = [
  { label: 'list_components (all)', tool: 'list_components', args: {}, budget: 12_000 },
  { label: 'get_component button', tool: 'get_component', args: { name: 'button' }, budget: 8_000 },
  { label: 'get_tokens (no category)', tool: 'get_tokens', args: {}, budget: 400 },
  { label: 'get_tokens color', tool: 'get_tokens', args: { category: 'color' }, budget: 5_500 },
  { label: 'get_tokens space', tool: 'get_tokens', args: { category: 'space' }, budget: 900 },
  { label: 'get_pattern (list)', tool: 'get_pattern', args: {}, budget: 2_500 },
  { label: 'get_pattern settings', tool: 'get_pattern', args: { name: 'settings' }, budget: 1_500 },
  { label: 'get_example button', tool: 'get_example', args: { component: 'button' }, budget: 1_500 },
];

describe('response sizes', () => {
  let h: Harness;
  const rows: string[] = [];
  beforeAll(async () => {
    h = await connect();
  });
  afterAll(async () => {
    process.stdout.write(['Measured response sizes (UTF-8 bytes of the JSON text):', ...rows].join('\n') + '\n');
    await h.close();
  });

  for (const { label, tool, args, budget } of BUDGETS) {
    it(`${label} stays under ${budget} bytes`, async () => {
      const r = await h.call(tool, args);
      rows.push(`  ${label.padEnd(28)} ${String(r.bytes).padStart(6)}  (budget ${budget})`);
      expect(r.isError).toBe(false);
      expect(r.bytes).toBeLessThanOrEqual(budget);
    });
  }

  it('list_components covers every meta file', async () => {
    const r = await h.call('list_components');
    expect(r.json.count).toBe(53);
  });

  it('responses are compact JSON: no indentation or line breaks between fields', async () => {
    const r = await h.call('get_component', { name: 'button' });
    expect(r.text).toBe(JSON.stringify(JSON.parse(r.text)));
  });

  it('the largest component response stays under 16,000 bytes', async () => {
    const names: string[] = (await h.call('list_components')).json.components.map((c: { name: string }) => c.name);
    let max = { name: '', bytes: 0 };
    for (const name of names) {
      const r = await h.call('get_component', { name });
      expect(r.isError).toBe(false);
      if (r.bytes > max.bytes) max = { name, bytes: r.bytes };
    }
    rows.push(`  ${`get_component ${max.name} (largest)`.padEnd(28)} ${String(max.bytes).padStart(6)}  (budget 16000)`);
    expect(max.bytes).toBeLessThanOrEqual(16_000);
  });
});
