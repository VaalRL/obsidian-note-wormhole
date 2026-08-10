import { MarkdownView, setIcon, setTooltip, Notice } from "obsidian";
import NoteWormholePlugin from "../../main";

/**
 * WormholeOverlay
 *
 * A floating control panel injected into the MarkdownView of a shared note.
 * F-11: Floating Control Panel
 */
export class WormholeOverlay {
    private plugin: NoteWormholePlugin;
    private containerEl: HTMLElement;
    private leafId: string;

    constructor(plugin: NoteWormholePlugin, view: MarkdownView, leafId: string) {
        this.plugin = plugin;
        this.leafId = leafId;

        // view.contentEl is the stable container for the note body, so the panel
        // floats over the content regardless of source/reading mode.
        this.containerEl = view.contentEl.createDiv({ cls: "wormhole-overlay" });
        this.renderContent(this.containerEl);
    }

    refresh() {
        if (!this.containerEl) return;
        this.containerEl.empty();
        this.renderContent(this.containerEl);
    }

    private renderContent(container: HTMLElement) {
        const config = this.plugin.wormholeManager.getSessionConfig(this.leafId);
        const viewerCount = this.plugin.wormholeManager.getViewerCount(this.leafId);
        const isProtected = config ? config.preventSelection : false;

        // Row 1: Status
        const statusRow = container.createDiv({ cls: "wormhole-overlay-header" });
        statusRow.createSpan({ text: "🟢 Live" });
        if (viewerCount > 0) {
            statusRow.createSpan({
                text: ` • ${viewerCount} viewer${viewerCount === 1 ? '' : 's'}`,
                cls: "wormhole-overlay-count"
            });
        }

        // Row 2: Controls
        const controlsRow = container.createDiv({ cls: "wormhole-overlay-controls" });

        const btnCopy = this.createButton(controlsRow, "link", "Copy link");
        btnCopy.onclick = () => {
            void (async () => {
                const url = this.plugin.wormholeManager.getPublicUrl(this.leafId);
                if (url) {
                    await navigator.clipboard.writeText(url);
                    new Notice("Link copied to clipboard.");
                }
            })();
        };

        const lockLabel = isProtected ? "Unlock selection" : "Prevent selection";
        const btnLock = this.createButton(controlsRow, isProtected ? "lock" : "unlock", lockLabel);
        if (isProtected) btnLock.addClass("is-active");
        btnLock.onclick = () => {
            void this.plugin.wormholeManager.toggleAntiCopy(this.leafId).catch((error) => {
                console.error('[Wormhole] Failed to toggle protection', error);
            });
            this.refresh();
        };

        const btnStop = this.createButton(controlsRow, "square", "Stop sharing");
        btnStop.addClass("is-danger");
        btnStop.onclick = () => {
            void this.plugin.wormholeManager.stopSharing(this.leafId).catch((error) => {
                console.error('[Wormhole] Failed to stop sharing', error);
            });
        };
    }

    private createButton(parent: HTMLElement, icon: string, label: string): HTMLElement {
        const button = parent.createEl("button", {
            cls: "clickable-icon wormhole-btn",
            attr: { "aria-label": label, type: "button" }
        });
        setIcon(button, icon);
        setTooltip(button, label);
        return button;
    }

    destroy() {
        this.containerEl?.remove();
    }
}
