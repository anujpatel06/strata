/** Starts the server on stdio. stdout carries the protocol, so anything for people goes to stderr. */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server';

const server = createServer();
await server.connect(new StdioServerTransport());
