#!/usr/bin/env node

/**
 * Obsidian MCP Monitor Server
 * Provides monitoring and control of Obsidian via Chrome DevTools Protocol and REST API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { CDPClient } from './cdp-client.js';
import { ConsoleMonitor } from './console-monitor.js';
import { NetworkMonitor } from './network-monitor.js';
import { ObsidianAPI } from './obsidian-api.js';
import type { ResponseFormat } from './types.js';

// Initialize components
const cdpClient = new CDPClient({ host: 'localhost', port: 9222 });
const consoleMonitor = new ConsoleMonitor(cdpClient);
const networkMonitor = new NetworkMonitor(cdpClient);
const obsidianAPI = new ObsidianAPI({ baseUrl: 'http://localhost:27123' });

// Create MCP server
const server = new Server(
  {
    name: 'obsidian-mcp-monitor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // CDP Connection Tools
      {
        name: 'obsidian_list_targets',
        description: 'List all available Chrome DevTools Protocol targets (useful for finding Obsidian)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'obsidian_connect',
        description: 'Connect to Obsidian via Chrome DevTools Protocol. Obsidian must be running with --remote-debugging-port=9222',
        inputSchema: {
          type: 'object',
          properties: {
            target_id: {
              type: 'string',
              description: 'Optional target ID to connect to. If not provided, will auto-detect Obsidian.',
            },
          },
        },
      },
      {
        name: 'obsidian_disconnect',
        description: 'Disconnect from current Obsidian target',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Console Monitoring Tools
      {
        name: 'obsidian_start_console_monitoring',
        description: 'Start monitoring console output from Obsidian',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'obsidian_stop_console_monitoring',
        description: 'Stop monitoring console output',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'obsidian_get_console_logs',
        description: 'Get console logs with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            response_format: {
              type: 'string',
              enum: ['json', 'markdown'],
              description: 'Output format (default: markdown)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of logs to return (default: 50)',
            },
            level: {
              type: 'string',
              enum: ['log', 'info', 'warn', 'error', 'debug'],
              description: 'Filter by log level',
            },
            start_time: {
              type: 'number',
              description: 'Unix timestamp in milliseconds - only logs after this time',
            },
            end_time: {
              type: 'number',
              description: 'Unix timestamp in milliseconds - only logs before this time',
            },
            text_contains: {
              type: 'string',
              description: 'Filter logs containing this text (case-insensitive)',
            },
          },
        },
      },
      {
        name: 'obsidian_clear_console_logs',
        description: 'Clear all console logs from buffer',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Network Monitoring Tools
      {
        name: 'obsidian_start_network_monitoring',
        description: 'Start monitoring network requests from Obsidian',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'obsidian_stop_network_monitoring',
        description: 'Stop monitoring network requests',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'obsidian_get_network_requests',
        description: 'Get network requests with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            response_format: {
              type: 'string',
              enum: ['json', 'markdown'],
              description: 'Output format (default: markdown)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of requests to return (default: 50)',
            },
            method: {
              type: 'string',
              description: 'Filter by HTTP method (GET, POST, etc.)',
            },
            url_filter: {
              type: 'string',
              description: 'Filter requests containing this URL substring',
            },
            status_code: {
              type: 'number',
              description: 'Filter by response status code',
            },
          },
        },
      },
      {
        name: 'obsidian_clear_network_requests',
        description: 'Clear all network requests from buffer',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Obsidian API Tools
      {
        name: 'obsidian_list_files',
        description: 'List all files in the Obsidian vault. Requires Obsidian Local REST API plugin.',
        inputSchema: {
          type: 'object',
          properties: {
            response_format: {
              type: 'string',
              enum: ['json', 'markdown'],
              description: 'Output format (default: markdown)',
            },
          },
        },
      },
      {
        name: 'obsidian_read_file',
        description: 'Read a file from Obsidian vault',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file in vault',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'obsidian_write_file',
        description: 'Write or update a file in Obsidian vault',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file in vault',
            },
            content: {
              type: 'string',
              description: 'Content to write',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'obsidian_search',
        description: 'Search for text in vault files',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'obsidian_execute_js',
        description: 'Execute JavaScript code in Obsidian context (use with caution)',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'JavaScript code to execute',
            },
          },
          required: ['code'],
        },
      },

      // Status Tools
      {
        name: 'obsidian_get_status',
        description: 'Get current status of all monitoring and connections',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // CDP Connection Tools
      case 'obsidian_list_targets': {
        const targets = await cdpClient.listTargets();
        return createToolResult(JSON.stringify(targets, null, 2));
      }

      case 'obsidian_connect': {
        await cdpClient.connect(args?.target_id as string | undefined);
        return createToolResult(
          `Successfully connected to Obsidian (target: ${cdpClient.getTargetId()})`
        );
      }

      case 'obsidian_disconnect': {
        await cdpClient.disconnect();
        return createToolResult('Disconnected from Obsidian');
      }

      // Console Monitoring Tools
      case 'obsidian_start_console_monitoring': {
        await consoleMonitor.start();
        return createToolResult('Console monitoring started');
      }

      case 'obsidian_stop_console_monitoring': {
        consoleMonitor.stop();
        return createToolResult('Console monitoring stopped');
      }

      case 'obsidian_get_console_logs': {
        const format = (args?.response_format as ResponseFormat) || 'markdown';
        const result = consoleMonitor.getLogs({
          limit: args?.limit as number,
          level: args?.level as any,
          startTime: args?.start_time as number,
          endTime: args?.end_time as number,
          textContains: args?.text_contains as string,
        });

        if (format === 'json') {
          return createToolResult(JSON.stringify(result, null, 2));
        } else {
          return createToolResult(consoleMonitor.formatLogsAsMarkdown(result.logs));
        }
      }

      case 'obsidian_clear_console_logs': {
        consoleMonitor.clearLogs();
        return createToolResult('Console logs cleared');
      }

      // Network Monitoring Tools
      case 'obsidian_start_network_monitoring': {
        await networkMonitor.start();
        return createToolResult('Network monitoring started');
      }

      case 'obsidian_stop_network_monitoring': {
        networkMonitor.stop();
        return createToolResult('Network monitoring stopped');
      }

      case 'obsidian_get_network_requests': {
        const format = (args?.response_format as ResponseFormat) || 'markdown';
        const result = networkMonitor.getRequests({
          limit: args?.limit as number,
          method: args?.method as string,
          urlFilter: args?.url_filter as string,
          statusCode: args?.status_code as number,
        });

        if (format === 'json') {
          return createToolResult(JSON.stringify(result, null, 2));
        } else {
          return createToolResult(networkMonitor.formatRequestsAsMarkdown(result.requests));
        }
      }

      case 'obsidian_clear_network_requests': {
        networkMonitor.clearRequests();
        return createToolResult('Network requests cleared');
      }

      // Obsidian API Tools
      case 'obsidian_list_files': {
        const format = (args?.response_format as ResponseFormat) || 'markdown';
        const files = await obsidianAPI.listFiles();

        if (format === 'json') {
          return createToolResult(JSON.stringify({ files }, null, 2));
        } else {
          return createToolResult(obsidianAPI.formatFilesAsMarkdown(files));
        }
      }

      case 'obsidian_read_file': {
        const path = args?.path as string;
        const file = await obsidianAPI.readFile(path);
        return createToolResult(
          `# ${path}\n\n${file.frontmatter ? `**Frontmatter:**\n\`\`\`yaml\n${JSON.stringify(file.frontmatter, null, 2)}\n\`\`\`\n\n` : ''}${file.tags && file.tags.length > 0 ? `**Tags:** ${file.tags.join(', ')}\n\n` : ''}**Content:**\n\`\`\`markdown\n${file.content}\n\`\`\``
        );
      }

      case 'obsidian_write_file': {
        const path = args?.path as string;
        const content = args?.content as string;
        await obsidianAPI.writeFile(path, content);
        return createToolResult(`Successfully wrote to ${path}`);
      }

      case 'obsidian_search': {
        const query = args?.query as string;
        const results = await obsidianAPI.search(query);
        return createToolResult(JSON.stringify(results, null, 2));
      }

      case 'obsidian_execute_js': {
        const code = args?.code as string;
        const result = await cdpClient.evaluate(code);
        return createToolResult(JSON.stringify(result, null, 2));
      }

      // Status Tools
      case 'obsidian_get_status': {
        const status = {
          cdp: {
            connected: cdpClient.isConnected(),
            targetId: cdpClient.getTargetId(),
          },
          console: consoleMonitor.getStatus(),
          network: networkMonitor.getStatus(),
          api: {
            available: await obsidianAPI.ping(),
          },
        };
        return createToolResult(JSON.stringify(status, null, 2));
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return createToolResult(`Error: ${error}`, true);
  }
});

/**
 * Helper function to create tool result
 */
function createToolResult(text: string, isError: boolean = false) {
  return {
    content: [
      {
        type: 'text' as const,
        text,
      },
    ],
    isError,
  };
}

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Obsidian MCP Monitor Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
