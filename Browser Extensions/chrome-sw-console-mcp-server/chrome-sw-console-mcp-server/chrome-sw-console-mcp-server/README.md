# Chrome Service Worker Console MCP Server

An MCP (Model Context Protocol) server that enables monitoring and retrieving console messages from Chrome extension service workers using the Chrome DevTools Protocol.

## Features

- 🔍 **List Chrome Targets**: Discover all available service workers, extensions, and tabs
- 🔌 **Connect to Service Workers**: Establish connections to specific Chrome targets
- 📊 **Monitor Console Messages**: Capture all console logs in real-time
- 🎯 **Advanced Filtering**: Filter logs by level, time range, and content
- 📝 **Multiple Formats**: Output as JSON or Markdown
- 🚀 **Real-time Capture**: Automatic buffering of console messages
- 🧹 **Buffer Management**: Clear and manage logged messages

## Prerequisites

- Node.js 18+ and npm
- Chrome/Chromium browser running with remote debugging enabled

## Installation

```bash
npm install
npm run build
```

## Starting Chrome with Remote Debugging

Before using this MCP server, start Chrome with remote debugging enabled:

### macOS
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

### Linux
```bash
google-chrome --remote-debugging-port=9222
```

### Windows
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

## Usage

### As stdio MCP Server (Default)

```bash
npm start
```

### As HTTP MCP Server

```bash
TRANSPORT=http PORT=3000 npm start
```

## Available Tools

### 1. `chrome_sw_list_targets`

List all available Chrome targets including service workers, extensions, and tabs.

**Parameters:**
- `chrome_host` (string, default: "localhost"): Chrome DevTools host
- `chrome_port` (number, default: 9222): Chrome DevTools port
- `response_format` ("markdown" | "json", default: "markdown"): Output format

**Example:**
```json
{
  "chrome_host": "localhost",
  "chrome_port": 9222,
  "response_format": "json"
}
```

### 2. `chrome_sw_connect`

Connect to a specific Chrome target (service worker or extension).

**Parameters:**
- `target_id` (string, required): Target ID from `chrome_sw_list_targets`
- `chrome_host` (string, default: "localhost"): Chrome DevTools host
- `chrome_port` (number, default: 9222): Chrome DevTools port

**Example:**
```json
{
  "target_id": "E4B4C4D4-5E5F-6G6H-7I7J-8K8L9M9N0O0P",
  "chrome_host": "localhost",
  "chrome_port": 9222
}
```

### 3. `chrome_sw_start_monitoring`

Start monitoring console messages from the connected target.

**Parameters:** None

### 4. `chrome_sw_stop_monitoring`

Stop monitoring console messages (keeps connection and buffered messages).

**Parameters:** None

### 5. `chrome_sw_get_logs`

Retrieve captured console messages with optional filtering.

**Parameters:**
- `response_format` ("markdown" | "json", default: "markdown"): Output format
- `limit` (number, 1-500, default: 50): Maximum logs to return
- `level` ("log" | "info" | "warn" | "error" | "debug", optional): Filter by level
- `start_time` (number, optional): Unix timestamp in milliseconds
- `end_time` (number, optional): Unix timestamp in milliseconds
- `text_contains` (string, optional): Filter logs containing text (case-insensitive)

**Example:**
```json
{
  "response_format": "json",
  "limit": 100,
  "level": "error",
  "text_contains": "authentication"
}
```

### 6. `chrome_sw_clear_logs`

Clear all buffered console messages.

**Parameters:** None

### 7. `chrome_sw_get_status`

Get the current status of the monitor.

**Parameters:**
- `response_format` ("markdown" | "json", default: "markdown"): Output format

### 8. `chrome_sw_disconnect`

Disconnect from the current Chrome target.

**Parameters:** None

## Workflow Example

Here's a typical workflow for monitoring a Chrome extension's service worker:

```
1. Start Chrome with remote debugging:
   chrome --remote-debugging-port=9222

2. List available targets:
   chrome_sw_list_targets

3. Connect to your service worker:
   chrome_sw_connect with target_id from step 2

4. Start monitoring:
   chrome_sw_start_monitoring

5. Interact with your extension to generate logs

6. Retrieve logs:
   chrome_sw_get_logs with desired filters

7. When done:
   chrome_sw_disconnect
```

## Configuration with Claude Desktop

Add this to your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "chrome-sw-console": {
      "command": "node",
      "args": ["/path/to/chrome-sw-console-mcp-server/dist/index.js"]
    }
  }
}
```

## Architecture

This MCP server uses:
- **Chrome DevTools Protocol (CDP)**: For connecting to Chrome and capturing console messages
- **MCP TypeScript SDK**: For MCP server implementation
- **Zod**: For runtime input validation
- **Express**: For HTTP transport (optional)

## Message Retention

- Console messages are buffered in memory for 1 hour
- Older messages are automatically cleaned up
- Use `chrome_sw_clear_logs` to manually clear the buffer

## Troubleshooting

### "Failed to list Chrome targets"

- Ensure Chrome is running with `--remote-debugging-port=9222`
- Check that the port matches the `chrome_port` parameter
- Verify no firewall is blocking the connection

### "Failed to connect to target"

- The target may have closed or reloaded
- Use `chrome_sw_list_targets` to get the current target ID
- Service workers may restart; you'll need to reconnect

### "Not connected to any target"

- Use `chrome_sw_connect` before starting monitoring
- Check connection status with `chrome_sw_get_status`

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run dev
```

### Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Built with the [Model Context Protocol](https://modelcontextprotocol.io/) SDK.
