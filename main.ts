import { Plugin, MarkdownView, Notice, setTooltip } from 'obsidian';
import { WormholeSettingTab } from './src/settings/WormholeSettingTab';
import { WormholeSettings, DEFAULT_SETTINGS } from './src/settings/WormholeSettings';
import { WormholeManager } from './src/services/WormholeManager';
import { WormholeLauncherModal } from './src/ui/WormholeLauncherModal';
import { WelcomeModal } from './src/ui/WelcomeModal';
import { TabHeaderDecorator } from './src/ui/TabHeaderDecorator';
import './src/types';

export default class NoteWormholePlugin extends Plugin {
    // Assigned in onload(), before any consumer can reach them.
    settings!: WormholeSettings;
    wormholeManager!: WormholeManager;
    tabDecorator!: TabHeaderDecorator;
    statusBarItem: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();

        // First run: show the welcome modal once the workspace is ready, so we
        // never block or interrupt plugin startup.
        if (!this.settings.hasSeenWelcome) {
            this.app.workspace.onLayoutReady(() => {
                new WelcomeModal(this.app).open();
            });
            this.settings.hasSeenWelcome = true;
            await this.saveSettings();
        }

        // 1. Initialize Services
        this.wormholeManager = new WormholeManager(this.app, this);
        this.tabDecorator = new TabHeaderDecorator(this);

        // 2. Initialize Status Bar
        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.onClickEvent(() => {
            void this.toggleActiveWormholeFromStatusBar().catch((error) => {
                console.error('Failed to toggle wormhole from status bar', error);
            });
        });
        this.updateStatusBar();

        // 3. Register Settings Tab
        this.addSettingTab(new WormholeSettingTab(this.app, this));

        // Periodic Refresh for Viewer Counts (every 3 seconds)
        this.registerInterval(window.setInterval(() => {
            this.tabDecorator.refreshAll();
            this.wormholeManager.refreshOverlays();
        }, 3000));

        // Ribbon Icon
        this.addRibbonIcon('radio-tower', 'Open wormhole launcher', () => {
            new WormholeLauncherModal(this.app, this.wormholeManager).open();
        });

        // Register Decorator Updates & Status Bar Updates
        this.registerEvent(this.app.workspace.on('layout-change', () => {
            this.tabDecorator.refreshAll();
            this.updateStatusBar();
        }));
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
            this.updateStatusBar();
        }));

        // Command: Start Wormhole for Active File
        this.addCommand({
            id: 'start-wormhole-current',
            name: 'Start wormhole for current note',
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    if (!checking) {
                        const content = activeView.getViewData();
                        const filePath = activeView.file?.path || 'Untitled';
                        const leafId = activeView.leaf.id;
                        void this.wormholeManager.startSharing(leafId, content, filePath)
                            .catch((error) => {
                                console.error('[Wormhole] Failed to start sharing', error);
                            });
                    }
                    return true;
                }
                return false;
            }
        });

        // Command: Stop Wormhole
        this.addCommand({
            id: 'stop-wormhole',
            name: 'Stop current wormhole',
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    const leafId = activeView.leaf.id;
                    const isSharing = this.wormholeManager.isSharing(leafId);

                    if (!checking && isSharing) {
                        void this.wormholeManager.stopSharing(leafId).catch((error) => {
                            console.error('[Wormhole] Failed to stop sharing', error);
                        });
                    }
                    return isSharing;
                }
                return false;
            }
        });
    }

    onunload() {
        this.wormholeManager?.unload();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async toggleActiveWormholeFromStatusBar() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('Open a note tab to toggle the wormhole.');
            return;
        }

        const leafId = activeView.leaf.id;
        if (this.wormholeManager.isSharing(leafId)) {
            await this.wormholeManager.stopSharing(leafId);
            return;
        }

        const content = activeView.getViewData();
        const filePath = activeView.file?.path || 'Untitled';
        await this.wormholeManager.startSharing(leafId, content, filePath);
    }

    updateStatusBar() {
        if (!this.statusBarItem) return;

        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        const activeLeafId = activeView?.leaf.id;
        const activeSessionCount = this.wormholeManager.getActiveSessionCount();
        const isActiveLeafSharing = activeLeafId
            ? this.wormholeManager.isSharing(activeLeafId)
            : false;

        if (isActiveLeafSharing) {
            this.statusBarItem.setText('Wormhole active');
            this.statusBarItem.removeClass('wormhole-status-empty');
            this.statusBarItem.addClass('wormhole-status-active');
            setTooltip(this.statusBarItem, activeSessionCount > 1
                ? `Click to stop sharing this note (${activeSessionCount} total active)`
                : 'Click to stop sharing this note');
            return;
        }

        if (activeSessionCount > 0) {
            this.statusBarItem.setText(`Wormhole ready | ${activeSessionCount} active`);
            this.statusBarItem.removeClass('wormhole-status-active');
            this.statusBarItem.addClass('wormhole-status-empty');
            setTooltip(this.statusBarItem, activeView
                ? 'Click to share this note'
                : `${activeSessionCount} shared note${activeSessionCount === 1 ? '' : 's'} active`);
            return;
        }

        this.statusBarItem.setText('Wormhole ready');
        this.statusBarItem.removeClass('wormhole-status-active');
        this.statusBarItem.addClass('wormhole-status-empty');
        setTooltip(this.statusBarItem, activeView
            ? 'Click to share this note'
            : 'Open a note to share it');
    }
}
