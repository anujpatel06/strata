/**
 * Response sizes. Agents pay for every byte, so each response has a budget, and the measured sizes are printed.
 *
 *   pnpm --filter @syntara/mcp test sizes
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
  { label: 'get_component date-picker', tool: 'get_component', args: { name: 'date-picker' }, budget: 8_000 },
  { label: 'get_component toggle-group', tool: 'get_component', args: { name: 'toggle-group' }, budget: 6_500 },
  { label: 'get_component data-table', tool: 'get_component', args: { name: 'data-table' }, budget: 12_500 },
  { label: 'get_component select', tool: 'get_component', args: { name: 'select' }, budget: 9_000 },
  { label: 'find_icon award', tool: 'find_icon', args: { query: 'award' }, budget: 400 },
  { label: 'find_icon arrow (8)', tool: 'find_icon', args: { query: 'arrow' }, budget: 700 },
  { label: 'find_icon IconArrowDown', tool: 'find_icon', args: { query: 'IconArrowDown' }, budget: 800 },
  { label: 'find_icon IconMinus (none)', tool: 'find_icon', args: { query: 'IconMinus' }, budget: 500 },
  // Many words, many matches: the largest response found over every icon name and synonym at limit 30 (28 icons).
  { label: 'find_icon, 28 icons', tool: 'find_icon', args: { query: 'IconFileCircleArrowCheckFilled', limit: 30 }, budget: 2_000 },
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
    expect(r.json.count).toBe(54);
  });

  it('responses are compact JSON: no indentation or line breaks between fields', async () => {
    const r = await h.call('get_component', { name: 'button' });
    expect(r.text).toBe(JSON.stringify(JSON.parse(r.text)));
  });

  it('find_icon at its limit of 30 stays under 2,000 bytes for every icon name and synonym', async () => {
    const { SYNONYMS, allIcons } = await import('../src/icons');
    const { findRoot } = await import('../src/root');
    const queries = [...Object.keys(SYNONYMS), ...allIcons(findRoot()).map((i) => i.name)];
    let max = { query: '', bytes: 0 };
    for (const query of queries) {
      const r = await h.call('find_icon', { query, limit: 30 });
      if (r.bytes > max.bytes) max = { query, bytes: r.bytes };
    }
    rows.push(`  ${`find_icon ${max.query}, limit 30 (largest)`.padEnd(28)} ${String(max.bytes).padStart(6)}  (budget 2000)`);
    expect(max.bytes).toBeLessThanOrEqual(2_000);
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
