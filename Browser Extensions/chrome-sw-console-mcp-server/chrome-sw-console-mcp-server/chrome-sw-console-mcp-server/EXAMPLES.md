# Chrome Service Worker Console MCP Server - Usage Examples

This document provides practical examples of using the Chrome Service Worker Console MCP server.

## Quick Start Tutorial

### Step 1: Start Chrome with Remote Debugging

Before using the MCP server, start Chrome with remote debugging enabled:

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

### Step 2: Load Your Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Load your extension
4. The service worker should start automatically

### Step 3: Connect and Monitor

Use the following sequence of MCP tools:

#### 1. List All Available Targets

```json
{
  "tool": "chrome_sw_list_targets",
  "params": {
    "response_format": "json",
    "chrome_host": "localhost",
    "chrome_port": 9222
  }
}
```

**Response:**
```json
{
  "targets": [
    {
      "id": "ABC-123-DEF-456",
      "type": "service_worker",
      "title": "Service Worker chrome-extension://...",
      "url": "chrome-extension://abcdefgh12345678/background.js"
    }
  ]
}
```

#### 2. Connect to Your Service Worker

```json
{
  "tool": "chrome_sw_connect",
  "params": {
    "target_id": "ABC-123-DEF-456",
    "chrome_host": "localhost",
    "chrome_port": 9222
  }
}
```

**Response:**
```
Successfully connected to target: ABC-123-DEF-456

Next step: Use chrome_sw_start_monitoring to begin capturing console logs.
```

#### 3. Start Monitoring Console Messages

```json
{
  "tool": "chrome_sw_start_monitoring",
  "params": {}
}
```

**Response:**
```
Started monitoring console messages from target: ABC-123-DEF-456

Console messages will be captured automatically. Use chrome_sw_get_logs to retrieve them.
```

#### 4. Interact with Your Extension

Now interact with your Chrome extension to generate console logs. For example:
- Click extension buttons
- Trigger background tasks
- Test API calls

#### 5. Retrieve Console Logs

```json
{
  "tool": "chrome_sw_get_logs",
  "params": {
    "response_format": "json",
    "limit": 100
  }
}
```

**Response:**
```json
{
  "total": 15,
  "count": 15,
  "logs": [
    {
      "timestamp": 1700000001.234,
      "level": "log",
      "text": "Extension initialized",
      "source": "console-api"
    },
    {
      "timestamp": 1700000002.567,
      "level": "info",
      "text": "Fetching data from API...",
      "source": "console-api"
    },
    {
      "timestamp": 1700000003.890,
      "level": "error",
      "text": "Failed to fetch: Network error",
      "source": "exception",
      "stackTrace": [...]
    }
  ]
}
```

## Advanced Filtering Examples

### Filter by Log Level (Errors Only)

```json
{
  "tool": "chrome_sw_get_logs",
  "params": {
    "response_format": "markdown",
    "level": "error",
    "limit": 50
  }
}
```

### Filter by Text Content

```json
{
  "tool": "chrome_sw_get_logs",
  "params": {
    "response_format": "json",
    "text_contains": "authentication",
    "limit": 100
  }
}
```

### Filter by Time Range

Get logs from the last 5 minutes:

```json
{
  "tool": "chrome_sw_get_logs",
  "params": {
    "response_format": "json",
    "start_time": 1700000000000,
    "limit": 200
  }
}
```

### Combine Multiple Filters

Get error logs about "API" from the last hour:

```json
{
  "tool": "chrome_sw_get_logs",
  "params": {
    "response_format": "markdown",
    "level": "error",
    "text_contains": "API",
    "start_time": 1699996400000,
    "limit": 100
  }
}
```

## Debugging Scenarios

### Scenario 1: Finding Extension Startup Errors

1. **Connect to extension**: Use `chrome_sw_connect`
2. **Start monitoring**: Use `chrome_sw_start_monitoring`
3. **Reload extension**: In Chrome, reload your extension
4. **Get logs**: Use `chrome_sw_get_logs` with `level: "error"`

### Scenario 2: Monitoring API Call Issues

1. **Start monitoring**: Before making API calls
2. **Trigger API calls**: Use your extension
3. **Filter logs**: Use `text_contains: "fetch"` or `text_contains: "API"`
4. **Check errors**: Filter by `level: "error"`

### Scenario 3: Performance Debugging

1. **Clear buffer**: Use `chrome_sw_clear_logs`
2. **Start fresh monitoring**: Use `chrome_sw_start_monitoring`
3. **Perform action**: Trigger the feature you want to test
4. **Get all logs**: Use `chrome_sw_get_logs` with high limit
5. **Analyze timestamps**: Look at time differences between logs

### Scenario 4: Continuous Monitoring

```bash
# In a script or workflow:
1. chrome_sw_list_targets
2. chrome_sw_connect (with target_id)
3. chrome_sw_start_monitoring
4. Loop:
   - Wait 30 seconds
   - chrome_sw_get_logs (get recent errors)
   - If errors found: Alert/Log
   - chrome_sw_clear_logs (optional, to reduce buffer)
```

## Workflow Patterns

### Pattern 1: One-Time Debugging Session

```
chrome_sw_list_targets
→ chrome_sw_connect
→ chrome_sw_start_monitoring
→ [Use extension]
→ chrome_sw_get_logs
→ chrome_sw_disconnect
```

### Pattern 2: Continuous Monitoring

```
chrome_sw_list_targets
→ chrome_sw_connect
→ chrome_sw_start_monitoring
→ Loop:
  - chrome_sw_get_logs (filter by level: error)
  - [Process errors]
  - chrome_sw_clear_logs
  - Wait/Sleep
```

### Pattern 3: Multiple Extension Testing

```
chrome_sw_list_targets
→ For each service worker:
  - chrome_sw_connect (with specific target_id)
  - chrome_sw_start_monitoring
  - [Test extension]
  - chrome_sw_get_logs
  - chrome_sw_disconnect
```

## Common Issues and Solutions

### Issue: "Not connected to any target"

**Solution:** Call `chrome_sw_connect` before `chrome_sw_start_monitoring`

### Issue: "Failed to list Chrome targets"

**Solution:** Ensure Chrome is running with `--remote-debugging-port=9222`

### Issue: Service worker not in target list

**Solution:** 
1. Make sure the extension is loaded
2. Trigger the service worker (extensions may lazy-load)
3. Call `chrome_sw_list_targets` again

### Issue: No logs captured

**Solution:**
1. Verify monitoring is active: `chrome_sw_get_status`
2. Ensure service worker is actually logging to console
3. Try `console.log()` from extension's DevTools to test

### Issue: Service worker keeps restarting

**Solution:**
Service workers may restart periodically. When this happens:
1. You'll need to reconnect: `chrome_sw_connect`
2. Restart monitoring: `chrome_sw_start_monitoring`
3. Consider implementing auto-reconnect logic

## Integration Examples

### With Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "chrome-sw-console": {
      "command": "node",
      "args": ["/absolute/path/to/chrome-sw-console-mcp-server/dist/index.js"]
    }
  }
}
```

Then in Claude:
- "List my Chrome service workers"
- "Connect to my extension's service worker and start monitoring"
- "Show me all error logs from the last 5 minutes"
- "What console messages contain 'authentication'?"

### With Automation Scripts

```javascript
// Example: Auto-monitor extension errors
const mcpClient = new MCPClient();

// Connect to MCP server
await mcpClient.connect();

// Find extension
const targets = await mcpClient.call('chrome_sw_list_targets', {
  response_format: 'json'
});

const serviceWorker = targets.targets.find(t => 
  t.title.includes('My Extension')
);

// Start monitoring
await mcpClient.call('chrome_sw_connect', {
  target_id: serviceWorker.id
});

await mcpClient.call('chrome_sw_start_monitoring', {});

// Check for errors every 10 seconds
setInterval(async () => {
  const logs = await mcpClient.call('chrome_sw_get_logs', {
    response_format: 'json',
    level: 'error',
    limit: 10
  });
  
  if (logs.total > 0) {
    console.error('Extension errors detected:', logs.logs);
    // Send alert, log to file, etc.
  }
  
  // Clear buffer to avoid memory buildup
  await mcpClient.call('chrome_sw_clear_logs', {});
}, 10000);
```

## Tips and Best Practices

1. **Clear logs regularly** in long-running sessions to avoid memory buildup
2. **Use filters** to reduce noise and focus on relevant messages
3. **Check status** with `chrome_sw_get_status` when debugging connection issues
4. **Increase limit** when you need comprehensive logs (up to 500)
5. **Use JSON format** when integrating with other tools or scripts
6. **Use Markdown format** for human-readable debugging in Claude
7. **Monitor specific time ranges** to isolate issues to particular actions

## Next Steps

- Read the main [README.md](README.md) for installation and configuration
- Check available tools in the server implementation
- Try the MCP Inspector for testing: `npx @modelcontextprotocol/inspector node dist/index.js`
