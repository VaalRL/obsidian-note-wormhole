# 03｜搜尋優先與架構定位（Search-First & Architecture-First）

## 原則
- **先 Architecture**：先讀 `ARCHITECTURE.md` 決定正確模組與延伸點。
- **先搜尋**：用 Grep/Glob（專用工具）找既有實作與相似邏輯。
- **延伸，不複製**：不要產生 `*_v2`, `enhanced_*`, `*_new` 類別或平行檔案。

## 禁止事項
- 重複檔案／重複邏輯（造成多個 SSOT）
- 硬寫常數（應改用設定檔/環境變數）

## 整併策略（Consolidate Early）
- 發現相似功能儘早抽取共用模組
- 主動償還技術債，保持結構乾淨

## 推薦流程
1. Architecture → 2. 搜尋 → 3. 閱讀 → 4. 設計延伸方案 → 5. 實作＋測試 → 6. 整併與文件
