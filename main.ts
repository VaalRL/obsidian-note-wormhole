import { Plugin, MarkdownView, Notice } from 'obsidian';
import { WormholeSettingTab } from './src/settings/WormholeSettingTab';
import { WormholeSettings, DEFAULT_SETTINGS } from './src/settings/WormholeSettings';
import { WormholeManager } from './src/services/WormholeManager';
import { WormholeLauncherModal } from './src/ui/WormholeLauncherModal';
import { WelcomeModal } from './src/ui/WelcomeModal';
import { TabHeaderDecorator } from './src/ui/TabHeaderDecorator';
import './src/types';

export default class NoteWormholePlugin extends Plugin {
    settings: WormholeSettings = null!;
    wormholeManager: WormholeManager = null!;
    tabDecorator: TabHeaderDecorator = null!;
    statusBarItem: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();

        // Check for First Run
        if (!this.settings.hasSeenWelcome) {
            new WelcomeModal(this.app).open();
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
        this.addRibbonIcon('radio-tower', 'Wormhole Launcher', () => {
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
            name: 'Start Wormhole for current note',
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    if (!checking) {
                        const content = activeView.getViewData();
                        const filePath = activeView.file?.path || 'Untitled';
                        const leafId = activeView.leaf.id;
                        void this.wormholeManager.startSharing(leafId, content, filePath);
                    }
                    return true;
                }
                return false;
            }
        });

        // Command: Stop Wormhole
        this.addCommand({
            id: 'stop-wormhole',
            name: 'Stop current Wormhole',
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    const leafId = activeView.leaf.id;
                    const isSharing = this.wormholeManager.isSharing(leafId);

                    if (!checking && isSharing) {
                        void this.wormholeManager.stopSharing(leafId);
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
            new Notice('Open a note tab to toggle Wormhole.');
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
            this.statusBarItem.setText('Wormhole Active');
            this.statusBarItem.removeClass('wormhole-status-empty');
            this.statusBarItem.addClass('wormhole-status-active');
            this.statusBarItem.title = activeSessionCount > 1
                ? `Click to stop sharing this note (${activeSessionCount} total active)`
                : 'Click to stop sharing this note';
            return;
        }

        if (activeSessionCount > 0) {
            this.statusBarItem.setText(`Wormhole Ready | ${activeSessionCount} Active`);
            this.statusBarItem.removeClass('wormhole-status-active');
            this.statusBarItem.addClass('wormhole-status-empty');
            this.statusBarItem.title = activeView
                ? 'Click to share this note'
                : `${activeSessionCount} shared note${activeSessionCount === 1 ? '' : 's'} active`;
            return;
        }

        this.statusBarItem.setText('Wormhole Ready');
        this.statusBarItem.removeClass('wormhole-status-active');
        this.statusBarItem.addClass('wormhole-status-empty');
        this.statusBarItem.title = activeView
            ? 'Click to share this note'
            : 'Open a note to share it';
    }
}
