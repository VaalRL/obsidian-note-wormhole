# Chrome Service Worker Console MCP Server - Quick Start

## 🎉 What You Got

一個完整的 MCP server，可以讀取並監控 Chrome extension 的 service worker console 資訊！

## 📦 Installation

1. **解壓縮檔案**
   ```bash
   tar -xzf chrome-sw-console-mcp-server.tar.gz
   cd chrome-sw-console-mcp-server
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **編譯（如果需要）**
   ```bash
   npm run build
   ```

## 🚀 啟動 Chrome（必要步驟）

在使用此 MCP server 之前，必須先啟動 Chrome 並開啟遠端除錯：

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

## 🔧 測試 MCP Server

使用 MCP Inspector 測試：

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## 📝 配置 Claude Desktop

在 Claude Desktop 配置文件中添加：

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "chrome-sw-console": {
      "command": "node",
      "args": ["/絕對路徑/chrome-sw-console-mcp-server/dist/index.js"]
    }
  }
}
```

重啟 Claude Desktop 即可使用！

## 🎯 基本使用流程

1. **列出所有 Chrome targets**
   - 工具: `chrome_sw_list_targets`
   - 找到你的 service worker 的 target ID

2. **連接到 service worker**
   - 工具: `chrome_sw_connect`
   - 使用上一步找到的 target_id

3. **開始監控**
   - 工具: `chrome_sw_start_monitoring`

4. **獲取 console logs**
   - 工具: `chrome_sw_get_logs`
   - 可以使用各種過濾選項

## 🛠️ 可用工具

- `chrome_sw_list_targets` - 列出所有 Chrome targets
- `chrome_sw_connect` - 連接到特定 target
- `chrome_sw_start_monitoring` - 開始監控 console
- `chrome_sw_stop_monitoring` - 停止監控
- `chrome_sw_get_logs` - 獲取 console logs（支援過濾）
- `chrome_sw_clear_logs` - 清空 log buffer
- `chrome_sw_get_status` - 查看當前狀態
- `chrome_sw_disconnect` - 斷開連接

## 💡 實用範例

### 在 Claude 中使用

直接對 Claude 說：

- "列出我的 Chrome service workers"
- "連接到我的擴充功能的 service worker 並開始監控"
- "顯示所有錯誤級別的 logs"
- "找出包含 'authentication' 的 console 訊息"
- "最近 5 分鐘有什麼錯誤嗎？"

### 進階過濾

獲取最近的錯誤：
```json
{
  "level": "error",
  "limit": 100
}
```

搜尋特定文字：
```json
{
  "text_contains": "API",
  "limit": 50
}
```

時間範圍過濾：
```json
{
  "start_time": 1700000000000,
  "end_time": 1700003600000,
  "limit": 200
}
```

## 📚 文件

- `README.md` - 完整文檔
- `EXAMPLES.md` - 詳細使用範例
- `src/` - 原始碼

## 🐛 常見問題

**Q: "Failed to list Chrome targets"**
A: 確保 Chrome 是用 `--remote-debugging-port=9222` 啟動的

**Q: 找不到 service worker**
A: 確保你的擴充功能已載入，並且 service worker 已啟動

**Q: 沒有捕獲到 logs**
A: 確認已經執行 `chrome_sw_start_monitoring`

## 🎓 學習資源

- Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/
- MCP Documentation: https://modelcontextprotocol.io/
- Service Workers: https://developer.chrome.com/docs/extensions/mv3/service_workers/

## ⭐ 特色功能

✅ 實時監控 service worker console
✅ 支援所有 console 級別（log, info, warn, error, debug）
✅ 捕獲 stack traces 和錯誤詳情
✅ 強大的過濾選項
✅ JSON 和 Markdown 輸出格式
✅ 自動清理舊訊息（1 小時）
✅ 支援多個 service workers

---

製作者筆記：這個 MCP server 使用 Chrome DevTools Protocol 與 Chrome 通訊，
可以實時捕獲你的 Chrome extension service worker 的所有 console 輸出。
非常適合除錯和監控擴充功能的行為！
