# 🎉 Chrome Service Worker Console MCP Server - 完成！

## 📦 你獲得了什麼

一個完整、功能齊全的 MCP (Model Context Protocol) server，專門用於讀取和監控 Chrome extension service worker 的 console 資訊！

## ✨ 主要特性

### 🔍 核心功能
- ✅ **實時監控** - 捕獲 service worker 的所有 console 訊息
- ✅ **全面支援** - 支援所有 console 級別（log, info, warn, error, debug）
- ✅ **詳細資訊** - 包含 stack traces、timestamps、source locations
- ✅ **強大過濾** - 按級別、時間範圍、文字內容過濾
- ✅ **雙格式輸出** - JSON（機器可讀）和 Markdown（人類可讀）
- ✅ **自動管理** - 1小時訊息保留，自動清理舊訊息

### 🛠️ 8 個專業工具

1. **chrome_sw_list_targets** - 列出所有 Chrome targets
2. **chrome_sw_connect** - 連接到特定 service worker
3. **chrome_sw_start_monitoring** - 開始監控 console
4. **chrome_sw_stop_monitoring** - 停止監控
5. **chrome_sw_get_logs** - 獲取 logs（支援強大過濾）
6. **chrome_sw_clear_logs** - 清空 log buffer
7. **chrome_sw_get_status** - 查看當前狀態
8. **chrome_sw_disconnect** - 斷開連接

### 🏗️ 專業架構

- **TypeScript** - 完整型別安全
- **Zod Validation** - 執行時輸入驗證
- **Chrome DevTools Protocol** - 官方 Chrome debugging API
- **MCP SDK** - 遵循 MCP 最佳實踐
- **模組化設計** - 清晰的程式碼結構

## 📁 檔案清單

```
chrome-sw-console-mcp-server.tar.gz  ← 主要壓縮包
QUICKSTART.md                        ← 快速開始指南（中文）
PROJECT_STRUCTURE.md                 ← 專案結構說明
TROUBLESHOOTING.md                   ← 疑難排解指南
```

### 壓縮包內容

```
chrome-sw-console-mcp-server/
├── README.md          ← 完整英文文檔
├── EXAMPLES.md        ← 詳細使用範例
├── package.json       ← NPM 配置
├── tsconfig.json      ← TypeScript 配置
├── src/              ← TypeScript 原始碼
│   ├── index.ts      
│   ├── types.ts      
│   ├── constants.ts  
│   ├── services/     
│   ├── schemas/      
│   └── tools/        
└── dist/             ← 編譯後的 JavaScript（執行檔）
```

## 🚀 快速開始 3 步驟

### 1️⃣ 解壓並安裝

```bash
tar -xzf chrome-sw-console-mcp-server.tar.gz
cd chrome-sw-console-mcp-server
npm install
```

### 2️⃣ 啟動 Chrome with Debugging

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux  
google-chrome --remote-debugging-port=9222

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

### 3️⃣ 配置 Claude Desktop

編輯配置文件：

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

重啟 Claude Desktop，開始使用！

## 💡 使用範例

### 在 Claude 中直接使用

對 Claude 說：

```
"列出我的 Chrome service workers"
"連接到我的擴充功能的 service worker"
"開始監控 console"
"顯示所有錯誤訊息"
"找出包含 'API' 的 logs"
"最近 5 分鐘有什麼錯誤嗎？"
```

### 基本工作流程

```
1. chrome_sw_list_targets       ← 找到你的 service worker
2. chrome_sw_connect            ← 連接到它
3. chrome_sw_start_monitoring   ← 開始監控
4. [使用你的 extension]
5. chrome_sw_get_logs           ← 查看 logs
```

### 進階過濾

```json
// 只看錯誤
{ "level": "error" }

// 搜尋關鍵字
{ "text_contains": "authentication" }

// 時間範圍
{ 
  "start_time": 1700000000000,
  "end_time": 1700003600000 
}

// 組合過濾
{
  "level": "error",
  "text_contains": "API",
  "limit": 100
}
```

## 🎯 使用場景

### 開發除錯
- 監控 extension 啟動錯誤
- 追蹤 API 呼叫問題
- 檢查非同步操作
- 分析效能瓶頸

### 品質保證
- 自動化錯誤檢測
- 回歸測試
- 持續監控
- 日誌收集

### 生產監控
- 即時錯誤追蹤
- 使用者問題診斷
- 效能監控
- 異常偵測

## 🔧 技術亮點

### 遵循 MCP 最佳實踐
- ✅ 清晰的工具命名（`chrome_sw_*` prefix）
- ✅ 完整的工具描述和範例
- ✅ 結構化輸出（JSON + Markdown）
- ✅ 適當的工具註解（readOnlyHint, destructiveHint 等）
- ✅ 錯誤處理和用戶指引

### 高品質程式碼
- ✅ TypeScript strict mode
- ✅ 完整型別定義
- ✅ Zod 執行時驗證
- ✅ 模組化架構
- ✅ 無重複程式碼（DRY）
- ✅ 清晰的錯誤訊息

### 專業功能
- ✅ 自動訊息清理
- ✅ 記憶體管理
- ✅ 多種過濾選項
- ✅ 分頁支援
- ✅ 字元限制處理
- ✅ Stack trace 捕獲

## 📚 文檔資源

### 立即閱讀
1. **QUICKSTART.md** - 最快上手（推薦先讀）
2. **README.md** - 完整功能說明
3. **EXAMPLES.md** - 實用範例集合
4. **PROJECT_STRUCTURE.md** - 架構深入解析
5. **TROUBLESHOOTING.md** - 問題解決指南

### 外部資源
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Service Workers Guide](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

## 🐛 常見問題

### Q: 找不到 service worker？
A: 確保 extension 已載入，並觸發 service worker 啟動（點擊 extension 圖示）

### Q: 沒有捕獲到 logs？
A: 確認已執行 `chrome_sw_start_monitoring`，且 logs 是在監控開始後產生

### Q: Chrome 連接失敗？
A: 確保 Chrome 使用 `--remote-debugging-port=9222` 啟動

更多問題？查看 **TROUBLESHOOTING.md**！

## 🌟 特色優勢

### 與手動查看 DevTools 相比
- ✅ **自動化** - 可程式化操作，不需手動點擊
- ✅ **過濾強大** - 多維度過濾，快速定位問題
- ✅ **整合友好** - 可與 Claude 或其他工具整合
- ✅ **批量處理** - 可同時處理多個 service workers
- ✅ **歷史記錄** - 保留最近 1 小時的 logs

### 與其他監控工具相比
- ✅ **專注 Service Workers** - 為 Chrome extensions 量身打造
- ✅ **MCP 整合** - 可直接在 Claude 中使用
- ✅ **輕量級** - 無需額外的監控系統
- ✅ **本地運行** - 資料不離開你的電腦
- ✅ **開源** - 可自由修改和擴展

## 🚀 進階應用

### 自動化測試
```javascript
// 在測試腳本中使用
async function testExtension() {
  await connectToServiceWorker();
  await startMonitoring();
  
  // 執行測試操作
  await performExtensionAction();
  
  // 檢查是否有錯誤
  const logs = await getLogs({ level: 'error' });
  if (logs.total > 0) {
    throw new Error('Extension produced errors!');
  }
}
```

### 持續監控
```javascript
// 每分鐘檢查一次錯誤
setInterval(async () => {
  const errors = await getLogs({ 
    level: 'error',
    start_time: Date.now() - 60000 
  });
  
  if (errors.total > 0) {
    sendAlert(errors);
  }
}, 60000);
```

### 與 CI/CD 整合
```yaml
# GitHub Actions 範例
- name: Monitor Extension Errors
  run: |
    node monitor-extension.js
    if [ $? -ne 0 ]; then
      echo "Extension errors detected!"
      exit 1
    fi
```

## 📊 效能特性

- **低延遲** - 直接使用 Chrome DevTools Protocol
- **記憶體效率** - 自動清理舊訊息
- **非阻塞** - 所有操作都是異步的
- **可擴展** - 支援監控多個 targets
- **輕量級** - 最小依賴，快速啟動

## 🎓 學習價值

這個專案展示了：

1. **MCP Server 開發** - 完整的 MCP server 實作範例
2. **TypeScript 最佳實踐** - 嚴格型別、模組化設計
3. **Chrome DevTools Protocol** - 如何與 Chrome 通訊
4. **工具設計** - 如何設計易用的 API
5. **錯誤處理** - 優雅的錯誤處理和用戶指引
6. **文檔撰寫** - 專業的文檔結構

## 🤝 回饋與改進

這個 MCP server 是根據你的需求量身打造的！

如果你需要：
- 新增功能
- 改進效能
- 修正問題
- 擴展文檔

歡迎提出建議！

## 🎊 總結

你現在擁有一個：
- ✅ **功能完整** 的 Chrome service worker console 監控工具
- ✅ **專業品質** 的 TypeScript 程式碼
- ✅ **詳盡文檔** 的專案
- ✅ **即用即玩** 的 MCP server
- ✅ **可擴展** 的架構

完全遵循 MCP 最佳實踐，使用現代化技術棧，並提供完整的中英文文檔。

立即開始使用，享受無縫的 Chrome extension 除錯體驗！

---

**檔案位置:**
- 壓縮包: `chrome-sw-console-mcp-server.tar.gz`
- 文檔: `QUICKSTART.md`, `PROJECT_STRUCTURE.md`, `TROUBLESHOOTING.md`

**開始使用:**
1. 解壓縮
2. `npm install`
3. 啟動 Chrome with debugging
4. 配置 Claude Desktop
5. 開始監控！

祝你使用愉快！🚀
