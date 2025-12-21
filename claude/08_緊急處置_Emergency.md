# 08｜緊急處置手冊（Emergency Procedures）

## 1. 常見災難與應對

### 1.1 伺服器/Tunnel 卡死 (Zombie Process)
*   **症狀**：Obsidian 關閉後，Node Process 仍在背景執行，或新啟動時報錯 "Address in use"。
*   **處置**：
    *   **Windows**: `taskkill /F /IM node.exe`
    *   **Mac/Linux**: `pkill -f node` OR Find PID `lsof -i :<port>` then `kill -9 <PID>`
    *   **預防**：確保 `onunload()` 中有確實呼叫 `server.close()` 與 `tunnel.close()`。

### 1.2 Tunnel 連結失效 (404/Corp Error)
*   **症狀**：分享的連結無法訪問。
*   **處置**：
    *   檢查本地 Console 是否有報錯。
    *   重啟 Plugin (Reload) 以獲取新 URL。
    *   檢查 Cloudflare Status 是否正常。

## 2. 如果違反規則
1.  **立刻停止**：不要再堆疊錯誤。
2.  **評估影響**：是否有記憶體洩漏？是否暴露了不該暴露的檔案？
3.  **修正**：改以正確流程處理。
4.  **防範再犯**：補強規劃與檢查清單。
