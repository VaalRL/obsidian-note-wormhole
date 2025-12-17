# Obsidian MCP Monitor

A Model Context Protocol (MCP) server that enables monitoring and control of Obsidian via Chrome DevTools Protocol and REST API.

## Features

### 🔍 Monitoring Capabilities
- **Console Monitoring**: Capture console.log, errors, warnings from Obsidian
- **Network Monitoring**: Track HTTP requests and responses
- **Real-time Updates**: Live monitoring with 1-hour log retention

### 📝 Obsidian Integration
- **File Operations**: Read, write, search files in vault
- **Metadata Management**: Access frontmatter and tags
- **JavaScript Execution**: Run custom code in Obsidian context

### 🛠️ Technical Stack
- Chrome DevTools Protocol (CDP) for debugging access
- Obsidian Local REST API for file operations
- TypeScript with full type safety
- MCP SDK for Claude integration

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **Obsidian**: Running with remote debugging enabled
3. **Obsidian Plugin**: [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) installed

## Installation

### 1. Install Dependencies

```bash
cd "04. Projects/2512 Obsidian MCP Monitor"
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Configure Obsidian

#### Enable Chrome DevTools Protocol

**Windows:**
Create a shortcut to Obsidian and add the flag:
```
"C:\Users\YourUser\AppData\Local\Obsidian\Obsidian.exe" --remote-debugging-port=9222
```

**macOS:**
```bash
/Applications/Obsidian.app/Contents/MacOS/Obsidian --remote-debugging-port=9222
```

**Linux:**
```bash
obsidian --remote-debugging-port=9222
```

#### Install Local REST API Plugin

1. Open Obsidian Settings
2. Go to Community Plugins
3. Browse and install "Local REST API"
4. Enable the plugin
5. (Optional) Configure API key in plugin settings

### 4. Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "obsidian-monitor": {
      "command": "node",
      "args": [
        "C:\\Users\\SyncthingServiceAcct\\Obs20240105\\Obs20240105\\04. Projects\\2512 Obsidian MCP Monitor\\dist\\index.js"
      ]
    }
  }
}
```

Note: Adjust the path according to your installation location.

## Usage

### Available Tools

#### Connection Management
- `obsidian_list_targets` - List available CDP targets
- `obsidian_connect` - Connect to Obsidian
- `obsidian_disconnect` - Disconnect from Obsidian
- `obsidian_get_status` - Get connection and monitoring status

#### Console Monitoring
- `obsidian_start_console_monitoring` - Start capturing console output
- `obsidian_stop_console_monitoring` - Stop capturing
- `obsidian_get_console_logs` - Retrieve logs with filtering
- `obsidian_clear_console_logs` - Clear log buffer

#### Network Monitoring
- `obsidian_start_network_monitoring` - Start capturing network requests
- `obsidian_stop_network_monitoring` - Stop capturing
- `obsidian_get_network_requests` - Retrieve requests with filtering
- `obsidian_clear_network_requests` - Clear request buffer

#### File Operations
- `obsidian_list_files` - List all files in vault
- `obsidian_read_file` - Read file content
- `obsidian_write_file` - Write/update file
- `obsidian_search` - Search in vault

#### Advanced
- `obsidian_execute_js` - Execute JavaScript in Obsidian

### Example Usage with Claude

```
User: Connect to Obsidian and start monitoring console

Claude: [Uses obsidian_connect and obsidian_start_console_monitoring]

User: Show me any errors in the console

Claude: [Uses obsidian_get_console_logs with level filter]

User: Read the file "Daily Notes/2024-12-04.md"

Claude: [Uses obsidian_read_file]
```

## Architecture

```
┌─────────────────────────────────────┐
│   Obsidian MCP Monitor Server       │
├─────────────────────────────────────┤
│                                     │
│  Layer 1: Debug & Monitor           │
│  ├─ Chrome DevTools Protocol        │
│  │  ├─ Console Monitoring           │
│  │  ├─ Network Monitoring           │
│  │  └─ JavaScript Execution         │
│                                     │
│  Layer 2: Content Operations        │
│  ├─ Obsidian Local REST API         │
│  │  ├─ File Read/Write              │
│  │  ├─ Search                       │
│  │  └─ Metadata Management          │
│                                     │
└─────────────────────────────────────┘
```

## Development

### Build for Development
```bash
npm run dev
```

### Project Structure
```
src/
├── index.ts           # MCP Server main entry
├── cdp-client.ts      # Chrome DevTools Protocol client
├── console-monitor.ts # Console monitoring logic
├── network-monitor.ts # Network monitoring logic
├── obsidian-api.ts    # REST API integration
└── types.ts           # TypeScript type definitions
```

## Troubleshooting

### Connection Issues

**Problem:** "Failed to list targets"
- **Solution**: Ensure Obsidian is running with `--remote-debugging-port=9222`
- Check if port 9222 is not blocked by firewall

**Problem:** "Not connected to any target"
- **Solution**: Run `obsidian_connect` first before using monitoring tools

### REST API Issues

**Problem:** "Failed to list files"
- **Solution**: Install and enable Local REST API plugin in Obsidian
- Check if the plugin is running on `http://localhost:27123`

### Monitoring Issues

**Problem:** "No logs captured"
- **Solution**: Ensure monitoring is started with `obsidian_start_console_monitoring`
- Check if you're connected to the correct target

## Security Considerations

- CDP provides full access to Obsidian's runtime - use with caution
- `obsidian_execute_js` can run arbitrary code - only use with trusted input
- Local REST API may expose vault content - configure API key if needed
- Logs are kept in memory for 1 hour - sensitive data may be captured

## License

MIT

## References

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Obsidian Developer Docs](https://docs.obsidian.md/)
