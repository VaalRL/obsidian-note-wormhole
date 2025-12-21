import { WorkspaceLeaf, setIcon, WorkspaceItem, Menu, Notice } from "obsidian";
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
        const leafId = (leaf as any).id;
        const isSharing = this.plugin.wormholeManager.isSharing(leafId);

        // Access internal DOM element of the tab header
        // Method: Find the tab header item corresponding to this leaf
        // NOTE: This relies on Obsidian's DOM structure which is reasonably stable but not officially documented API.
        // We look for .workspace-tab-header[data-id="leafID"] ideally, but leaves don't always have IDs on headers.
        // Safer approach: Walk the workspace layout.

        // However, iterating all leaves allows us to check status.
        // To find the header, we can try a known DOM hack or specific API if available.
        // Obsidian 1.x+: leaf.tabHeaderEl (if accessible) or look up via parent container.

        // 'tabHeaderInnerIconEl' might be available on the leaf item if it's a tab.
        const leafItem = leaf as any;
        if (leafItem.tabHeaderInnerIconEl && leafItem.tabHeaderInnerEl) {
            // This modifies the file icon. We probably want a separate status icon next to it or replacing it?
            // Req F-08 says "Status Icon: Small dot or icon next to the file title."

            // Check if we already added our status dot
            let statusEl = leafItem.tabHeaderInnerEl.querySelector('.wormhole-status-icon');

            if (isSharing) {
                if (!statusEl) {
                    statusEl = createSpan({ cls: 'wormhole-status-icon' });
                    // Insert after the icon, before the title
                    const titleEl = leafItem.tabHeaderInnerTitleEl;
                    if (titleEl) {
                        titleEl.parentElement.insertBefore(statusEl, titleEl);
                    } else {
                        leafItem.tabHeaderInnerEl.appendChild(statusEl);
                    }
                }

                // Update state (Green dot)
                const viewerCount = this.plugin.wormholeManager.getViewerCount(leafId);
                statusEl.textContent = '🟢';
                const countText = viewerCount > 0 ? ` (${viewerCount} Viewers)` : '';
                statusEl.setAttribute('title', `Wormhole Active${countText} (Click for Menu)`);
                statusEl.style.fontSize = '0.6em';
                statusEl.style.marginRight = '4px';
                statusEl.style.cursor = 'pointer';

                // Click Listener for Context Menu (F-09)
                statusEl.onclick = (e: MouseEvent) => {
                    e.stopPropagation(); // Prevent tab switching
                    const menu = new Menu();

                    menu.addItem((item) =>
                        item
                            .setTitle("Status: Live 🟢")
                            .setDisabled(true)
                    );

                    menu.addSeparator();

                    menu.addItem((item) =>
                        item
                            .setTitle("Copy Link")
                            .setIcon("link")
                            .onClick(async () => {
                                const url = this.plugin.wormholeManager.getPublicUrl(leafId);
                                if (url) {
                                    await navigator.clipboard.writeText(url);
                                    new Notice("Link copied!");
                                }
                            })
                    );

                    const config = this.plugin.wormholeManager.getSessionConfig(leafId);
                    const isProtected = config ? config.preventSelection : false;

                    menu.addItem((item) =>
                        item
                            .setTitle(isProtected ? "Unlock Selection (Allow Copy)" : "Prevent Selection (Anti-Copy)")
                            .setIcon(isProtected ? "unlock" : "lock")
                            .onClick(() => {
                                this.plugin.wormholeManager.toggleAntiCopy(leafId);
                            })
                    );

                    menu.addSeparator();

                    menu.addItem((item) =>
                        item
                            .setTitle("Stop Sharing")
                            .setIcon("square")
                            .setWarning(true)
                            .onClick(() => {
                                this.plugin.wormholeManager.stopSharing(leafId);
                            })
                    );

                    menu.showAtMouseEvent(e);
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
