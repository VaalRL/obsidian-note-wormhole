# CLAUDE.md (Project: Note Wormhole)

> **Context**: You are working on "Note Wormhole", an Obsidian plugin that allows users to instantly share notes via a temporary, secure Cloudflare Tunnel.
> **Core Value**: Physical Control, Privacy First, Reader Centric.

## Key Documents (Source of Truth)
- **Product Requirements**: [req.md](./req.md) (Read this to understand features and logic)
- **Coding Standards**: [OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md](./OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md) (STRICTLY FOLLOW THESE RULES)
- **Architecture**: `src/` (See `claude/05_檔案與目錄規範_Repo_Structure.md`)

## Quick Router (What are you doing?)

- **Starting a new task?**
    - → Read [req.md](./req.md) to understand the goal.
    - → Read [01_Preflight-Checklist](./claude/01_前置檢查清單_Preflight-Checklist.md).
    - → Read [03_SearchFirst_Architecture](./claude/03_搜尋優先與架構定位_SearchFirst_Architecture.md) to locate code.

- **Writing or Modifying Code?**
    - → **MUST** read [OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md](./OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md) first.
    - → Follow TDD: Read [04_CodeQuality_TDD](./claude/04_程式品質與測試_TDD.md).
    - → Follow Structure: Read [05_Repo_Structure](./claude/05_檔案與目錄規範_Repo_Structure.md).

- **Handling specific logic?**
    - **Tunneling/Server**: Check `req.md` Section 2 & 5.2.
    - **Security/Anti-Copy**: Check `req.md` Section 3.2 & 5.1.

- **Debugging or fixing issues?**
    - → Read [08_Emergency](./claude/08_緊急處置_Emergency.md).

## Critical Rules for This Project
1.  **Obsidian API Only**: Do NOT use `fs`, `path`, or `os` modules unless strictly necessary and handled for mobile compatibility (though this plugin seems desktop centric, follow rules). Use `app.vault` and `app.fileManager`.
2.  **No External Servers**: Logic must run locally. Tunneling is via `untun`.
3.  **Clean Up**: Always ensure the tunnel and server are killed when the plugin unloads (See **F-05** in `req.md` and Rule 5.2 in `OBSIDIAN_PLUGIN_DEVELOPMENT_RULES.md`).

## Index
1. [01_Preflight-Checklist](./claude/01_前置檢查清單_Preflight-Checklist.md)
2. [02_Task_Agents](./claude/02_任務執行_TodoWrite_與_TaskAgents.md)
3. [03_Architecture](./claude/03_搜尋優先與架構定位_SearchFirst_Architecture.md)
4. [04_TDD](./claude/04_程式品質與測試_TDD.md)
5. [05_Repo_Structure](./claude/05_檔案與目錄規範_Repo_Structure.md)
6. [06_Tooling](./claude/06_工具使用與限制_Tooling.md)
7. [07_Reviews](./claude/07_多代理人協作與審查_Reviews.md)
8. [08_Emergency](./claude/08_緊急處置_Emergency.md)
9. [09_BestPractices](./claude/09_最佳實務_BestPractices.md)
