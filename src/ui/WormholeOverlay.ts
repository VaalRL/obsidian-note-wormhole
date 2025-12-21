import { MarkdownView, setIcon, Notice } from "obsidian";
import NoteWormholePlugin from "../../main";

/**
 * WormholeOverlay
 * 
 * A floating control panel injected into the MarkdownView of a shared note.
 * F-11: Floating Control Panel
 */
export class WormholeOverlay {
    private plugin: NoteWormholePlugin;
    private view: MarkdownView;
    private containerEl: HTMLElement;
    private leafId: string;

    constructor(plugin: NoteWormholePlugin, view: MarkdownView, leafId: string) {
        this.plugin = plugin;
        this.view = view;
        this.leafId = leafId;

        // Find the content container to inject into. 
        // We want it floating over the content, usually .markdown-source-view or .markdown-preview-view container.
        // A safe place is view.contentEl
        this.containerEl = this.createOverlay();
        view.contentEl.appendChild(this.containerEl);
    }

    private createOverlay(): HTMLElement {
        const overlay = document.createElement("div");
        overlay.addClass("wormhole-overlay");

        this.renderContent(overlay);

        return overlay;
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
            statusRow.createSpan({ text: ` • ${viewerCount} Viewer${viewerCount > 1 ? 's' : ''}`, cls: "wormhole-overlay-count" });
        }

        // Row 2: Controls
        const controlsRow = container.createDiv({ cls: "wormhole-overlay-controls" });

        // Copy Link
        const btnCopy = controlsRow.createEl("button", { cls: "clickable-icon wormhole-btn", attr: { "aria-label": "Copy Link" } });
        setIcon(btnCopy, "link");
        btnCopy.onclick = async () => {
            const url = this.plugin.wormholeManager.getPublicUrl(this.leafId);
            if (url) {
                await navigator.clipboard.writeText(url);
                new Notice("Link copied to clipboard!");
            }
        };

        // Toggle Lock
        const btnLock = controlsRow.createEl("button", {
            cls: `clickable-icon wormhole-btn ${isProtected ? "is-active" : ""}`,
            attr: { "aria-label": isProtected ? "Unlock Selection" : "Prevent Selection" }
        });
        setIcon(btnLock, isProtected ? "lock" : "unlock");
        btnLock.onclick = () => {
            this.plugin.wormholeManager.toggleAntiCopy(this.leafId);
            // Refresh will happen via Manager calling back, or we can force it here for responsiveness?
            // Manager calls refreshAll -> we need a way to hook into that.
            // For now, Manager updates TabHeader, but maybe not this Overlay explicitly yet.
            // We should make Manager trigger overlay updates too.
            this.refresh();
        };

        // Stop
        const btnStop = controlsRow.createEl("button", { cls: "clickable-icon wormhole-btn is-danger", attr: { "aria-label": "Stop Sharing" } });
        setIcon(btnStop, "square");
        btnStop.onclick = () => {
            this.plugin.wormholeManager.stopSharing(this.leafId);
        };
    }

    destroy() {
        if (this.containerEl) {
            this.containerEl.remove();
        }
    }
}
