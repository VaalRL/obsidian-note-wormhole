# Chrome Service Worker Console MCP Server - 專案結構

## 📁 專案架構

```
chrome-sw-console-mcp-server/
├── src/                          # TypeScript 原始碼
│   ├── index.ts                  # 主入口點，初始化 MCP server
│   ├── types.ts                  # TypeScript 型別定義
│   ├── constants.ts              # 常數配置
│   │
│   ├── services/                 # 核心服務
│   │   ├── chrome-client.ts     # Chrome DevTools Protocol 客戶端
│   │   └── formatters.ts        # 格式化輸出（Markdown/JSON）
│   │
│   ├── schemas/                  # Zod 驗證 schemas
│   │   └── index.ts             # 所有工具的輸入驗證 schemas
│   │
│   └── tools/                    # MCP 工具實作
│       └── index.ts             # 8 個工具的完整實作
│
├── dist/                         # 編譯後的 JavaScript（執行檔）
│   ├── index.js                 # 主入口點
│   └── ...                      # 其他編譯文件
│
├── package.json                  # NPM 配置和依賴
├── tsconfig.json                # TypeScript 編譯器配置
├── README.md                    # 完整文檔
├── EXAMPLES.md                  # 使用範例
└── node_modules/                # NPM 依賴（安裝後產生）
```

## 🔑 核心組件

### 1. Chrome DevTools Client (`services/chrome-client.ts`)

核心服務，負責：
- 連接到 Chrome DevTools Protocol
- 列出所有可用的 targets（service workers, extensions, tabs）
- 連接到特定的 target
- 監控 console 訊息
- 管理訊息緩衝區

**主要類別:** `ChromeDevToolsClient`

**主要方法:**
- `listTargets()` - 列出所有 Chrome targets
- `findServiceWorkers()` - 過濾出 service workers
- `connectToTarget(targetId)` - 連接到特定 target
- `startMonitoring()` - 開始捕獲 console 訊息
- `stopMonitoring()` - 停止捕獲
- `getConsoleMessages(filters)` - 獲取已捕獲的訊息
- `clearMessages()` - 清空緩衝區
- `getStatus()` - 獲取當前狀態

### 2. Formatters (`services/formatters.ts`)

格式化工具，負責：
- 將 console 訊息轉換為 Markdown 格式（人類可讀）
- 將 console 訊息轉換為 JSON 格式（機器可讀）
- 格式化 target 列表
- 格式化狀態資訊

**主要函數:**
- `formatConsoleMessagesMarkdown()` - Markdown 格式
- `formatConsoleMessagesJSON()` - JSON 格式
- `formatTargetsMarkdown()` - Target 列表格式化
- `formatStatusMarkdown()` - 狀態資訊格式化

### 3. Tools (`tools/index.ts`)

實作所有 8 個 MCP 工具：

1. **chrome_sw_list_targets** - 列出所有 Chrome targets
2. **chrome_sw_connect** - 連接到 service worker
3. **chrome_sw_start_monitoring** - 開始監控
4. **chrome_sw_stop_monitoring** - 停止監控
5. **chrome_sw_get_logs** - 獲取 logs（支援過濾）
6. **chrome_sw_clear_logs** - 清空 log buffer
7. **chrome_sw_get_status** - 查看狀態
8. **chrome_sw_disconnect** - 斷開連接

### 4. Schemas (`schemas/index.ts`)

使用 Zod 定義所有工具的輸入驗證規則：
- 確保參數類型正確
- 提供預設值
- 驗證數值範圍
- 提供清晰的錯誤訊息

### 5. Types (`types.ts`)

TypeScript 型別定義：
- `ConsoleMessage` - console 訊息結構
- `ServiceWorkerInfo` - service worker 資訊
- `ChromeTarget` - Chrome target 資訊
- `FilterOptions` - 過濾選項
- 等等...

### 6. Constants (`constants.ts`)

配置常數：
- `DEFAULT_CHROME_HOST` - 預設 Chrome 主機
- `DEFAULT_CHROME_PORT` - 預設 Chrome 埠（9222）
- `CHARACTER_LIMIT` - Markdown 輸出字元限制
- `MESSAGE_RETENTION_TIME` - 訊息保留時間（1小時）
- 等等...

## 🔄 資料流程

```
1. User Request (MCP Tool Call)
   ↓
2. Tool Handler (tools/index.ts)
   ↓
3. Input Validation (Zod schemas)
   ↓
4. Chrome DevTools Client (services/chrome-client.ts)
   ↓
5. Chrome DevTools Protocol
   ↓
6. Chrome Browser / Service Worker
   ↓
7. Response Data
   ↓
8. Formatter (services/formatters.ts)
   ↓
9. Formatted Response (JSON or Markdown)
   ↓
10. Return to User
```

## 🛠️ 技術棧

### 核心技術
- **TypeScript** - 型別安全的 JavaScript
- **Node.js** - JavaScript 執行環境
- **MCP TypeScript SDK** - Model Context Protocol SDK

### 主要依賴
- `@modelcontextprotocol/sdk` - MCP server 實作
- `chrome-remote-interface` - Chrome DevTools Protocol 客戶端
- `zod` - 執行時型別驗證
- `express` - HTTP server（可選）

### 開發工具
- `typescript` - TypeScript 編譯器
- `@types/*` - TypeScript 型別定義

## 📊 訊息捕獲機制

### 捕獲的訊息類型

1. **Console API Calls**
   - `console.log()`
   - `console.info()`
   - `console.warn()`
   - `console.error()`
   - `console.debug()`

2. **Runtime Exceptions**
   - 未捕獲的錯誤
   - Promise rejections
   - Syntax errors

3. **Log Entries**
   - Chrome 內部日誌
   - 網路錯誤
   - 安全警告

### 訊息結構

每個捕獲的訊息包含：
- `timestamp` - 精確時間戳（秒）
- `level` - 日誌級別
- `text` - 訊息內容
- `source` - 來源類型
- `url` - 原始檔案 URL（如果有）
- `lineNumber` - 行號（如果有）
- `stackTrace` - 堆疊追蹤（如果有）
- `args` - 原始參數（如果有）

### 緩衝區管理

- **容量:** 無限制（受記憶體限制）
- **保留時間:** 1 小時（可配置）
- **自動清理:** 定期清除超過保留時間的訊息
- **手動清理:** 使用 `chrome_sw_clear_logs` 工具

## 🔐 安全考量

1. **本地連接:** 預設只接受 localhost 連接
2. **無認證:** Chrome DevTools Protocol 在本地不需要認證
3. **資料隱私:** 所有資料都在本地處理，不上傳到任何伺服器
4. **輸入驗證:** 使用 Zod 進行嚴格的輸入驗證

## 🚀 效能優化

1. **單例模式:** Chrome client 使用單例，避免多次連接
2. **訊息過濾:** 支援多種過濾選項，減少無關資料
3. **分頁支援:** Limit 參數控制返回數量
4. **自動清理:** 避免記憶體洩漏
5. **異步處理:** 所有 I/O 操作都是異步的

## 🧪 測試建議

### 使用 MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### 手動測試流程

1. 啟動 Chrome with debugging
2. 載入測試用的 Chrome extension
3. 執行各個 MCP 工具
4. 驗證輸出格式和內容
5. 測試錯誤處理

### 單元測試（未來改進）

可以添加：
- Chrome client 單元測試
- Formatter 單元測試
- Schema 驗證測試
- 整合測試

## 📈 未來改進方向

1. **持久化儲存:** 將 logs 儲存到檔案或資料庫
2. **即時通知:** 當捕獲到錯誤時發送通知
3. **多客戶端支援:** 支援同時監控多個 service workers
4. **視覺化介面:** Web UI 顯示 logs
5. **日誌分析:** 自動分析錯誤模式
6. **效能監控:** 捕獲效能指標
7. **自動重連:** Service worker 重啟時自動重新連接

## 🤝 貢獻指南

歡迎提交 Pull Requests！

建議的改進：
- 添加單元測試
- 改進錯誤處理
- 增加新功能
- 優化效能
- 改進文檔

## 📞 支援

如有問題，請查看：
- `README.md` - 主要文檔
- `EXAMPLES.md` - 使用範例
- Chrome DevTools Protocol 文檔

---

此 MCP server 遵循 MCP 最佳實踐，使用現代的 TypeScript 和 Node.js 技術。
