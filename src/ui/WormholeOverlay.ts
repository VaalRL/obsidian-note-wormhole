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

    // Built once in the constructor; refresh() only patches these.
    private countEl!: HTMLElement;
    private lockBtn!: HTMLElement;

    // Last values pushed to the DOM, so a tick that changes nothing touches nothing.
    private shownCount = -1;
    private shownProtected: boolean | null = null;

    constructor(plugin: NoteWormholePlugin, view: MarkdownView, leafId: string) {
        this.plugin = plugin;
        this.leafId = leafId;

        // view.contentEl is the stable container for the note body, so the panel
        // floats over the content regardless of source/reading mode.
        this.containerEl = view.contentEl.createDiv({ cls: "wormhole-overlay" });
        this.build(this.containerEl);
        this.refresh();
    }

    /**
     * Pushes the live state onto the existing nodes.
     *
     * This runs on a 3s timer, so it deliberately does not rebuild the panel:
     * replacing the buttons every tick would drop keyboard focus mid-interaction
     * and re-create an SVG icon for no reason.
     */
    refresh() {
        if (!this.containerEl) return;

        const viewerCount = this.plugin.wormholeManager.getViewerCount(this.leafId);
        if (viewerCount !== this.shownCount) {
            this.shownCount = viewerCount;
            this.countEl.setText(
                viewerCount > 0
                    ? ` • ${viewerCount} viewer${viewerCount === 1 ? '' : 's'}`
                    : ''
            );
        }

        const config = this.plugin.wormholeManager.getSessionConfig(this.leafId);
        const isProtected = config ? config.preventSelection : false;
        if (isProtected !== this.shownProtected) {
            this.shownProtected = isProtected;
            const label = isProtected ? "Unlock selection" : "Prevent selection";
            setIcon(this.lockBtn, isProtected ? "lock" : "unlock");
            this.lockBtn.toggleClass("is-active", isProtected);
            this.lockBtn.setAttr("aria-label", label);
            setTooltip(this.lockBtn, label);
        }
    }

    private build(container: HTMLElement) {
        // Row 1: Status
        const statusRow = container.createDiv({ cls: "wormhole-overlay-header" });
        statusRow.createSpan({ text: "🟢 Live" });
        this.countEl = statusRow.createSpan({ cls: "wormhole-overlay-count" });

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

        // Icon and label are set by the first refresh().
        this.lockBtn = this.createButton(controlsRow, "unlock", "Prevent selection");
        this.lockBtn.onclick = () => {
            void this.plugin.wormholeManager.toggleAntiCopy(this.leafId).catch((error) => {
                console.error('[Wormhole] Failed to toggle protection', error);
            });
            // toggleAntiCopy flips the session config before it awaits, so the
            // button can reflect the new state immediately.
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
