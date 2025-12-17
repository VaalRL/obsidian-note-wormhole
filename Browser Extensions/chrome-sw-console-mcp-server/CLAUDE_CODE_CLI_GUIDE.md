# Chrome Service Worker Console MCP - Claude Code CLI 配置指南

## 🎯 概述

這個 MCP server 完全支援 Claude Code CLI！你可以在命令行中使用 Claude Code 來監控和除錯你的 Chrome extension service workers。

## ✅ 前置需求

1. **Claude Code CLI** - 已安裝並可用
   ```bash
   claude --version
   ```

2. **Node.js 18+** - 執行 MCP server
   ```bash
   node --version
   ```

3. **已編譯的 MCP server** - 確保已執行 `npm run build`

## 🚀 快速安裝（三步驟）

### 步驟 1: 添加 MCP Server

使用 Claude Code CLI 的 `mcp add` 指令：

```bash
# User scope - 在所有專案中可用（推薦）
claude mcp add chrome-sw-console --scope user -- \
  node /絕對路徑/chrome-sw-console-mcp-server/dist/index.js

# Project scope - 只在當前專案中可用
claude mcp add chrome-sw-console --scope project -- \
  node /絕對路徑/chrome-sw-console-mcp-server/dist/index.js
```

**注意**: 請將 `/絕對路徑/chrome-sw-console-mcp-server` 替換為實際路徑

### 步驟 2: 驗證安裝

```bash
# 列出所有已配置的 MCP servers
claude mcp list

# 測試特定 server
claude mcp get chrome-sw-console
```

應該會看到類似輸出：
```
chrome-sw-console:
  command: node
  args: ["/path/to/chrome-sw-console-mcp-server/dist/index.js"]
  scope: user
```

### 步驟 3: 啟動 Chrome with Debugging

在使用前，確保 Chrome 已開啟遠端除錯：

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 &

# Linux
google-chrome --remote-debugging-port=9222 &

# Windows (WSL)
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 &
```

## 💻 使用 Claude Code CLI

### 啟動 Claude Code

```bash
claude
```

### 基本使用範例

#### 範例 1: 列出所有 Service Workers

```
You: 列出所有 Chrome service workers

Claude: [自動調用 chrome_sw_list_targets 工具]
```

#### 範例 2: 監控特定 Extension

```
You: 我想監控我的 Chrome extension 的 console 訊息

Claude: 好的，讓我先列出可用的 service workers...
[調用 chrome_sw_list_targets]

找到了幾個 service workers。請問你要監控哪一個？

You: 連接到 ID 為 "ABC-123-DEF-456" 的那個

Claude: [調用 chrome_sw_connect]
已連接到 service worker。現在開始監控...
[調用 chrome_sw_start_monitoring]
監控已啟動！

You: 顯示所有錯誤訊息

Claude: [調用 chrome_sw_get_logs with level="error"]
```

#### 範例 3: 過濾特定時間的 Logs

```
You: 顯示最近 5 分鐘包含 "authentication" 的 console 訊息

Claude: [調用 chrome_sw_get_logs with filters]
```

## 🛠️ 進階配置

### 手動編輯配置文件

配置文件位置：
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

手動添加配置：

```json
{
  "mcpServers": {
    "chrome-sw-console": {
      "command": "node",
      "args": ["/絕對路徑/chrome-sw-console-mcp-server/dist/index.js"],
      "env": {
        "CHROME_HOST": "localhost",
        "CHROME_PORT": "9222"
      }
    }
  }
}
```

**注意**: 手動編輯後需要重啟 Claude Code CLI

### 使用不同的 Chrome Port

如果你的 Chrome 使用不同的 debugging port：

```json
{
  "mcpServers": {
    "chrome-sw-console": {
      "command": "node",
      "args": ["/絕對路徑/chrome-sw-console-mcp-server/dist/index.js"],
      "env": {
        "DEFAULT_CHROME_PORT": "9223"
      }
    }
  }
}
```

### 增加輸出限制

MCP 工具輸出有 token 限制。如果需要顯示大量 logs：

```bash
# 設置更高的 MCP 輸出限制（預設 25,000 tokens）
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

## 📋 可用的工具

在 Claude Code CLI 中，以下 8 個工具會自動可用：

1. **chrome_sw_list_targets** - 列出所有 Chrome targets
2. **chrome_sw_connect** - 連接到特定 service worker
3. **chrome_sw_start_monitoring** - 開始監控 console
4. **chrome_sw_stop_monitoring** - 停止監控
5. **chrome_sw_get_logs** - 獲取 console logs（支援過濾）
6. **chrome_sw_clear_logs** - 清空 log buffer
7. **chrome_sw_get_status** - 查看當前狀態
8. **chrome_sw_disconnect** - 斷開連接

### 查看所有工具

在 Claude Code 對話中輸入：

```
/mcp
```

會顯示所有可用的 MCP servers 和它們提供的工具。

## 🎯 實用工作流程

### 工作流程 1: 快速除錯

```bash
# 啟動 Claude Code
claude

# 在對話中
> 列出 Chrome service workers，連接到我的 extension，並顯示最近的錯誤

# Claude 會自動執行一系列操作：
# 1. chrome_sw_list_targets
# 2. chrome_sw_connect (你可能需要指定 target_id)
# 3. chrome_sw_start_monitoring
# 4. chrome_sw_get_logs (level="error")
```

### 工作流程 2: 持續監控

```bash
claude

> 開始監控我的 extension service worker 的 console

# 讓 extension 執行一些操作

> 顯示所有新的 console 訊息

> 清空 buffer 並繼續監控

# 重複查看新訊息的過程
```

### 工作流程 3: 分析特定問題

```bash
claude

> 我的 extension 在執行 API 呼叫時出錯，幫我找出問題

# Claude 可能會：
# 1. 連接到 service worker
# 2. 開始監控
# 3. 建議你觸發 API 呼叫
# 4. 檢索包含 "API" 或 "fetch" 的錯誤訊息
# 5. 分析 stack traces
# 6. 提供修復建議
```

## 🔧 疑難排解

### 問題 1: 找不到 MCP server

```bash
# 檢查 server 是否已添加
claude mcp list

# 如果沒有，重新添加
claude mcp add chrome-sw-console --scope user -- \
  node /path/to/chrome-sw-console-mcp-server/dist/index.js
```

### 問題 2: MCP server 無法啟動

```bash
# 手動測試 server 是否可執行
node /path/to/chrome-sw-console-mcp-server/dist/index.js

# 檢查是否有編譯錯誤
cd /path/to/chrome-sw-console-mcp-server
npm run build
```

### 問題 3: 工具未出現在 Claude Code 中

```bash
# 重啟 Claude Code
# Ctrl+C 退出，然後重新執行
claude

# 在 Claude Code 中檢查
/mcp
```

### 問題 4: Chrome 連接失敗

確保：
1. Chrome 使用 `--remote-debugging-port=9222` 啟動
2. 訪問 http://localhost:9222/json 確認可訪問
3. 防火牆未阻擋 9222 port

## 📊 輸出格式

Claude Code 會智能選擇輸出格式：
- **對話式回應**: 自動使用 Markdown 格式（人類可讀）
- **程式化處理**: 可以要求 JSON 格式

範例：
```
You: 以 JSON 格式顯示所有 service workers

Claude: [會使用 response_format: "json"]
```

## 💡 最佳實踐

### 1. 使用描述性的請求

❌ **不好**: "show logs"
✅ **好**: "顯示最近 10 分鐘包含 'error' 的 console 訊息"

### 2. 善用過濾

```
> 只顯示錯誤級別的 logs
> 找出包含 "authentication" 的訊息
> 顯示最近 5 分鐘的所有 console 輸出
```

### 3. 清理 Buffer

長時間監控時，定期清理 buffer：
```
> 清空 console logs buffer
```

### 4. 檢查狀態

不確定當前狀態時：
```
> 顯示監控狀態
```

## 🚀 進階技巧

### 與其他工具結合

Claude Code 可以將 Chrome console monitoring 與其他工具結合：

```
> 監控 service worker 的錯誤，如果發現錯誤就幫我在程式碼中找到相關的檔案並修正

# Claude 會：
# 1. 使用 chrome_sw_get_logs 獲取錯誤
# 2. 使用內建的檔案工具讀取相關程式碼
# 3. 分析錯誤和程式碼
# 4. 建議或直接修正問題
```

### 自動化除錯

```
> 建立一個除錯工作流程：
> 1. 列出 service workers
> 2. 連接到我的 extension
> 3. 開始監控
> 4. 等我測試完後顯示所有錯誤
> 5. 分析錯誤並提供修正建議
```

## 📚 相關文檔

- [Claude Code 官方文檔](https://docs.claude.com/en/docs/claude-code/overview)
- [MCP 協議文檔](https://modelcontextprotocol.io/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

## 🎓 範例對話

### 範例 A: 首次設定

```
You: 我想監控我的 Chrome extension 的 service worker console

Claude: 好的！讓我幫你設定。首先，我需要列出可用的 Chrome targets。

[調用 chrome_sw_list_targets]

我找到了以下 service workers：
1. ID: ABC-123-DEF-456
   Title: Service Worker chrome-extension://abcd1234...
   URL: chrome-extension://abcd1234.../background.js

你要監控哪一個？

You: 第一個

Claude: 好的，正在連接到 ABC-123-DEF-456...
[調用 chrome_sw_connect]

已成功連接！現在開始監控 console 訊息...
[調用 chrome_sw_start_monitoring]

監控已啟動。你可以開始使用你的 extension，我會捕獲所有 console 訊息。
需要查看 logs 時隨時告訴我！
```

### 範例 B: 除錯特定問題

```
You: 我的 extension 在嘗試登入時出現錯誤，幫我找出問題

Claude: 好的，讓我查看包含 "login" 或 "auth" 相關的錯誤訊息...

[調用 chrome_sw_get_logs with text_contains="login", level="error"]

我發現了以下錯誤：
❌ ERROR - 2025-11-15 13:45:23
Source: console-api
Message: Failed to fetch: NetworkError when attempting to fetch resource.
File: background.js:145

這看起來是網路請求失敗。可能的原因：
1. API endpoint 不可訪問
2. CORS 配置問題
3. 網路連接問題

讓我檢查你的 background.js 第 145 行的程式碼...
```

## ✅ 檢查清單

在使用 Chrome Service Worker Console MCP 前確認：

- [ ] Claude Code CLI 已安裝且可用
- [ ] MCP server 已編譯 (`npm run build`)
- [ ] 使用 `claude mcp add` 添加了 server
- [ ] 使用 `claude mcp list` 確認 server 存在
- [ ] Chrome 使用 `--remote-debugging-port=9222` 啟動
- [ ] Extension 已載入且 service worker 在執行中
- [ ] 可以訪問 http://localhost:9222/json

---

**準備好了嗎？**

```bash
# 啟動 Claude Code
claude

# 開始監控！
> 幫我設定 Chrome extension service worker 的 console 監控
```

祝你除錯順利！🚀
