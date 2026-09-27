import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server';
import type { ServerOptions } from '../src/server';

export interface Called {
  isError: boolean;
  /** The parsed JSON payload. */
  json: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** The raw text of the response. */
  text: string;
  /** UTF-8 bytes of the text: what an agent pays for. */
  bytes: number;
}

export interface Harness {
  client: Client;
  call(name: string, args?: Record<string, unknown>): Promise<Called>;
  close(): Promise<void>;
}

/** A server and a client joined by the SDK's in-memory transport. */
export async function connect(options: ServerOptions = {}): Promise<Harness> {
  const server = createServer(options);
  const client = new Client({ name: 'strata-mcp-test', version: '0.0.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  return {
    client,
    async call(name, args = {}) {
      const result = await client.callTool({ name, arguments: args });
      const content = result.content as Array<{ type: string; text?: string }>;
      if (content.length !== 1 || content[0]!.type !== 'text') throw new Error(`${name}: expected one text block`);
      const text = content[0]!.text ?? '';
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined; // the SDK's own validation errors are plain text
      }
      return { isError: result.isError === true, json, text, bytes: Buffer.byteLength(text, 'utf8') };
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
}

/** Inputs that try to leave the repo. Every name input must refuse all of them. */
export const TRAVERSALS = ['../button', '..', '../../etc/passwd', '/etc/passwd', 'button/../../x', '..\\button', 'C:\\x', '~/x', '.env'];
