import { Component, MarkdownRenderer, App } from "obsidian";
import { ThemeMode } from "../settings/WormholeSettings";

/**
 * HtmlRendererService
 *
 * Responsible for rendering Markdown content into a self-contained HTML string.
 * This service operates purely in memory (S-02: no temp files on disk).
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
     * @param themeMode Which colour scheme the visitor should see
     */
    async render(
        markdownContent: string,
        isAntiCopy: boolean,
        themeMode: ThemeMode = 'auto'
    ): Promise<string> {
        // 1. Render Markdown to a detached HTML element
        const renderContainer = createDiv({ cls: "markdown-rendered" });

        await MarkdownRenderer.render(
            this.app,
            markdownContent,
            renderContainer,
            "/",
            this.component
        );

        // 2. Build the full HTML document.
        // renderContainer.innerHTML is read (not written), and the markup it
        // returns is produced by Obsidian's own sanitising renderer.
        const body = renderContainer.innerHTML;
        const style = this.generateStyle(isAntiCopy, themeMode);

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <meta name="referrer" content="no-referrer">
    <title>Shared note</title>
    <style>
${style}
    </style>
</head>
<body class="${isAntiCopy ? 'wormhole-protected' : ''}">
    <div class="markdown-rendered">
${body}
    </div>
${isAntiCopy ? this.antiCopyScript() : ''}
${this.heartbeatScript()}
</body>
</html>`;
    }

    /**
     * Minimal CSS to mimic a clean reading view, with the colour scheme the
     * user picked in settings (F-04.1 / themeMode).
     */
    private generateStyle(isAntiCopy: boolean, themeMode: ThemeMode): string {
        const light = `
            --wh-background: #ffffff;
            --wh-text: #2e3338;
            --wh-muted: #6a6f76;
            --wh-border: #dcdde0;
            --wh-code-background: #f4f4f4;`;

        const dark = `
            --wh-background: #1e1e1e;
            --wh-text: #dadada;
            --wh-muted: #9a9a9a;
            --wh-border: #3f3f3f;
            --wh-code-background: #2a2a2a;`;

        let palette: string;
        if (themeMode === 'light') {
            palette = `        :root {${light}\n        }`;
        } else if (themeMode === 'dark') {
            palette = `        :root {${dark}\n        }`;
        } else {
            // Auto: follow the visitor's own system preference.
            palette = `        :root {${light}\n        }

        @media (prefers-color-scheme: dark) {
            :root {${dark}
            }
        }`;
        }

        let css = `${palette}

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
            background-color: var(--wh-background);
            color: var(--wh-text);
            line-height: 1.6;
        }

        .markdown-rendered {
            max-width: 800px;
            margin: 0 auto;
        }

        img { max-width: 100%; border-radius: 4px; }

        blockquote {
            border-left: 2px solid var(--wh-border);
            margin-left: 0;
            padding-left: 1em;
            color: var(--wh-muted);
        }

        code {
            background: var(--wh-code-background);
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }

        pre code { display: block; padding: 12px; overflow-x: auto; }

        table { border-collapse: collapse; }
        th, td { border: 1px solid var(--wh-border); padding: 6px 10px; }`;

        if (isAntiCopy) {
            css += `

        .wormhole-protected {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            cursor: default;
        }`;
        }

        return css;
    }

    /** S-01: discourage casual copying on the visitor's side. */
    private antiCopyScript(): string {
        return `    <script>
        document.addEventListener('contextmenu', event => event.preventDefault());
        document.addEventListener('keydown', event => {
            if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'p')) {
                event.preventDefault();
            }
        });
    </script>`;
    }

    /** F-10: lets the plugin show a live viewer count. */
    private heartbeatScript(): string {
        return `    <script>
        const sessionId = Math.random().toString(36).substring(2, 15);

        const heartbeat = () => {
            if (document.hidden) return;
            fetch('/_heartbeat?id=' + sessionId, { method: 'POST' }).catch(() => {});
        };

        setInterval(heartbeat, 3000);
        heartbeat();
    </script>`;
    }

    unload() {
        this.component.unload();
    }
}
