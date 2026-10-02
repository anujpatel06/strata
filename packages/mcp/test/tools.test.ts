/**
 * Every tool: happy path, unknown input, validation failure, path traversal. The auditor is mocked here;
 * audit.integration.test.ts uses the real one.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findRoot } from '../src/root';
import { connect, TRAVERSALS, type Harness } from './helpers';

const bridge = vi.hoisted(() => ({ audit: vi.fn(), nearestToken: vi.fn() }));

vi.mock('../src/audit-bridge', async (original) => ({
  ...(await original<typeof import('../src/audit-bridge')>()),
  audit: bridge.audit,
  nearestToken: bridge.nearestToken,
}));

const root = findRoot();
let h: Harness;

beforeAll(async () => {
  h = await connect();
});
afterAll(async () => {
  await h.close();
});
beforeEach(() => {
  bridge.audit.mockReset();
  bridge.nearestToken.mockReset();
});

/** A traversal must be refused, and the response must not carry file content. */
async function expectRefused(tool: string, args: Record<string, unknown>): Promise<void> {
  const r = await h.call(tool, args);
  expect(r.isError, `${tool} ${JSON.stringify(args)}`).toBe(true);
  expect(r.text).not.toMatch(/root:|import |"code"/);
}

describe('list_components', () => {
  it('lists every component with name, title, maturity and purpose', async () => {
    const r = await h.call('list_components');
    expect(r.isError).toBe(false);
    expect(r.json.count).toBe(54);
    const button = r.json.components.find((c: { name: string }) => c.name === 'button');
    expect(button).toMatchObject({ name: 'button', title: 'Button', maturity: 'beta', deprecations: 1 });
    expect(button.purpose).toMatch(/^Triggers an action/);
    expect(Object.keys(button).sort()).toEqual(['deprecations', 'maturity', 'name', 'purpose', 'title']);
  });

  it('leaves out `deprecations` when there are none', async () => {
    const r = await h.call('list_components');
    const badge = r.json.components.find((c: { name: string }) => c.name === 'badge');
    expect(badge).toBeDefined();
    expect('deprecations' in badge).toBe(false);
  });

  it('filters by category', async () => {
    const r = await h.call('list_components', { category: 'actions' });
    const names = r.json.components.map((c: { name: string }) => c.name);
    expect(names).toContain('button');
    expect(names).not.toContain('dialog');
    expect(r.json.count).toBe(names.length);
  });

  it('refuses a category that does not exist, and names the valid ones', async () => {
    const r = await h.call('list_components', { category: 'widgets' });
    expect(r.isError).toBe(true);
    expect(r.text).toContain('actions');
  });

  it('refuses a category of the wrong type', async () => {
    expect((await h.call('list_components', { category: 3 })).isError).toBe(true);
  });

  it('refuses a path as a category', async () => {
    await expectRefused('list_components', { category: '../actions' });
  });
});

describe('get_component', () => {
  it('returns what an agent needs to write a Button', async () => {
    const r = await h.call('get_component', { name: 'button' });
    expect(r.isError).toBe(false);
    expect(r.json.import).toBe("import { Button } from '@syntara/react';");
    expect(r.json.maturity).toBe('beta');
    const variant = r.json.props.find((p: { name: string }) => p.name === 'variant');
    expect(variant).toMatchObject({ name: 'variant', default: "'primary'" });
    expect(variant.type).toContain("'ghost'");
    expect(r.json.props.find((p: { name: string }) => p.name === 'children').required).toBe(true);
    expect(r.json.keyboard[0]).toEqual({ keys: 'Enter / Space', action: 'Activates the button.' });
    expect(r.json.accessibility.length).toBeGreaterThan(0);
    expect(r.json.do.length).toBeGreaterThan(0);
    expect(r.json.dont.length).toBeGreaterThan(0);
    expect(r.json.tokens).toContain('color.action.primary.bg');
    expect(r.json.usage).toContain('<Button');
    expect(r.json.examples).toContain('button-demo');
  });

  it('includes the variant="danger" deprecation, from the record in meta.json', async () => {
    const r = await h.call('get_component', { name: 'button' });
    expect(r.json.deprecations).toEqual([
      {
        what: 'Button variant="danger"',
        replacement: 'tone="danger"',
        since: '0.2.0',
        removal: '1.0.0',
        codemod: 'button-variant-danger-to-tone',
      },
    ]);
  });

  it('matches the meta file, field for field', async () => {
    const meta = JSON.parse(readFileSync(join(root, 'packages/react/meta/dialog.meta.json'), 'utf8'));
    const r = await h.call('get_component', { name: 'dialog' });
    expect(r.json.props.map((p: { name: string }) => p.name)).toEqual(meta.props.map((p: { name: string }) => p.name));
    expect(r.json.usage).toBe(meta.usage);
    expect(r.json.do).toEqual(meta.guidelines.do);
    for (const e of meta.exports) expect(r.json.import).toContain(e);
  });

  it('lists the other packages a date component needs, as an import line with the reason', async () => {
    const r = await h.call('get_component', { name: 'date-picker' });
    expect(r.json.imports).toEqual([
      {
        line: "import { parseDate, parseDateTime, today, getLocalTimeZone, type DateValue } from '@internationalized/date';",
        why: expect.stringContaining('DateValue objects'),
      },
    ]);
    expect((await h.call('get_component', { name: 'calendar' })).json.imports[0].line).toContain("from '@internationalized/date'");
  });

  it('returns type notes with the prop and one correct line', async () => {
    const r = await h.call('get_component', { name: 'toggle-group' });
    expect(r.json.typeNotes[0]).toEqual({
      prop: 'onSelectionChange',
      note: expect.stringContaining('Set<Key>'),
      example: "onSelectionChange={(keys) => setFilter(String([...keys][0] ?? 'all'))}",
    });
    const general = r.json.typeNotes.find((t: { prop?: string }) => t.prop === undefined);
    expect(general.note).toContain("React's Key");
  });

  it('leaves out imports and typeNotes when a component has none', async () => {
    const r = await h.call('get_component', { name: 'badge' });
    expect('imports' in r.json).toBe(false);
    expect('typeNotes' in r.json).toBe(false);
    expect('imports' in (await h.call('get_component', { name: 'button' })).json).toBe(false);
  });

  it('returns imports and typeNotes exactly as every meta file has them', async () => {
    const names: string[] = (await h.call('list_components')).json.components.map((c: { name: string }) => c.name);
    let withImports = 0;
    let withNotes = 0;
    for (const name of names) {
      const meta = JSON.parse(readFileSync(join(root, `packages/react/meta/${name}.meta.json`), 'utf8'));
      const r = await h.call('get_component', { name });
      if (meta.imports) {
        withImports++;
        expect(r.json.imports, name).toEqual(
          meta.imports.map((i: { package: string; names: string[]; why: string }) => ({
            line: `import { ${i.names.join(', ')} } from '${i.package}';`,
            why: i.why,
          })),
        );
      } else expect(r.json.imports, name).toBeUndefined();
      if (meta.typeNotes) {
        withNotes++;
        expect(r.json.typeNotes, name).toEqual(meta.typeNotes);
      } else expect(r.json.typeNotes, name).toBeUndefined();
    }
    expect(withImports).toBeGreaterThan(0);
    expect(withNotes).toBeGreaterThan(0);
  });

  it('says which export a prop belongs to when there is more than one', async () => {
    const r = await h.call('get_component', { name: 'card' });
    expect(r.json.props.every((p: { component?: string }) => typeof p.component === 'string')).toBe(true);
    const single = await h.call('get_component', { name: 'button' });
    expect(single.json.props.some((p: object) => 'component' in p)).toBe(false);
  });

  it('accepts the export name as well as the kebab-case name', async () => {
    expect((await h.call('get_component', { name: 'DatePicker' })).json.name).toBe('date-picker');
  });

  it('returns an error with the closest names for an unknown name', async () => {
    const r = await h.call('get_component', { name: 'buton' });
    expect(r.isError).toBe(true);
    expect(r.json.closest).toContain('button');
    expect(r.json.error).toMatch(/No component named "buton"/);
  });

  it('points at list_components when nothing is close', async () => {
    const r = await h.call('get_component', { name: 'zzzzzzzzzzzz' });
    expect(r.isError).toBe(true);
    expect(r.json.closest).toEqual([]);
    expect(r.json.error).toContain('list_components');
  });

  it('refuses a missing or mistyped name', async () => {
    expect((await h.call('get_component', {})).isError).toBe(true);
    expect((await h.call('get_component', { name: 42 })).isError).toBe(true);
    expect((await h.call('get_component', { name: '' })).isError).toBe(true);
    expect((await h.call('get_component', { name: 'a'.repeat(65) })).isError).toBe(true);
  });

  it.each(TRAVERSALS)('refuses the path %s', async (name) => {
    await expectRefused('get_component', { name });
  });

  it('does not read schema.ts or any other file in the meta folder', async () => {
    const r = await h.call('get_component', { name: 'schema' });
    expect(r.isError).toBe(true);
  });
});

describe('get_tokens', () => {
  it('returns a count for each category when no category is given', async () => {
    const r = await h.call('get_tokens');
    expect(r.isError).toBe(false);
    expect(r.json).toMatchObject({ tenant: 'house', scheme: 'light' });
    expect(r.json.categories.color).toBe(48);
    const sum = Object.values(r.json.categories as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(r.json.total).toBe(sum);
    expect(r.json.tokens).toBeUndefined();
    expect(r.json.hint).toContain('category');
  });

  it('returns { token, cssVar, value } for a category', async () => {
    const r = await h.call('get_tokens', { category: 'color' });
    expect(r.json.tokens).toHaveLength(48);
    const primary = r.json.tokens.find((t: { token: string }) => t.token === 'color.action.primary.bg');
    expect(Object.keys(primary)).toEqual(['token', 'cssVar', 'value']);
    expect(primary.cssVar).toBe('--syntara-color-action-primary-bg');
    expect(primary.value).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('names camelCase roles the way the engine does', async () => {
    const r = await h.call('get_tokens', { category: 'color' });
    const t = r.json.tokens.find((x: { cssVar: string }) => x.cssVar === '--syntara-color-feedback-danger-on-solid');
    expect(t.token).toBe('color.feedback.danger.onSolid');
  });

  it('names foundation tokens by group', async () => {
    const space = (await h.call('get_tokens', { category: 'space' })).json.tokens;
    expect(space).toContainEqual({ token: 'space.4', cssVar: '--syntara-space-4', value: '16px' });
    const font = (await h.call('get_tokens', { category: 'font' })).json.tokens.map((t: { token: string }) => t.token);
    expect(font).toEqual(expect.arrayContaining(['font.size.md', 'font.weight.medium', 'font.tracking.caps', 'font.body']));
    const density = (await h.call('get_tokens', { category: 'density' })).json.tokens.map((t: { token: string }) => t.token);
    expect(density).toContain('control-height');
  });

  it('resolves per tenant and per scheme', async () => {
    const key = 'color.surface.default';
    const pick = async (args: Record<string, unknown>) =>
      (await h.call('get_tokens', { category: 'color', ...args })).json.tokens.find((t: { token: string }) => t.token === key).value;
    const light = await pick({});
    const dark = await pick({ scheme: 'dark' });
    expect(dark).not.toBe(light);
    const house = await pick({ tenant: 'house' });
    expect(house).toBe(light);
    const brand = async (tenant: string) =>
      (await h.call('get_tokens', { category: 'color', tenant })).json.tokens.find((t: { token: string }) => t.token === 'color.action.primary.bg').value;
    expect(await brand('vela')).not.toBe(await brand('house'));
  });

  it('lists the tenants for an unknown tenant', async () => {
    const r = await h.call('get_tokens', { tenant: 'acme' });
    expect(r.isError).toBe(true);
    expect(r.json.tenants).toEqual(expect.arrayContaining(['house', 'vela', 'harbor', 'qamar', 'care']));
  });

  it('refuses an unknown category or scheme', async () => {
    const r = await h.call('get_tokens', { category: 'colour' });
    expect(r.isError).toBe(true);
    expect(r.text).toContain('color');
    expect((await h.call('get_tokens', { scheme: 'sepia' })).isError).toBe(true);
  });

  it.each(TRAVERSALS)('refuses the path %s as a tenant', async (tenant) => {
    await expectRefused('get_tokens', { tenant, category: 'color' });
  });
});

describe('find_token', () => {
  const match = {
    token: 'color.action.primary.bg',
    cssVar: '--syntara-color-action-primary-bg',
    value: '#1f56e0',
    distance: 0.8,
    exact: false,
    reason: '#1f56e1 → color.action.primary.bg (ΔE 0.8)',
  };

  it('passes the value and options to the auditor and returns its match', async () => {
    bridge.nearestToken.mockResolvedValue(match);
    const r = await h.call('find_token', { value: '#1f56e1', tenant: 'vela', scheme: 'dark', category: 'color' });
    expect(r.isError).toBe(false);
    expect(r.json).toEqual(match);
    expect(bridge.nearestToken).toHaveBeenCalledWith('#1f56e1', { tenant: 'vela', scheme: 'dark', category: 'color' });
  });

  it('defaults to the house tenant and the light scheme', async () => {
    bridge.nearestToken.mockResolvedValue(match);
    await h.call('find_token', { value: '#1f56e1' });
    expect(bridge.nearestToken).toHaveBeenCalledWith('#1f56e1', { tenant: 'house', scheme: 'light' });
  });

  it('returns an error that says what to do when nothing is close', async () => {
    bridge.nearestToken.mockResolvedValue(null);
    const r = await h.call('find_token', { value: '37vw' });
    expect(r.isError).toBe(true);
    expect(r.json.error).toContain('get_tokens');
  });

  it('returns an error, not a crash, when the auditor throws', async () => {
    bridge.nearestToken.mockRejectedValue(new Error('boom'));
    const r = await h.call('find_token', { value: '#fff' });
    expect(r.isError).toBe(true);
    expect(r.json.error).toContain('boom');
    expect((await h.call('list_components')).isError).toBe(false);
  });

  it('refuses a missing, empty or oversized value', async () => {
    expect((await h.call('find_token', {})).isError).toBe(true);
    expect((await h.call('find_token', { value: '' })).isError).toBe(true);
    expect((await h.call('find_token', { value: '#'.repeat(201) })).isError).toBe(true);
    expect(bridge.nearestToken).not.toHaveBeenCalled();
  });

  it('checks the tenant before calling the auditor', async () => {
    const r = await h.call('find_token', { value: '#fff', tenant: 'acme' });
    expect(r.isError).toBe(true);
    expect(r.json.tenants).toContain('house');
    expect(bridge.nearestToken).not.toHaveBeenCalled();
  });

  it.each(TRAVERSALS)('refuses the path %s as a tenant or category', async (path) => {
    await expectRefused('find_token', { value: '#fff', tenant: path });
    await expectRefused('find_token', { value: '#fff', category: path });
    expect(bridge.nearestToken).not.toHaveBeenCalled();
  });
});

describe('get_pattern', () => {
  it('lists the patterns when no name is given', async () => {
    const r = await h.call('get_pattern');
    expect(r.isError).toBe(false);
    const blocks = JSON.parse(readFileSync(join(root, 'apps/docs/blocks/blocks.json'), 'utf8'));
    expect(r.json.patterns.map((p: { name: string }) => p.name)).toEqual(blocks.map((b: { name: string }) => b.name));
    expect(Object.keys(r.json.patterns[0])).toEqual(['name', 'title', 'purpose']);
  });

  it('returns components, structure and the source path, without the source', async () => {
    const r = await h.call('get_pattern', { name: 'settings' });
    expect(r.isError).toBe(false);
    expect(r.json.components).toEqual(expect.arrayContaining(['alert-dialog', 'button', 'card', 'switch', 'tabs', 'text-field']));
    expect(r.json.structure.length).toBeGreaterThan(0);
    expect(r.json.structure.length).toBeLessThanOrEqual(6);
    expect(r.json.structure[0]).toMatch(/^Settings/);
    expect(r.json.source).toBe('apps/docs/blocks/settings/settings.tsx');
    expect(r.json.code).toBeUndefined();
    expect(r.json.hint).toContain('includeSource');
  });

  it('only names components that exist', async () => {
    const names = (await h.call('list_components')).json.components.map((c: { name: string }) => c.name);
    for (const p of (await h.call('get_pattern')).json.patterns) {
      const r = await h.call('get_pattern', { name: p.name });
      expect(r.isError, p.name).toBe(false);
      expect(r.json.components.length, p.name).toBeGreaterThan(0);
      for (const c of r.json.components) expect(names).toContain(c);
    }
  });

  it('returns the source when asked', async () => {
    const r = await h.call('get_pattern', { name: 'sign-in', includeSource: true });
    expect(r.json.code).toBe(readFileSync(join(root, 'apps/docs/blocks/sign-in/sign-in.tsx'), 'utf8'));
  });

  it('lists the patterns for an unknown name', async () => {
    const r = await h.call('get_pattern', { name: 'setings' });
    expect(r.isError).toBe(true);
    expect(r.json.closest).toContain('settings');
    expect(r.json.patterns).toContain('sign-in');
  });

  it('refuses inputs of the wrong type', async () => {
    expect((await h.call('get_pattern', { name: 7 })).isError).toBe(true);
    expect((await h.call('get_pattern', { name: 'settings', includeSource: 'yes' })).isError).toBe(true);
  });

  it.each(TRAVERSALS)('refuses the path %s', async (name) => {
    await expectRefused('get_pattern', { name, includeSource: true });
  });
});

describe('audit_snippet', () => {
  const finding = {
    rule: 'raw-color',
    severity: 'error',
    file: '<snippet>',
    line: 2,
    column: 10,
    message: 'Raw colour #1f56e0.',
    snippet: 'color: #1f56e0;',
    fix: { description: 'Use var(--syntara-color-action-primary-bg)', replacement: 'var(--syntara-color-action-primary-bg)', start: 20, end: 27, safe: true },
  };
  const advice = {
    rule: 'native-element',
    severity: 'warning',
    file: '<snippet>',
    line: 5,
    column: 3,
    message: 'Native <button>.',
    snippet: '<button>',
    fix: { description: 'Use Button from @syntara/react', safe: false },
  };

  it('returns the score and compact findings', async () => {
    bridge.audit.mockResolvedValue({ findings: [finding, advice], stats: { files: 1, lines: 6, opportunities: 4 }, score: 62.5 });
    const r = await h.call('audit_snippet', { code: '.a {\n  color: #1f56e0;\n}', language: 'css', tenant: 'vela' });
    expect(r.isError).toBe(false);
    expect(bridge.audit).toHaveBeenCalledWith('.a {\n  color: #1f56e0;\n}', { language: 'css', tenant: 'vela' });
    expect(r.json).toEqual({
      score: 62.5,
      findings: [
        {
          rule: 'raw-color',
          severity: 'error',
          line: 2,
          message: 'Raw colour #1f56e0.',
          fix: { description: 'Use var(--syntara-color-action-primary-bg)', replacement: 'var(--syntara-color-action-primary-bg)', safe: true },
        },
        {
          rule: 'native-element',
          severity: 'warning',
          line: 5,
          message: 'Native <button>.',
          fix: { description: 'Use Button from @syntara/react', safe: false },
        },
      ],
    });
  });

  it('keeps `safe` on every fix', async () => {
    bridge.audit.mockResolvedValue({ findings: [finding, advice], stats: { files: 1, lines: 6, opportunities: 4 }, score: 62.5 });
    const r = await h.call('audit_snippet', { code: 'x' });
    for (const f of r.json.findings) expect(typeof f.fix.safe).toBe('boolean');
  });

  it('defaults to tsx and the house tenant', async () => {
    bridge.audit.mockResolvedValue({ findings: [], stats: { files: 1, lines: 1, opportunities: 0 }, score: 100 });
    const r = await h.call('audit_snippet', { code: '<Button>Save</Button>' });
    expect(bridge.audit).toHaveBeenCalledWith('<Button>Save</Button>', { language: 'tsx', tenant: 'house' });
    expect(r.json).toEqual({ score: 100, findings: [] });
  });

  it('returns an error, not a crash, when the auditor throws', async () => {
    bridge.audit.mockRejectedValue(new Error('parse failed at 1:1'));
    const r = await h.call('audit_snippet', { code: '<<<' });
    expect(r.isError).toBe(true);
    expect(r.json.error).toContain('parse failed');
  });

  it('refuses missing, empty or oversized code, and unknown languages', async () => {
    expect((await h.call('audit_snippet', {})).isError).toBe(true);
    expect((await h.call('audit_snippet', { code: '' })).isError).toBe(true);
    expect((await h.call('audit_snippet', { code: 'a'.repeat(100_001) })).isError).toBe(true);
    expect((await h.call('audit_snippet', { code: 'x', language: 'vue' })).isError).toBe(true);
    expect(bridge.audit).not.toHaveBeenCalled();
  });

  it('lists the tenants for an unknown tenant', async () => {
    const r = await h.call('audit_snippet', { code: 'x', tenant: 'acme' });
    expect(r.isError).toBe(true);
    expect(r.json.tenants).toContain('house');
    expect(bridge.audit).not.toHaveBeenCalled();
  });

  it.each(TRAVERSALS)('refuses the path %s as a tenant', async (tenant) => {
    await expectRefused('audit_snippet', { code: 'x', tenant });
    expect(bridge.audit).not.toHaveBeenCalled();
  });
});

describe('get_example', () => {
  it('returns the -demo example by default', async () => {
    const r = await h.call('get_example', { component: 'button' });
    expect(r.isError).toBe(false);
    expect(r.json).toMatchObject({ component: 'button', example: 'button-demo', source: 'apps/docs/examples/button/button-demo.tsx' });
    expect(r.json.code).toBe(readFileSync(join(root, 'apps/docs/examples/button/button-demo.tsx'), 'utf8'));
  });

  it('returns a named example', async () => {
    const r = await h.call('get_example', { component: 'button', example: 'button-tone' });
    expect(r.json.example).toBe('button-tone');
    expect(r.json.code).toContain('tone="danger"');
  });

  it('has a -demo example for every component', async () => {
    const names = (await h.call('list_components')).json.components.map((c: { name: string }) => c.name);
    for (const component of names) {
      const r = await h.call('get_example', { component });
      expect(r.isError, component).toBe(false);
    }
  });

  it('lists the examples for an unknown example', async () => {
    const r = await h.call('get_example', { component: 'button', example: 'button-tones' });
    expect(r.isError).toBe(true);
    expect(r.json.closest).toContain('button-tone');
    expect(r.json.examples).toContain('button-demo');
  });

  it('returns the closest names for an unknown component', async () => {
    const r = await h.call('get_example', { component: 'buttn' });
    expect(r.isError).toBe(true);
    expect(r.json.closest).toContain('button');
  });

  it('refuses a missing or mistyped component', async () => {
    expect((await h.call('get_example', {})).isError).toBe(true);
    expect((await h.call('get_example', { component: ['button'] })).isError).toBe(true);
  });

  it.each(TRAVERSALS)('refuses the path %s', async (path) => {
    await expectRefused('get_example', { component: path });
    await expectRefused('get_example', { component: 'button', example: path });
    await expectRefused('get_example', { component: 'button', example: `${path}/button-demo` });
  });
});
