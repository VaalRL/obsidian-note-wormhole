import { WorkspaceLeaf, Menu, Notice, setTooltip } from "obsidian";
import NoteWormholePlugin from "../../main";

/**
 * TabHeaderDecorator
 * 
 * Manages the visual status indicators in the tab headers.
 * F-08: Status Icon 🔴/🟢
 */
export class TabHeaderDecorator {
    private plugin: NoteWormholePlugin;

    constructor(plugin: NoteWormholePlugin) {
        this.plugin = plugin;
    }

    /**
     * Refreshes the status icon for all active leaves.
     */
    refreshAll() {
        this.plugin.app.workspace.iterateAllLeaves((leaf) => {
            this.decorateLeaf(leaf);
        });
    }

    /**
     * Updates the decoration for a specific leaf.
     */
    decorateLeaf(leaf: WorkspaceLeaf) {
        const leafId = leaf.id;
        const isSharing = this.plugin.wormholeManager.isSharing(leafId);

        // Uses undocumented Obsidian internal tab header DOM properties (see src/types/index.ts).
        if (leaf.tabHeaderInnerIconEl && leaf.tabHeaderInnerEl) {
            // Check if we already added our status dot
            let statusEl = leaf.tabHeaderInnerEl.querySelector<HTMLElement>('.wormhole-status-icon');

            if (isSharing) {
                if (!statusEl) {
                    statusEl = createSpan({ cls: 'wormhole-status-icon' });
                    statusEl.setAttribute('role', 'button');
                    statusEl.setAttribute('tabindex', '0');
                    // Insert after the icon, before the title
                    const titleEl = leaf.tabHeaderInnerTitleEl;
                    if (titleEl && titleEl.parentElement) {
                        titleEl.parentElement.insertBefore(statusEl, titleEl);
                    } else {
                        leaf.tabHeaderInnerEl.appendChild(statusEl);
                    }
                }

                // Update state (Green dot)
                const viewerCount = this.plugin.wormholeManager.getViewerCount(leafId);
                statusEl.textContent = '🟢';
                const countText = viewerCount > 0
                    ? ` (${viewerCount} viewer${viewerCount === 1 ? '' : 's'})`
                    : '';
                const label = `Wormhole active${countText} — click for options`;
                statusEl.setAttribute('aria-label', label);
                setTooltip(statusEl, label);

                // Context menu (F-09), reachable by both mouse and keyboard.
                const anchorEl = statusEl;
                const buildMenu = (): Menu => {
                    const menu = new Menu();

                    menu.addItem((item) =>
                        item
                            .setTitle("Status: live 🟢")
                            .setDisabled(true)
                    );

                    menu.addSeparator();

                    menu.addItem((item) =>
                        item
                            .setTitle("Copy link")
                            .setIcon("link")
                            .onClick(() => {
                                void (async () => {
                                    const url = this.plugin.wormholeManager.getPublicUrl(leafId);
                                    if (url) {
                                        await navigator.clipboard.writeText(url);
                                        new Notice("Link copied!");
                                    }
                                })();
                            })
                    );

                    const config = this.plugin.wormholeManager.getSessionConfig(leafId);
                    const isProtected = config ? config.preventSelection : false;

                    menu.addItem((item) =>
                        item
                            .setTitle(isProtected ? "Unlock selection (allow copy)" : "Prevent selection (anti-copy)")
                            .setIcon(isProtected ? "unlock" : "lock")
                            .onClick(() => {
                                void this.plugin.wormholeManager.toggleAntiCopy(leafId)
                                    .catch((error) => {
                                        console.error('[Wormhole] Failed to toggle protection', error);
                                    });
                            })
                    );

                    menu.addSeparator();

                    menu.addItem((item) =>
                        item
                            .setTitle("Stop sharing")
                            .setIcon("square")
                            .setWarning(true)
                            .onClick(() => {
                                void this.plugin.wormholeManager.stopSharing(leafId)
                                    .catch((error) => {
                                        console.error('[Wormhole] Failed to stop sharing', error);
                                    });
                            })
                    );

                    return menu;
                };

                statusEl.onclick = (e: MouseEvent) => {
                    e.stopPropagation(); // Prevent tab switching
                    buildMenu().showAtMouseEvent(e);
                };

                statusEl.onkeydown = (e: KeyboardEvent) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = anchorEl.getBoundingClientRect();
                    buildMenu().showAtPosition({ x: rect.left, y: rect.bottom });
                };
            } else {
                // Remove if exists
                if (statusEl) {
                    statusEl.remove();
                }
            }
        }
    }
}
