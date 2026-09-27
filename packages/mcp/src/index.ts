/** @strata/mcp: public entry point. `createServer()` returns the server; `bin/cli.mjs` runs it over stdio. */
export { createServer, INSTRUCTIONS, RESOURCES, SERVER_NAME, SERVER_VERSION, TOOL_NAMES } from './server';
export type { ServerOptions } from './server';
export { findRoot } from './root';
