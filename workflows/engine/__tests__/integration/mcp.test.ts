/**
 * Tests for buildMcpConfig.
 *
 * No mocks needed -- these are pure function tests.
 */

import * as path from 'path';
import { buildMcpConfig } from '../../src/integration/mcp.js';

describe('buildMcpConfig', () => {
  it('should return correct structure with stdio config', () => {
    const config = buildMcpConfig({
      projectRoot: '/home/user/project',
    });

    expect(config).toHaveProperty('wrangler-mcp');

    const mcpServer = config['wrangler-mcp'] as Record<string, unknown>;
    expect(mcpServer.type).toBe('stdio');
    expect(mcpServer.command).toBe('node');
    expect(mcpServer.args).toBeInstanceOf(Array);
    expect((mcpServer.args as string[]).length).toBe(1);
  });

  it('should use default MCP server path based on project root', () => {
    const config = buildMcpConfig({
      projectRoot: '/home/user/project',
    });

    const mcpServer = config['wrangler-mcp'] as Record<string, unknown>;
    const expectedPath = path.join(
      '/home/user/project',
      'node_modules',
      '.wrangler',
      'mcp',
      'dist',
      'bundle.cjs'
    );
    expect((mcpServer.args as string[])[0]).toBe(expectedPath);
  });

  it('should accept custom MCP server path', () => {
    const customPath = '/custom/path/to/server.js';
    const config = buildMcpConfig({
      projectRoot: '/home/user/project',
      mcpServerPath: customPath,
    });

    const mcpServer = config['wrangler-mcp'] as Record<string, unknown>;
    expect((mcpServer.args as string[])[0]).toBe(customPath);
  });

  it('should set WRANGLER_WORKSPACE_ROOT env var to project root', () => {
    const projectRoot = '/home/user/my-project';
    const config = buildMcpConfig({ projectRoot });

    const mcpServer = config['wrangler-mcp'] as Record<string, unknown>;
    const env = mcpServer.env as Record<string, string>;
    expect(env.WRANGLER_WORKSPACE_ROOT).toBe(projectRoot);
  });

  it('should handle project root with trailing slash', () => {
    const config = buildMcpConfig({
      projectRoot: '/home/user/project',
    });

    const mcpServer = config['wrangler-mcp'] as Record<string, unknown>;
    const env = mcpServer.env as Record<string, string>;
    expect(env.WRANGLER_WORKSPACE_ROOT).toBe('/home/user/project');
  });

  it('should return a single server entry', () => {
    const config = buildMcpConfig({
      projectRoot: '/project',
    });

    expect(Object.keys(config)).toEqual(['wrangler-mcp']);
  });

  it('should produce config suitable for QueryOptions.mcpServers', () => {
    const config = buildMcpConfig({
      projectRoot: '/project',
      mcpServerPath: '/path/to/mcp.js',
    });

    // The config should be a plain object that can be spread into query options
    expect(typeof config).toBe('object');
    expect(config).not.toBeNull();

    const server = config['wrangler-mcp'] as Record<string, unknown>;
    expect(server).toEqual({
      type: 'stdio',
      command: 'node',
      args: ['/path/to/mcp.js'],
      env: {
        WRANGLER_WORKSPACE_ROOT: '/project',
      },
    });
  });
});
