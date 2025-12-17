# CLAUDE.md（任務分配主文件）

> 本文件作為「入口與路由」，依任務情境指派要閱讀的任務指南。所有內容均整理自原始 CLAUDE 規範。

## 快速路由（你要做什麼？）

- **準備開始任何任務** → 讀《01_前置檢查清單》與《03_搜尋優先與架構定位》  
- **撰寫或修改功能** → 讀《04_程式品質與測試（TDD）》＋《03_搜尋優先與架構定位》＋《05_檔案與目錄規範》  
- **長時間或多步驟任務**（>30 秒或 ≥3 步）→ 讀《02_TodoWrite 與 Task Agents》  
- **需要重構 / 消除重複 / 整併** → 讀《03_搜尋優先與架構定位》＋《05_檔案與目錄規範》  
- **要動用外部工具或 CLI** → 讀《06_工具使用與限制》  
- **大範圍變更完成後** → 讀《07_多代理人協作與審查流程》  
- **出了狀況、違規或需要止血** → 讀《08_緊急處置手冊》  
- **想複習原則與心法** → 讀《09_最佳實務摘要》

> 建議檔案位置：`docs/claude/` 目錄。**嚴禁**在 repo root 亂放檔案。

## 目錄
1. [01_前置檢查清單_Preflight-Checklist.md](./docs/claude/01_前置檢查清單_Preflight-Checklist.md)
2. [02_任務執行_TodoWrite_與_TaskAgents.md](./docs/claude/02_任務執行_TodoWrite_與_TaskAgents.md)
3. [03_搜尋優先與架構定位_SearchFirst_Architecture.md](./docs/claude/03_搜尋優先與架構定位_SearchFirst_Architecture.md)
4. [04_程式品質與測試_TDD.md](./docs/claude/04_程式品質與測試_TDD.md)
5. [05_檔案與目錄規範_Repo_Structure.md](./docs/claude/05_檔案與目錄規範_Repo_Structure.md)
6. [06_工具使用與限制_Tooling.md](./docs/claude/06_工具使用與限制_Tooling.md)
7. [07_多代理人協作與審查_Reviews.md](./docs/claude/07_多代理人協作與審查_Reviews.md)
8. [08_緊急處置_Emergency.md](./docs/claude/08_緊急處置_Emergency.md)
9. [09_最佳實務_BestPractices.md](./docs/claude/09_最佳實務_BestPractices.md)

---

## 全域硬規則（永遠適用）
- **單一真實來源（SSOT）**：不要重複實作；延伸既有功能，而不是平行新版本。
- **禁止在 root 目錄新增檔案**；輸出、文件請放到既定模組/目錄。
- **不可使用互動式 git（`-i`）與 `find/grep/cat/head/tail/ls`**（請改用專用工具）。
- **可測、可維護**：一律 TDD，Red→Green→Refactor，測試即文件。
- **先找再做**：先看 `ARCHITECTURE.md`，再全庫搜尋與閱讀現有程式。

> 詳情與例外說明，請見各任務指南。
