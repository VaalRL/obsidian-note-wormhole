# 02｜任務執行：TodoWrite 與 Task Agents

## 何時使用
- 任務 **≥3 步**或需多人/多代理並行
- 操作 **>30 秒** 或需背景持續（context 切換不會中斷）

## 作法
1. **TodoWrite**：把任務拆成清單（可平行），為每項標示輸入/輸出、完成定義、風險、Rollback。
2. **啟動 Task Agents**：長任務交由 Task Agent 執行；Bash 在 context 切換會中斷。
3. **檢查點策略**：重要步驟後做 Git checkpoint；必要時建立備份。
4. **驗收**：以測試與成功指標驗證每一子任務。

## 產出
- Todo 清單（含優先順序、阻塞項）
- 自動化測試與驗收報告
- 更新 `TODO.md` 的進度與決策
