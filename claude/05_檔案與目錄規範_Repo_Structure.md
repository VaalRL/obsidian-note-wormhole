# 05｜檔案與目錄規範（Repo Structure）

## Obsidian Plugin 標準結構

本專案嚴格遵守 `OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md` 的結構規範。

```
plugin-root/
├── main.ts          # Plugin Entry Point (onload, onunload)
├── manifest.json    # Metadata (ID, version, name)
├── styles.css       # CSS Variables & Styles
├── esbuild.config.mjs # Build script
├── package.json     # Dependencies
├── tsconfig.json    # TS Config
├── req.md           # Product Requirements (SOURCE OF TRUTH)
├── OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md # Dev Rules
└── src/             # 原始碼目錄 (所有邏輯放這裡)
    ├── settings/    # Settings Tab & UI
    ├── ui/          # Custom Views, Modals
    ├── services/    # Business Logic (Server, Tunnel, etc.)
    ├── utils/       # Helper functions
    └── types/       # TS Interfaces
```

## 強制規範

1.  **Root 淨空**：
    *   除了 `main.ts`, `manifest.json`, `styles.css` 和必要設定檔外，**不要**在根目錄新增 `.ts` 檔案。
    *   所有新功能模組必須在 `src/` 下。

2.  **模組化 (src/)**：
    *   **settings/**: 處理 `PluginSettingTab`。
    *   **services/**: 處理核心邏輯，例如 `TunnelService.ts`, `ServerService.ts`。
    *   **ui/**: 處理 UI 顯示，例如 `WormholeStatusModal.ts`。

3.  **命名慣例**：
    *   檔案名：小寫 kebab-case (e.g., `tunnel-service.ts`) 或 CamelCase (e.g., `TunnelService.ts`)，請保持專案一致性（目前偏好依循現有檔案或 `camelCase`）。
    *   類別名：`PascalCase` (e.g., `TunnelService`)。
    *   變數/函式：`camelCase` (e.g., `startTunnel`)。

4.  **輸出目錄**：
    *   建置產物通常在 `main.js`, `manifest.json`, `styles.css` (原地) 或指定 `dist/`，請參考 `esbuild.config.mjs` 設定。不要手動修改編譯後的檔案。
