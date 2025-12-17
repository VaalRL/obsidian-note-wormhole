/**
 * MCP tool implementations for Chrome Service Worker Console monitoring
 */
import { getChromeClient } from "../services/chrome-client.js";
import { formatConsoleMessagesMarkdown, formatConsoleMessagesJSON, formatTargetsMarkdown, formatStatusMarkdown, } from "../services/formatters.js";
import { ListTargetsInputSchema, ConnectToTargetInputSchema, StartMonitoringInputSchema, StopMonitoringInputSchema, GetConsoleLogsInputSchema, ClearLogsInputSchema, GetStatusInputSchema, DisconnectInputSchema, } from "../schemas/index.js";
/**
 * Register all Chrome Service Worker Console tools
 */
export function registerTools(server) {
    // Tool 1: List available Chrome targets
    server.registerTool("chrome_sw_list_targets", {
        title: "List Chrome Targets",
        description: `List all available Chrome targets including service workers, extensions, and tabs.

This tool discovers all Chrome debugging targets accessible through Chrome DevTools Protocol. It's the first step to identify which service worker or extension you want to monitor.

Args:
  - chrome_host (string): Chrome DevTools host address (default: "localhost")
  - chrome_port (number): Chrome DevTools port number (default: 9222)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format:
  {
    "targets": [
      {
        "id": string,           // Target ID for connection
        "type": string,         // "service_worker", "page", etc.
        "title": string,        // Target title
        "url": string,          // Target URL
        "description": string   // Additional info (optional)
      }
    ]
  }

Examples:
  - Use when: "Show me all Chrome service workers" -> Get list of targets
  - Use when: "What extensions are running?" -> Filter results for extensions
  - Use when: "Find my extension's service worker" -> Look for matching title/URL

Requirements:
  - Chrome must be running with: chrome --remote-debugging-port=9222
  - No authentication required for localhost connections

Error Handling:
  - Returns error if Chrome is not running or remote debugging is disabled
  - Returns error if connection to Chrome DevTools fails`,
        inputSchema: ListTargetsInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async (input) => {
        const params = {
            response_format: input.response_format ?? "markdown",
            chrome_host: input.chrome_host ?? "localhost",
            chrome_port: input.chrome_port ?? 9222,
        };
        try {
            const client = getChromeClient(params.chrome_host, params.chrome_port);
            const targets = await client.listTargets();
            if (params.response_format === "json") {
                return {
                    content: [{ type: "text", text: JSON.stringify({ targets }, null, 2) }],
                    structuredContent: { targets },
                };
            }
            else {
                const markdown = formatTargetsMarkdown(targets);
                return {
                    content: [{ type: "text", text: markdown }],
                };
            }
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error listing Chrome targets: ${error instanceof Error ? error.message : String(error)}\n\n` +
                            `Make sure Chrome is running with --remote-debugging-port=${params.chrome_port}`,
                    },
                ],
            };
        }
    });
    // Tool 2: Connect to a specific target
    server.registerTool("chrome_sw_connect", {
        title: "Connect to Chrome Target",
        description: `Connect to a specific Chrome target (service worker or extension) for console monitoring.

After listing targets with chrome_sw_list_targets, use this tool to establish a connection to the target you want to monitor. This is required before you can start monitoring console messages.

Args:
  - target_id (string): The target ID from chrome_sw_list_targets
  - chrome_host (string): Chrome DevTools host (default: "localhost")
  - chrome_port (number): Chrome DevTools port (default: 9222)

Returns:
  Success message confirming connection to the target

Examples:
  - Use when: "Connect to service worker ABC123" -> Connect using target_id="ABC123"
  - Use when: "Start monitoring my extension" -> First get target_id, then connect
  - After: Successfully connected, use chrome_sw_start_monitoring to begin logging

Flow:
  1. chrome_sw_list_targets - Find your target
  2. chrome_sw_connect - Connect to it
  3. chrome_sw_start_monitoring - Begin capturing logs
  4. chrome_sw_get_logs - Retrieve the logs

Error Handling:
  - Returns error if target_id is invalid or target no longer exists
  - Returns error if already connected (will auto-disconnect and reconnect)
  - Returns error if Chrome connection fails`,
        inputSchema: ConnectToTargetInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    }, async (input) => {
        const params = {
            target_id: input.target_id,
            chrome_host: input.chrome_host ?? "localhost",
            chrome_port: input.chrome_port ?? 9222,
        };
        try {
            const client = getChromeClient(params.chrome_host, params.chrome_port);
            await client.connectToTarget(params.target_id);
            return {
                content: [
                    {
                        type: "text",
                        text: `Successfully connected to target: ${params.target_id}\n\n` +
                            `Next step: Use chrome_sw_start_monitoring to begin capturing console logs.`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error connecting to target: ${error instanceof Error ? error.message : String(error)}\n\n` +
                            `Make sure the target_id is valid. Use chrome_sw_list_targets to get current targets.`,
                    },
                ],
            };
        }
    });
    // Tool 3: Start monitoring console messages
    server.registerTool("chrome_sw_start_monitoring", {
        title: "Start Console Monitoring",
        description: `Start monitoring console messages from the connected service worker or extension.

This tool begins capturing all console messages (log, info, warn, error, debug) from the currently connected target. Messages are buffered in memory for retrieval with chrome_sw_get_logs.

Args:
  None required

Returns:
  Success message confirming monitoring has started

Monitoring captures:
  - console.log(), console.info(), console.warn(), console.error(), console.debug()
  - Runtime exceptions and errors
  - Stack traces where available
  - Timestamps for all messages

Message retention:
  - Messages are kept in memory for 1 hour
  - Older messages are automatically cleaned up
  - Use chrome_sw_clear_logs to manually clear buffer

Examples:
  - Use when: "Start capturing console logs" -> Begin monitoring
  - Use when: "Begin logging service worker activity" -> Start capture
  - After: Messages accumulate in buffer, retrieve with chrome_sw_get_logs

Requirements:
  - Must be connected to a target first (chrome_sw_connect)
  - Monitoring continues until chrome_sw_stop_monitoring or chrome_sw_disconnect

Error Handling:
  - Returns error if not connected to any target
  - Returns info if already monitoring (idempotent operation)`,
        inputSchema: StartMonitoringInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async () => {
        try {
            const client = getChromeClient();
            const status = client.getStatus();
            if (!status.connected) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: "Not connected to any target. Use chrome_sw_connect first.",
                        },
                    ],
                };
            }
            if (status.monitoring) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "Already monitoring console messages.",
                        },
                    ],
                };
            }
            await client.startMonitoring();
            return {
                content: [
                    {
                        type: "text",
                        text: `Started monitoring console messages from target: ${status.targetId}\n\n` +
                            `Console messages will be captured automatically. Use chrome_sw_get_logs to retrieve them.`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error starting monitoring: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
    // Tool 4: Stop monitoring console messages
    server.registerTool("chrome_sw_stop_monitoring", {
        title: "Stop Console Monitoring",
        description: `Stop monitoring console messages from the connected target.

This tool stops capturing new console messages. Previously captured messages remain in the buffer and can still be retrieved with chrome_sw_get_logs.

Args:
  None required

Returns:
  Success message confirming monitoring has stopped

Behavior:
  - Stops capturing new messages
  - Existing buffered messages are preserved
  - Connection to target remains active
  - Can restart monitoring with chrome_sw_start_monitoring

Examples:
  - Use when: "Stop capturing logs" -> Pause monitoring
  - Use when: "Pause console monitoring" -> Stop capture while keeping connection

Error Handling:
  - Returns info if already stopped (idempotent operation)`,
        inputSchema: StopMonitoringInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async () => {
        try {
            const client = getChromeClient();
            const status = client.getStatus();
            if (!status.monitoring) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "Console monitoring is not active.",
                        },
                    ],
                };
            }
            client.stopMonitoring();
            return {
                content: [
                    {
                        type: "text",
                        text: `Stopped monitoring console messages.\n\n` +
                            `${status.messageCount} messages remain in buffer. Use chrome_sw_get_logs to retrieve them.`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error stopping monitoring: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
    // Tool 5: Get console logs
    server.registerTool("chrome_sw_get_logs", {
        title: "Get Console Logs",
        description: `Retrieve console messages captured from the service worker or extension.

This tool returns console messages that have been captured during monitoring. Supports filtering by level, time range, and text content.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')
  - limit (number): Maximum logs to return (1-500, default: 50)
  - level ('log' | 'info' | 'warn' | 'error' | 'debug'): Filter by log level (optional)
  - start_time (number): Unix timestamp in milliseconds - only logs after this time (optional)
  - end_time (number): Unix timestamp in milliseconds - only logs before this time (optional)
  - text_contains (string): Filter logs containing this text, case-insensitive (optional)

Returns:
  For JSON format:
  {
    "total": number,        // Total matching messages
    "count": number,        // Messages in this response
    "logs": [
      {
        "timestamp": number,      // Unix timestamp (seconds)
        "level": string,          // "log", "info", "warn", "error", "debug"
        "text": string,           // Message content
        "source": string,         // "console-api", "exception", etc.
        "url": string,            // Source file (optional)
        "lineNumber": number,     // Line number (optional)
        "stackTrace": [...]       // Stack frames (optional)
      }
    ]
  }

Examples:
  - Use when: "Show me all error messages" -> params with level="error"
  - Use when: "Get last 100 logs" -> params with limit=100
  - Use when: "Find logs about authentication" -> params with text_contains="auth"
  - Use when: "Logs from the last hour" -> params with start_time=(now - 3600000)

Filtering tips:
  - Combine filters for precise results: level + text_contains
  - Use time range for temporal analysis
  - Increase limit if you need more results

Error Handling:
  - Returns empty result if no logs match filters
  - Returns error if not monitoring (start with chrome_sw_start_monitoring)`,
        inputSchema: GetConsoleLogsInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async (input) => {
        const params = {
            response_format: input.response_format ?? "markdown",
            limit: input.limit ?? 50,
            level: input.level,
            start_time: input.start_time,
            end_time: input.end_time,
            text_contains: input.text_contains,
        };
        try {
            const client = getChromeClient();
            const filters = {
                level: params.level,
                startTime: params.start_time,
                endTime: params.end_time,
                textContains: params.text_contains,
            };
            const logs = client.getConsoleMessages(filters);
            if (params.response_format === "json") {
                const output = formatConsoleMessagesJSON(logs, params.limit);
                return {
                    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
                    structuredContent: output,
                };
            }
            else {
                const markdown = formatConsoleMessagesMarkdown(logs, params.limit);
                return {
                    content: [{ type: "text", text: markdown }],
                };
            }
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error retrieving console logs: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
    // Tool 6: Clear console logs buffer
    server.registerTool("chrome_sw_clear_logs", {
        title: "Clear Console Logs Buffer",
        description: `Clear all console messages from the buffer.

This tool removes all buffered console messages. Monitoring continues if active, capturing new messages after clearing.

Args:
  None required

Returns:
  Success message confirming buffer has been cleared

Behavior:
  - Deletes all buffered messages
  - Does not stop monitoring if active
  - New messages continue to be captured
  - Useful for starting fresh or reducing memory usage

Examples:
  - Use when: "Clear all logs" -> Empty the buffer
  - Use when: "Reset console messages" -> Start fresh
  - Use when: "Remove old logs" -> Clean up buffer

Error Handling:
  - Succeeds even if buffer is already empty (idempotent)`,
        inputSchema: ClearLogsInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async () => {
        try {
            const client = getChromeClient();
            const previousCount = client.getStatus().messageCount;
            client.clearMessages();
            return {
                content: [
                    {
                        type: "text",
                        text: `Cleared ${previousCount} console messages from buffer.\n\n` +
                            `Monitoring continues if active. New messages will be captured.`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error clearing logs: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
    // Tool 7: Get monitoring status
    server.registerTool("chrome_sw_get_status", {
        title: "Get Monitor Status",
        description: `Get the current status of the Chrome service worker console monitor.

This tool provides information about connection status, monitoring state, target ID, and buffer size.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  For JSON format:
  {
    "connected": boolean,       // Whether connected to a target
    "monitoring": boolean,      // Whether actively monitoring
    "targetId": string | null,  // Current target ID
    "messageCount": number      // Messages in buffer
  }

Examples:
  - Use when: "What's the monitoring status?" -> Get current state
  - Use when: "Am I connected?" -> Check connection
  - Use when: "How many messages captured?" -> See buffer size

Error Handling:
  - Always succeeds, returns current status`,
        inputSchema: GetStatusInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async (input) => {
        const params = {
            response_format: input.response_format ?? "markdown",
        };
        try {
            const client = getChromeClient();
            const status = client.getStatus();
            if (params.response_format === "json") {
                return {
                    content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
                    structuredContent: status,
                };
            }
            else {
                const markdown = formatStatusMarkdown(status);
                return {
                    content: [{ type: "text", text: markdown }],
                };
            }
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error getting status: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
    // Tool 8: Disconnect from target
    server.registerTool("chrome_sw_disconnect", {
        title: "Disconnect from Target",
        description: `Disconnect from the current Chrome target and stop all monitoring.

This tool stops monitoring, clears the connection, but preserves buffered messages until manually cleared.

Args:
  None required

Returns:
  Success message confirming disconnection

Behavior:
  - Stops monitoring if active
  - Closes connection to Chrome target
  - Buffered messages are preserved (use chrome_sw_clear_logs to remove)
  - Can reconnect to a target with chrome_sw_connect

Examples:
  - Use when: "Disconnect from service worker" -> Close connection
  - Use when: "Stop monitoring completely" -> Disconnect and stop

Error Handling:
  - Succeeds even if not connected (idempotent)`,
        inputSchema: DisconnectInputSchema,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async () => {
        try {
            const client = getChromeClient();
            const status = client.getStatus();
            if (!status.connected) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "Not connected to any target.",
                        },
                    ],
                };
            }
            await client.disconnect();
            return {
                content: [
                    {
                        type: "text",
                        text: `Disconnected from Chrome target.\n\n` +
                            `${status.messageCount} messages remain in buffer. Use chrome_sw_clear_logs to remove them.`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error disconnecting: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=index.js.map