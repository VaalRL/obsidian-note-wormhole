# 01｜前置檢查清單（Preflight Checklist）

## 每次開始任務前必做

1.  **確認目標**：
    *   [ ] 我是否讀過且理解 `req.md` 中的相關需求？
    *   [ ] 我是否清楚我正在解決 `req.md` 中的哪個 Feature ID (如 F-01, S-01)？

2.  **確認規範**：
    *   [ ] 我是否已熟讀 `OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md`？
    *   [ ] (若寫 Code) 我是否確認不使用 `fs`, `path` 等原生 Node 模組（或已做好相容）？
    *   [ ] (若修改 UI) 我是否確認使用 CSS Variables 而非 Hardcode 顏色？

3.  **確認環境**：
    *   [ ] 我是否已執行 `npm install` 確保依賴最新？
    *   [ ] 我是否在正確的專案目錄下？

4.  **搜尋現有程式碼**：
    *   [ ] 我是否已搜尋過專案中類似的實作？
    *   [ ] 我是否確認沒有重複造輪子？（例如是否有現成的 utility function）

> **如果以上有任何「否」，請先完成閱讀或搜尋再開始動手。**
