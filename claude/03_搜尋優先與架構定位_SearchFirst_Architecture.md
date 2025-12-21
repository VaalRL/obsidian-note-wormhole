# 03｜搜尋優先與架構定位（Search First & Architecture）

## 核心原則

在寫下一行程式碼之前，你必須先知道「東西在哪裡」以及「該放在哪裡」。

## 專案關鍵路徑

1.  **功能需求**：`req.md` (Product Requirements Document)
2.  **開發規範**：`OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md` (一定要看！)
3.  **程式碼入口**：`main.ts` (Obsidian Plugin Entry Point)
4.  **樣式檔案**：`styles.css`
5.  **核心邏輯**：`src/` 目錄

## 如何定位程式碼？

1.  **全局搜尋（Search）**：
    *   先用關鍵字搜尋現有檔案。
    *   例如：要實作「複製連結」，先搜 "copy", "clipboard", "url"。
    *   例如：要修改「設定」，先搜 "Setting", "PluginSettingTab"。

2.  **追蹤入口（Trace）**：
    *   從 `main.ts` 的 `onload()` 開始追蹤指令（Command）或 Ribbon Icon 的註冊。
    *   從 `main.ts` 的 `loadSettings()` 追蹤設定相關邏輯。

3.  **閱讀 PRD 邏輯**：
    *   對照 `req.md` 的 Sequence Diagram 理解資料流。
    *   Plugin -> Local Server -> Tunnel -> URL。

## 常見開發誤區

*   **不要假設**：不要假設某個功能不存在，先搜再說。
*   **不要硬幹**：不要自己寫一套全新的 UI 元件，先看有沒有現成的 Obsidian UI 或是專案內已有的元件。
*   **遵守 API**：所有對 Obsidian 的操作必須透過 API (e.g., `this.app.workspace`, `this.app.vault`)，嚴禁繞過 API 直接操作 DOM 或 FS（除非有極強烈的理由且符合規範）。
