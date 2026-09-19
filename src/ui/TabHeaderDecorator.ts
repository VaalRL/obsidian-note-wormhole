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
     * Strips every indicator this decorator injected.
     *
     * Obsidian owns the tab header DOM, so it does not clean this up for us on
     * unload the way it does for a ribbon icon or a status bar item. Without
     * this, disabling the plugin while a wormhole is open leaves a dead green
     * dot in the tab until Obsidian happens to rebuild that header.
     */
    removeAll() {
        // Queried from the document rather than per leaf: an indicator whose tab
        // has already been torn down still has to go, and this cannot be thrown
        // off by a change in the tab header's internal structure.
        this.plugin.app.workspace.containerEl
            .querySelectorAll('.wormhole-status-icon')
            .forEach((el) => el.remove());
    }

    /**
     * Updates the decoration for a specific leaf.
     */
    decorateLeaf(leaf: WorkspaceLeaf) {
        const leafId = leaf.id;
        const isSharing = this.plugin.wormholeManager.isSharing(leafId);

        const host = this.hostFor(leaf);
        if (!host) return;

        let statusEl = host.querySelector<HTMLElement>('.wormhole-status-icon');

        if (!isSharing) {
            statusEl?.remove();
            return;
        }

        if (!statusEl) {
            statusEl = createSpan({ cls: 'wormhole-status-icon', text: '🟢' });
            statusEl.setAttribute('role', 'button');
            statusEl.setAttribute('tabindex', '0');

            const titleEl = leaf.tabHeaderInnerTitleEl;
            if (titleEl && host === titleEl.parentElement) {
                // Fallback host is the whole inner row, so sit before the title
                // rather than after the close button.
                host.insertBefore(statusEl, titleEl);
            } else {
                host.appendChild(statusEl);
            }

            this.attachMenu(statusEl, leafId);
        }

        // Only the viewer count changes on a refresh, and this runs every
        // 3s, so leave the DOM alone when the label is already correct.
        const viewerCount = this.plugin.wormholeManager.getViewerCount(leafId);
        const countText = viewerCount > 0
            ? ` (${viewerCount} viewer${viewerCount === 1 ? '' : 's'})`
            : '';
        const label = `Wormhole active${countText} — click for options`;
        if (statusEl.getAttribute('aria-label') !== label) {
            statusEl.setAttribute('aria-label', label);
            setTooltip(statusEl, label);
        }
    }

    /**
     * Where the indicator gets mounted inside a tab header.
     *
     * Obsidian exposes a dedicated per-tab status area — the same place its own
     * pin and link indicators live — which is the right home for ours and keeps
     * the dot out of the title's layout.
     *
     * The previous implementation gated on `leaf.tabHeaderInnerEl`, which no
     * longer exists on current Obsidian, so the guard was never satisfied and
     * the indicator silently never rendered. These are undocumented internals
     * (see src/types/index.ts), so treat every one of them as possibly absent
     * and degrade rather than throw.
     */
    private hostFor(leaf: WorkspaceLeaf): HTMLElement | null {
        if (leaf.tabHeaderStatusContainerEl) return leaf.tabHeaderStatusContainerEl;
        return leaf.tabHeaderInnerTitleEl?.parentElement ?? null;
    }

    /**
     * Wires the context menu (F-09) onto a freshly created indicator, for both
     * mouse and keyboard. Attached once at creation: the handlers only close over
     * the leaf id, which never changes for a given element.
     */
    private attachMenu(statusEl: HTMLElement, leafId: string) {
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
                                new Notice("Link copied to clipboard.");
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
            const rect = statusEl.getBoundingClientRect();
            buildMenu().showAtPosition({ x: rect.left, y: rect.bottom });
        };
    }
}
