/**
 * The server as a client sees it: once through the SDK's in-memory transport, and once by starting
 * bin/cli.mjs and talking to it over stdio.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { findRoot, inside, ToolError } from '../src/root';
import { INSTRUCTIONS, TOOL_NAMES } from '../src/server';
import { connect, type Harness } from './helpers';

vi.mock('../src/audit-bridge', async (original) => ({
  ...(await original<typeof import('../src/audit-bridge')>()),
  audit: async () => ({ findings: [], stats: { files: 1, lines: 1, opportunities: 1 }, score: 100 }),
  nearestToken: async () => ({
    token: 'space.4',
    cssVar: '--strata-space-4',
    value: '16px',
    distance: 0,
    exact: true,
    reason: '16px → space.4 (exact)',
  }),
}));

const here = dirname(fileURLToPath(import.meta.url));
const root = findRoot();
const pkg = JSON.parse(readFileSync(join(here, '../package.json'), 'utf8')) as { version: string };

const ONE_CALL_EACH: Record<(typeof TOOL_NAMES)[number], Record<string, unknown>> = {
  list_components: {},
  get_component: { name: 'button' },
  get_tokens: { category: 'radius' },
  find_token: { value: '16px' },
  get_pattern: { name: 'sign-in' },
  audit_snippet: { code: '<Button>Save</Button>' },
  get_example: { component: 'button' },
};

describe('protocol, in memory', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await connect();
  });
  afterAll(async () => {
    await h.close();
  });

  it('is named strata, with the version from package.json', () => {
    expect(h.client.getServerVersion()).toMatchObject({ name: 'strata', version: pkg.version });
  });

  it('sends instructions that state read-only, the safe-fix rule and strata://agents', () => {
    const text = h.client.getInstructions();
    expect(text).toBe(INSTRUCTIONS);
    expect(text).toContain('read-only');
    expect(text).toContain('no tool that writes files');
    expect(text).toContain('safe: true');
    expect(text).toContain('needs a person');
    expect(text).toContain('strata://agents');
  });

  it('lists exactly the seven tools', async () => {
    const { tools } = await h.client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
  });

  it('describes every tool and every input field, and marks every tool read-only', async () => {
    const { tools } = await h.client.listTools();
    for (const tool of tools) {
      expect(tool.description, tool.name).toBeTruthy();
      expect(tool.description!.split(/(?<=\.)\s+/).length, `${tool.name} description is one to three sentences`).toBeLessThanOrEqual(3);
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
      const props = (tool.inputSchema.properties ?? {}) as Record<string, { description?: string }>;
      for (const [field, schema] of Object.entries(props)) {
        expect(schema.description, `${tool.name}.${field}`).toBeTruthy();
      }
    }
  });

  it('has no tool whose name suggests a write', async () => {
    const { tools } = await h.client.listTools();
    for (const tool of tools) expect(tool.name).not.toMatch(/write|create|update|delete|apply|fix|set_|edit/);
  });

  it('lists the two resources', async () => {
    const { resources } = await h.client.listResources();
    expect(resources.map((r) => r.uri).sort()).toEqual(['strata://agents', 'strata://governance']);
    for (const r of resources) expect(r.mimeType).toBe('text/markdown');
  });

  it('serves GOVERNANCE.md as strata://governance', async () => {
    const { contents } = await h.client.readResource({ uri: 'strata://governance' });
    expect((contents[0] as { text: string }).text).toBe(readFileSync(join(root, 'GOVERNANCE.md'), 'utf8'));
  });

  it('serves AGENTS.md as strata://agents, or says it is not found', async () => {
    const file = join(root, 'AGENTS.md');
    if (existsSync(file)) {
      const { contents } = await h.client.readResource({ uri: 'strata://agents' });
      expect((contents[0] as { text: string }).text).toBe(readFileSync(file, 'utf8'));
    } else {
      await expect(h.client.readResource({ uri: 'strata://agents' })).rejects.toThrow(/strata:\/\/agents not found/);
    }
  });

  it('refuses a resource it does not have', async () => {
    await expect(h.client.readResource({ uri: 'strata://../../etc/passwd' })).rejects.toThrow();
    await expect(h.client.readResource({ uri: 'file:///etc/passwd' })).rejects.toThrow();
  });

  it.each(Object.entries(ONE_CALL_EACH))('calls %s', async (name, args) => {
    const r = await h.call(name, args);
    expect(r.isError, r.text).toBe(false);
    expect(r.json).toBeTypeOf('object');
  });

  it('returns an error for a tool it does not have', async () => {
    const result = await h.client.callTool({ name: 'write_file', arguments: {} }).catch((err: unknown) => err);
    const failed = result instanceof Error || (result as { isError?: boolean }).isError === true;
    expect(failed).toBe(true);
  });
});

describe('a repo root with files missing', () => {
  const empty = mkdtempSync(join(tmpdir(), 'strata-mcp-'));
  const bare = mkdtempSync(join(tmpdir(), 'strata-mcp-'));
  mkdirSync(join(bare, 'packages/react/meta'), { recursive: true });
  writeFileSync(join(bare, 'GOVERNANCE.md'), '# Governance\n');
  afterAll(() => {
    rmSync(empty, { recursive: true, force: true });
    rmSync(bare, { recursive: true, force: true });
  });

  it('tells the agent to set STRATA_ROOT when the root is not a Strata repo', async () => {
    const h = await connect({ root: empty });
    const r = await h.call('list_components');
    expect(r.isError).toBe(true);
    expect(r.json.error).toContain('STRATA_ROOT');
    await h.close();
  });

  it('returns a clear "not found" for strata://agents when AGENTS.md does not exist', async () => {
    const h = await connect({ root: bare });
    await expect(h.client.readResource({ uri: 'strata://agents' })).rejects.toThrow(/strata:\/\/agents not found: AGENTS\.md does not exist/);
    const { contents } = await h.client.readResource({ uri: 'strata://governance' });
    expect((contents[0] as { text: string }).text).toBe('# Governance\n');
    await h.close();
  });

  it('returns errors, not crashes, when the data folders are missing', async () => {
    const h = await connect({ root: bare });
    expect((await h.call('list_components')).json).toEqual({ count: 0, components: [] });
    expect((await h.call('get_pattern')).isError).toBe(true);
    expect((await h.call('get_tokens')).isError).toBe(true);
    expect((await h.call('get_example', { component: 'button' })).isError).toBe(true);
    await h.close();
  });
});

describe('inside()', () => {
  it('joins names under the root', () => {
    expect(inside(root, 'packages/react/meta', 'button.meta.json')).toBe(join(root, 'packages/react/meta/button.meta.json'));
  });

  it.each([['..'], ['../x'], ['a/../../x'], ['/etc/passwd'], ['a\\..\\..\\x']])('refuses %s', (part) => {
    expect(() => inside(root, 'tenants', part)).toThrow(ToolError);
  });

  it('refuses the root itself', () => {
    expect(() => inside(root)).toThrow(ToolError);
  });

  it('uses STRATA_ROOT when it is set', () => {
    expect(findRoot({ STRATA_ROOT: '/some/checkout' })).toBe('/some/checkout');
    expect(findRoot({})).toBe(join(here, '../../..'));
    expect(findRoot({ STRATA_ROOT: '  ' })).toBe(join(here, '../../..'));
  });
});

describe('protocol, over stdio', () => {
  it('starts bin/cli.mjs, lists tools and resources, and calls a tool', async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [join(here, '../bin/cli.mjs')],
      env: { ...(process.env as Record<string, string>), STRATA_ROOT: root },
      stderr: 'pipe',
    });
    const client = new Client({ name: 'strata-mcp-stdio-test', version: '0.0.0' });
    try {
      await client.connect(transport);
      expect(client.getServerVersion()).toMatchObject({ name: 'strata', version: pkg.version });
      expect((await client.listTools()).tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
      expect((await client.listResources()).resources).toHaveLength(2);
      const result = await client.callTool({ name: 'get_component', arguments: { name: 'button' } });
      const text = (result.content as Array<{ text: string }>)[0]!.text;
      expect(JSON.parse(text).deprecations[0].what).toBe('Button variant="danger"');
    } finally {
      await client.close();
    }
  }, 30_000);
});
