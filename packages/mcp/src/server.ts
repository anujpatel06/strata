/**
 * The Strata MCP server: seven read-only tools and two resources (BRIEF §8, ADR-008).
 *
 * Every tool returns one text block of compact JSON. Errors are tool errors (`isError: true`) whose message
 * says what to do next. No tool writes a file.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { AuditorUnavailable, audit, nearestToken } from './audit-bridge';
import { CATEGORIES, getComponent, listComponents } from './components';
import { getExample } from './examples';
import { getPattern, listPatterns } from './patterns';
import { ToolError, assertRoot, findRoot, inside, SAFE_NAME_MESSAGE } from './root';
import { TOKEN_CATEGORIES, getTokens, requireTenant } from './tokens';

const here = dirname(fileURLToPath(import.meta.url));

export const SERVER_NAME = 'strata';
export const SERVER_VERSION: string = (
  JSON.parse(readFileSync(join(here, '../package.json'), 'utf8')) as { version: string }
).version;

export const INSTRUCTIONS = [
  'Strata is a multi-brand design system: React components from @strata/react, styled only with var(--strata-*) tokens.',
  'This server is read-only. It has no tool that writes files; you make the edits.',
  'Before writing UI: list_components, then get_component or get_example for each component you use. Use get_pattern for a whole screen.',
  'Never write a raw colour, size, radius or font weight. Use find_token to turn a raw value into a token.',
  'After writing UI: audit_snippet. Each finding has a fix with safe: true or false.',
  'Trust levels: you may apply fixes with safe: true yourself (ambient level). Every other fix, and anything that adds a component, changes a token or breaks an API, needs a person to decide. Read strata://agents for the rules.',
].join('\n');

export const TOOL_NAMES = [
  'list_components',
  'get_component',
  'get_tokens',
  'find_token',
  'get_pattern',
  'audit_snippet',
  'get_example',
] as const;

export const RESOURCES = {
  agents: { uri: 'strata://agents', file: 'AGENTS.md', title: 'AGENTS.md', description: 'Rules for AI agents working with Strata, including trust levels.' },
  governance: { uri: 'strata://governance', file: 'GOVERNANCE.md', title: 'GOVERNANCE.md', description: 'How Strata changes: who decides, versioning, deprecation, trust levels.' },
} as const;

/** The largest snippet audit_snippet accepts, in characters. */
export const MAX_SNIPPET = 100_000;

function ok(payload: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
}

function fail(message: string, details: Record<string, unknown> = {}): CallToolResult {
  return { isError: true, content: [{ type: 'text', text: JSON.stringify({ error: message, ...details }) }] };
}

/** Runs a handler and turns anything thrown into a tool error. The server never crashes on a bad call. */
async function run(root: string, handler: () => unknown): Promise<CallToolResult> {
  try {
    assertRoot(root);
    return ok(await handler());
  } catch (err) {
    if (err instanceof ToolError) return fail(err.message, err.details);
    if (err instanceof AuditorUnavailable) {
      return fail(`${err.message} The other tools still work. Tell the user; don't guess the result.`);
    }
    const detail = err instanceof Error ? err.message.split('\n')[0] : String(err);
    return fail(`The tool failed: ${detail} Tell the user; this is a fault in the server or the repo's data, not in your input.`);
  }
}

/** A name typed by an agent. Path-like input is refused here; the handlers check again. */
const nameInput = (what: string) =>
  z
    .string()
    .min(1)
    .max(64)
    .refine((v) => !/[\\/\0]|\.\.|^[.~]|^[a-zA-Z]:/.test(v), { message: SAFE_NAME_MESSAGE })
    .describe(what);

/** "DatePicker" and "date picker" → "date-picker". */
export function toKebab(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

const tenantInput = nameInput('Tenant id: a folder in tenants/, e.g. "house", "vela", "qamar". Default "house".').optional();
const schemeInput = z.enum(['light', 'dark']).optional().describe('Colour scheme. Default "light".');

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

export interface ServerOptions {
  /** The Strata repo. Default: STRATA_ROOT, or the repo this package sits in. */
  root?: string;
}

export function createServer(options: ServerOptions = {}): McpServer {
  const root = options.root ?? findRoot();
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION }, { instructions: INSTRUCTIONS });

  server.registerTool(
    'list_components',
    {
      description:
        'Lists every Strata component with its maturity and purpose. Call it first, before you pick components for a screen.',
      inputSchema: {
        category: z.enum(CATEGORIES).optional().describe('Only return components in this category.'),
      },
      annotations: READ_ONLY,
    },
    ({ category }) => run(root, () => listComponents(root, category)),
  );

  server.registerTool(
    'get_component',
    {
      description:
        'Returns one component\'s import line, props, deprecations, keyboard and accessibility notes, do and don\'t, tokens and a usage snippet. Call it before you write code that uses the component.',
      inputSchema: {
        name: nameInput('Component name in kebab-case, e.g. "button" or "date-picker". Names come from list_components.'),
      },
      annotations: READ_ONLY,
    },
    ({ name }) => run(root, () => getComponent(root, toKebab(name))),
  );

  server.registerTool(
    'get_tokens',
    {
      description:
        'Returns resolved design tokens for a tenant and scheme as { token, cssVar, value }. Call it with no category to see the categories and their counts, then with one category to get values.',
      inputSchema: {
        category: z.enum(TOKEN_CATEGORIES).optional().describe('Token category. Leave it out to get a count for each category.'),
        tenant: tenantInput,
        scheme: schemeInput,
      },
      annotations: READ_ONLY,
    },
    (args) => run(root, () => getTokens(root, args)),
  );

  server.registerTool(
    'find_token',
    {
      description:
        'Finds the nearest semantic token for a raw value such as "#1f56e0" or "12px", and says how close it is. Call it whenever you are about to write a raw colour, size or radius.',
      inputSchema: {
        value: z.string().min(1).max(200).describe('The raw CSS value, e.g. "#1f56e0", "rgb(31 86 224)", "12px".'),
        tenant: tenantInput,
        scheme: schemeInput,
        category: z
          .string()
          .regex(/^[a-z][a-z-]*$/, 'Use a category word such as "color", "space", "radius" or "font".')
          .max(32)
          .optional()
          .describe('Only match tokens in this category, e.g. "color", "space", "radius", "font". Use it when the value alone is ambiguous: "8px" could be space or radius.'),
      },
      annotations: READ_ONLY,
    },
    ({ value, tenant, scheme, category }) =>
      run(root, async () => {
        const match = await nearestToken(value, {
          tenant: requireTenant(root, tenant ?? 'house'),
          scheme: scheme ?? 'light',
          ...(category !== undefined ? { category } : {}),
        });
        if (match === null) {
          throw new ToolError(
            `No token is close to "${value}". Check the value, or call get_tokens with a category and choose by meaning. Don't keep the raw value.`,
          );
        }
        return match;
      }),
  );

  server.registerTool(
    'get_pattern',
    {
      description:
        'Returns a page-level pattern (a block): the components it composes, its structure and the path of its source. Call it with no name to list the patterns. Use it when you build a whole screen.',
      inputSchema: {
        name: nameInput('Pattern name, e.g. "settings" or "request-flow". Leave it out to list every pattern.').optional(),
        includeSource: z.boolean().optional().describe('Also return the pattern\'s source code. It is 200 to 700 lines, so ask only when you need it. Default false.'),
      },
      annotations: READ_ONLY,
    },
    ({ name, includeSource }) =>
      run(root, () => (name === undefined ? listPatterns(root) : getPattern(root, toKebab(name), includeSource ?? false))),
  );

  server.registerTool(
    'audit_snippet',
    {
      description:
        'Checks code for drift from Strata: raw values, native elements, physical CSS properties, missing accessible names, deprecated APIs. Returns findings with a fix each, and a score from 0 to 100. Call it on code you wrote before you show it.',
      inputSchema: {
        code: z.string().min(1).max(MAX_SNIPPET).describe(`The source to check, up to ${MAX_SNIPPET} characters.`),
        language: z.enum(['tsx', 'css']).optional().describe('"tsx" or "css". Default "tsx".'),
        tenant: tenantInput,
      },
      annotations: READ_ONLY,
    },
    ({ code, language, tenant }) =>
      run(root, async () => {
        const { findings, score } = await audit(code, {
          language: language ?? 'tsx',
          tenant: requireTenant(root, tenant ?? 'house'),
        });
        return {
          score,
          findings: findings.map((f) => ({
            rule: f.rule,
            severity: f.severity,
            line: f.line,
            message: f.message,
            fix: {
              description: f.fix.description,
              ...(f.fix.replacement !== undefined ? { replacement: f.fix.replacement } : {}),
              safe: f.fix.safe,
            },
          })),
        };
      }),
  );

  server.registerTool(
    'get_example',
    {
      description:
        'Returns the source of one working example for a component, as the docs site renders it. Call it when you want code to copy and adapt; get_component lists the example names.',
      inputSchema: {
        component: nameInput('Component name in kebab-case, e.g. "button".'),
        example: nameInput('Example name, e.g. "button-tone". Default: the component\'s "-demo" example.').optional(),
      },
      annotations: READ_ONLY,
    },
    ({ component, example }) => run(root, () => getExample(root, toKebab(component), example)),
  );

  for (const [name, r] of Object.entries(RESOURCES)) {
    server.registerResource(
      name,
      r.uri,
      { title: r.title, description: r.description, mimeType: 'text/markdown' },
      (uri) => {
        const file = inside(root, r.file);
        if (!existsSync(file)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `${r.uri} not found: ${r.file} does not exist at the root of the Strata repo. Tell the user; don't make up its content.`,
          );
        }
        return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: readFileSync(file, 'utf8') }] };
      },
    );
  }

  return server;
}
