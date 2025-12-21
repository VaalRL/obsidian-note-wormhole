import { Component, MarkdownRenderer, App } from "obsidian";

/**
 * HtmlRendererService
 * 
 * Responsible for rendering Markdown content into a self-contained HTML string.
 * This service operates purely in memory.
 */
export class HtmlRendererService {
    private app: App;
    private component: Component;

    constructor(app: App) {
        this.app = app;
        this.component = new Component(); // Managed component for renderer
        this.component.load();
    }

    /**
     * Renders Markdown to a complete HTML document string.
     * @param markdownContent The raw markdown content
     * @param isAntiCopy Whether to inject specific anti-copy CSS
     */
    async render(markdownContent: string, isAntiCopy: boolean): Promise<string> {
        // 1. Render Markdown to an HTML Element
        const renderContainer = document.createElement("div");
        renderContainer.addClass("markdown-rendered");

        await MarkdownRenderer.render(
            this.app,
            markdownContent,
            renderContainer,
            "/",
            this.component
        );

        // 2. Build the full HTML document
        // We inject minimal CSS to make it look decent and handle anti-copy
        const style = this.generateStyle(isAntiCopy);

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Shared Note</title>
    <style>
        ${style}
    </style>
</head>
<body class="${isAntiCopy ? 'wormhole-protected' : ''}">
    <div class="app-container">
        <div class="view-content">
            <div class="markdown-reading-view">
                <div class="markdown-preview-view">
                     <div class="markdown-rendered">
                        ${renderContainer.innerHTML}
                    </div>
                </div>
            </div>
        </div>
    </div>
            <!-- Anti-Selection Script (If Enabled) -->
            ${isAntiCopy ? `
            <script>
                document.addEventListener('contextmenu', event => event.preventDefault());
                document.addEventListener('keydown', event => {
                    if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'p')) {
                        event.preventDefault();
                    }
                });
            </script>
            ` : ''}

            <!-- Heartbeat Script (F-10) -->
            <script>
                // Generate a random session ID for this tab session
                const sessionId = Math.random().toString(36).substring(2, 15);
                
                const heartbeat = () => {
                    if (document.hidden) return; // Optional logic
                    fetch('/_heartbeat?id=' + sessionId, { method: 'POST' }).catch(() => {});
                };
                
                setInterval(heartbeat, 3000);
                heartbeat();
            </script>
</body>
</html>`;
    }

    /**
     * Minimal CSS to mimic a clean reading view.
     * In a real implementation, we might inline some Obsidian variables.
     */
    private generateStyle(isAntiCopy: boolean): string {
        let css = `
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 40px;
                background-color: var(--background-primary, #ffffff);
                color: var(--text-normal, #2e3338);
                line-height: 1.6;
            }
            .markdown-rendered {
                max-width: 800px;
                margin: 0 auto;
            }
            img { max-width: 100%; border-radius: 4px; }
            blockquote { border-left: 2px solid #ddd; margin-left: 0; padding-left: 1em; color: #666; }
            code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
        `;

        if (isAntiCopy) {
            css += `
                .wormhole-protected {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    cursor: default;
                }
            `;
        }

        return css;
    }

    unload() {
        this.component.unload();
    }
}
