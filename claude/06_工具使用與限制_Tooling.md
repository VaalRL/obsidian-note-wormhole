# 06｜工具使用與限制（Tooling）

## 禁用與替代
- 禁用：`git -i`、`find`、`grep`、`cat`、`head`、`tail`、`ls`
- 請改用：**Read / LS / Grep / Glob** 專用工具

## Gemini CLI（僅查詢/分析）
- 用法：`gemini -p "指令"`
- 長處：大上下文、程式碼查找、全貌理解、上網搜尋
- 限制：**禁止**用來修改/刪除檔案；僅分析/查詢
- 範例：`gemini -p "請查找 backend/src/routes 中與 workspace 相關的 API 並解釋功能"`

## 其他注意
- **learning/** 目錄為個人學習，不作為專案依據，請忽略


## Shell Tools Usage Guidelines
⚠️ **IMPORTANT**: Use the following specialized tools instead of traditional Unix commands: (Install if missing)
| Task Type | Must Use | Do Not Use |
|-----------|----------|------------|
| Find Files | `fd` | `find`, `ls -R` |
| Search Text | `rg` (ripgrep) | `grep`, `ag` |
| Analyze Code Structure | `ast-grep` | `grep`, `sed` |
| Interactive Selection | `fzf` | Manual filtering |
| Process JSON | `jq` | `python -m json.tool` |
| Process YAML/XML | `yq` | Manual parsing |