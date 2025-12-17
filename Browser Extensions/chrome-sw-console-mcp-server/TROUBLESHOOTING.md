# Chrome Service Worker Console MCP Server - 疑難排解指南

## 🔍 常見問題與解決方案

### 問題 1: "Failed to list Chrome targets"

**症狀:**
```
Error listing Chrome targets: Failed to list Chrome targets: connect ECONNREFUSED 127.0.0.1:9222
```

**原因:**
- Chrome 沒有啟動
- Chrome 沒有使用 `--remote-debugging-port=9222` 參數啟動
- Chrome 使用了不同的 port

**解決方案:**

1. **確認 Chrome 已啟動並開啟 remote debugging:**

   macOS:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```

   Linux:
   ```bash
   google-chrome --remote-debugging-port=9222
   ```

   Windows:
   ```bash
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
   ```

2. **驗證 Chrome DevTools 是否可訪問:**
   
   在瀏覽器中訪問: http://localhost:9222/json
   
   應該會看到 JSON 格式的 targets 列表

3. **檢查防火牆設定:**
   
   確保 localhost:9222 沒有被防火牆阻擋

4. **確認 port 設定:**
   
   如果使用不同的 port，在 tool 參數中指定：
   ```json
   {
     "chrome_port": 9223
   }
   ```

---

### 問題 2: "Not connected to any target"

**症狀:**
```
Not connected to any target. Use chrome_sw_connect first.
```

**原因:**
- 尚未執行 `chrome_sw_connect`
- 之前的連接已斷開

**解決方案:**

1. **先列出可用的 targets:**
   ```
   使用工具: chrome_sw_list_targets
   ```

2. **連接到你的 service worker:**
   ```
   使用工具: chrome_sw_connect
   參數: { "target_id": "從上一步獲得的ID" }
   ```

3. **檢查連接狀態:**
   ```
   使用工具: chrome_sw_get_status
   ```

---

### 問題 3: 找不到 Service Worker

**症狀:**
- `chrome_sw_list_targets` 的結果中沒有 service worker

**原因:**
- Extension 沒有載入
- Service worker 還沒有啟動（lazy loading）
- Service worker 已經停止

**解決方案:**

1. **確認 Extension 已載入:**
   - 打開 `chrome://extensions/`
   - 確認你的 extension 已啟用

2. **觸發 Service Worker 啟動:**
   - 點擊 extension 圖示
   - 執行 extension 的某個功能
   - 或者在 `chrome://extensions/` 頁面點擊 "Service worker" 查看

3. **重新列出 targets:**
   ```
   再次使用: chrome_sw_list_targets
   ```

4. **檢查 Service Worker 狀態:**
   - 在 `chrome://serviceworker-internals/` 查看所有 service workers
   - 確認你的 service worker 狀態為 "ACTIVATED"

---

### 問題 4: 沒有捕獲到 Console Logs

**症狀:**
- `chrome_sw_get_logs` 返回空結果
- 明明有執行 console.log 但看不到

**原因:**
- 沒有執行 `chrome_sw_start_monitoring`
- Console logs 是在開始監控之前產生的
- Service worker 重啟後需要重新監控

**解決方案:**

1. **確認監控狀態:**
   ```
   使用工具: chrome_sw_get_status
   檢查 "monitoring" 是否為 true
   ```

2. **開始監控:**
   ```
   使用工具: chrome_sw_start_monitoring
   ```

3. **清空舊 logs 重新開始:**
   ```
   使用工具: chrome_sw_clear_logs
   ```

4. **在監控開始後觸發 extension 功能:**
   - 確保 logs 是在監控開始後產生的

5. **驗證 console.log 確實有執行:**
   - 在 Chrome DevTools 中打開 service worker
   - 手動執行 `console.log('test')` 來測試

---

### 問題 5: Service Worker 不斷重啟

**症狀:**
- 連接突然斷開
- 需要頻繁重新連接

**原因:**
- Chrome 的 service worker 生命週期管理
- Service workers 在不活躍時會被終止
- Extension 更新時 service worker 會重啟

**解決方案:**

1. **保持 Service Worker 活躍:**
   - 持續與 extension 互動
   - 使用 Chrome DevTools 的 "Service worker" 面板保持開啟

2. **實作自動重連機制:**
   ```javascript
   // 監聽連接狀態，在斷開時自動重連
   async function ensureConnected(targetId) {
     const status = await chrome_sw_get_status();
     if (!status.connected) {
       await chrome_sw_connect({ target_id: targetId });
       await chrome_sw_start_monitoring();
     }
   }
   ```

3. **使用 Service Worker Keep-Alive 技巧:**
   在你的 extension 中：
   ```javascript
   // background.js (service worker)
   chrome.runtime.onInstalled.addListener(() => {
     // 設置定期任務保持活躍
     chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
   });
   ```

---

### 問題 6: "Connection timeout" 或連接緩慢

**症狀:**
- 工具執行很慢
- 偶爾出現 timeout 錯誤

**原因:**
- Chrome 負載過高
- 系統資源不足
- 網路問題（如果使用遠端 Chrome）

**解決方案:**

1. **關閉不必要的 Chrome 分頁:**
   - 減少 Chrome 的記憶體使用

2. **重啟 Chrome:**
   ```bash
   # 關閉所有 Chrome 進程
   # 然後重新啟動 with debugging
   ```

3. **檢查系統資源:**
   - 確保有足夠的記憶體和 CPU
   - 關閉其他佔用資源的應用

4. **如果使用遠端 Chrome，檢查網路連接:**
   ```bash
   ping chrome-host
   ```

---

### 問題 7: Logs 被截斷或太多

**症狀:**
- Markdown 輸出顯示 "[TRUNCATED]"
- 看不到所有的 logs

**原因:**
- 輸出超過字元限制（100,000 字元）
- Logs 數量超過 limit 參數

**解決方案:**

1. **使用過濾減少結果:**
   ```json
   {
     "level": "error",  // 只看錯誤
     "text_contains": "specific_keyword"  // 搜尋特定關鍵字
   }
   ```

2. **增加 limit 參數:**
   ```json
   {
     "limit": 500  // 最大值
   }
   ```

3. **使用時間範圍過濾:**
   ```json
   {
     "start_time": 1700000000000,
     "end_time": 1700003600000
   }
   ```

4. **使用 JSON 格式:**
   - JSON 格式更緊湊
   ```json
   {
     "response_format": "json"
   }
   ```

5. **定期清空 buffer:**
   ```
   定期使用: chrome_sw_clear_logs
   ```

---

### 問題 8: TypeScript 編譯錯誤

**症狀:**
```
npm run build 失敗
```

**原因:**
- 型別錯誤
- 依賴版本不匹配
- node_modules 損壞

**解決方案:**

1. **清除並重新安裝依賴:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **確認 Node.js 版本:**
   ```bash
   node --version  # 應該 >= 18
   ```

3. **檢查 TypeScript 版本:**
   ```bash
   npx tsc --version
   ```

4. **嘗試清除 TypeScript cache:**
   ```bash
   rm -rf dist
   npm run build
   ```

---

### 問題 9: MCP Server 無法啟動

**症狀:**
- Claude Desktop 配置後無法使用工具
- Server 啟動失敗

**原因:**
- 路徑配置錯誤
- 權限問題
- Node.js 版本不相容

**解決方案:**

1. **檢查 Claude Desktop 配置:**
   ```json
   {
     "mcpServers": {
       "chrome-sw-console": {
         "command": "node",
         "args": ["/完整絕對路徑/chrome-sw-console-mcp-server/dist/index.js"]
       }
     }
   }
   ```

2. **確認路徑正確:**
   ```bash
   # 測試路徑是否可執行
   node /path/to/chrome-sw-console-mcp-server/dist/index.js
   ```

3. **檢查檔案權限:**
   ```bash
   chmod +x /path/to/chrome-sw-console-mcp-server/dist/index.js
   ```

4. **查看 Claude Desktop 日誌:**
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

5. **使用 MCP Inspector 測試:**
   ```bash
   npx @modelcontextprotocol/inspector node dist/index.js
   ```

---

### 問題 10: Ports 衝突

**症狀:**
- "Port already in use" 錯誤

**原因:**
- 9222 port 被其他進程佔用
- 已有另一個 Chrome instance 在使用

**解決方案:**

1. **找出佔用 port 的進程:**
   
   macOS/Linux:
   ```bash
   lsof -i :9222
   ```
   
   Windows:
   ```bash
   netstat -ano | findstr :9222
   ```

2. **終止佔用的進程或使用不同 port:**
   ```bash
   # 使用不同的 port 啟動 Chrome
   chrome --remote-debugging-port=9223
   ```
   
   然後在工具參數中指定：
   ```json
   {
     "chrome_port": 9223
   }
   ```

---

## 🛠️ 除錯技巧

### 1. 啟用詳細日誌

在 `src/index.ts` 中添加更多 console.error 輸出：

```typescript
console.error('Debug: Tool called with params:', params);
```

### 2. 使用 Chrome DevTools Protocol Explorer

訪問 http://localhost:9222 查看所有可用的 endpoints

### 3. 手動測試 CDP 連接

```javascript
const CDP = require('chrome-remote-interface');

CDP({ host: 'localhost', port: 9222 }, (client) => {
  console.log('Connected!');
  client.close();
}).on('error', (err) => {
  console.error('Error:', err);
});
```

### 4. 檢查 Service Worker 狀態

在 Chrome 中訪問：
- `chrome://serviceworker-internals/`
- `chrome://inspect/#service-workers`

### 5. 使用 MCP Inspector

這是最好的除錯工具：

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

在瀏覽器中開啟 Inspector，可以：
- 查看所有可用工具
- 測試工具調用
- 查看即時日誌
- 檢查輸入/輸出

---

## 📞 取得幫助

如果以上解決方案都無法解決你的問題：

1. **檢查 Chrome DevTools Protocol 文檔:**
   https://chromedevtools.github.io/devtools-protocol/

2. **查看 MCP 文檔:**
   https://modelcontextprotocol.io/

3. **檢查 chrome-remote-interface 文檔:**
   https://github.com/cyrus-and/chrome-remote-interface

4. **查看專案 Issues:**
   檢查是否有其他人遇到類似問題

---

## ✅ 健康檢查清單

在報告問題前，請確認：

- [ ] Chrome 使用 `--remote-debugging-port=9222` 啟動
- [ ] http://localhost:9222/json 可訪問
- [ ] Extension 已載入且啟用
- [ ] Service worker 在 `chrome://serviceworker-internals/` 中顯示為 ACTIVATED
- [ ] `npm install` 已成功執行
- [ ] `npm run build` 沒有錯誤
- [ ] Node.js 版本 >= 18
- [ ] 已執行正確的工具順序（list → connect → start_monitoring → get_logs）

---

好運！希望這份指南能幫助你解決問題。🚀
