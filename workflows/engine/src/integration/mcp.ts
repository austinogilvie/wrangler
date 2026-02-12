/**
 * MCP server configuration for agent sessions.
 * Configures wrangler MCP tools to be available to agents.
 */

import * as path from 'path';

/**
 * Build the MCP server configuration for agent query() calls.
 * This allows agents to use wrangler MCP tools (issues, session).
 */
export function buildMcpConfig(options: {
  /** Path to the wrangler project root */
  projectRoot: string;
  /** Path to the MCP server entry point (defaults to mcp/dist/bundle.cjs) */
  mcpServerPath?: string;
}): Record<string, unknown> {
  const serverPath = options.mcpServerPath ??
    path.join(options.projectRoot, 'node_modules', '.wrangler', 'mcp', 'dist', 'bundle.cjs');

  return {
    'wrangler-mcp': {
      type: 'stdio',
      command: 'node',
      args: [serverPath],
      env: {
        WRANGLER_WORKSPACE_ROOT: options.projectRoot,
      },
    },
  };
}
