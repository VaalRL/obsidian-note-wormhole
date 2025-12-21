import { App, Notice, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { HtmlRendererService } from './HtmlRendererService';
import { LocalServerService } from './LocalServerService';
import { TunnelService } from './TunnelService';
import { WormholeOverlay } from '../ui/WormholeOverlay';
import NoteWormholePlugin from "../../main";

// Session-specific configuration
export interface SessionConfig {
    preventSelection: boolean;
}

export interface WormholeSession {
    leafId: string;
    filePath: string;
    publicUrl: string;
    localPort: number;
    server: LocalServerService;
    tunnel: TunnelService;
    createdTime: number;
    config: SessionConfig; // Store config per session
    overlay?: WormholeOverlay; // F-11 Overlay component
}

/**
 * WormholeManager
 * 
 * Manages multiple active wormhole sessions.
 * Enforces "One Wormhole Per Leaf" (F-07).
 * Handles lifecycle events (tab closure).
 */
export class WormholeManager {
    private app: App;
    private plugin: NoteWormholePlugin;
    private renderer: HtmlRendererService;

    // Map: Leaf ID -> Active Session
    private sessions: Map<string, WormholeSession> = new Map();

    constructor(app: App, plugin: NoteWormholePlugin) {
        this.app = app;
        this.plugin = plugin;
        this.renderer = new HtmlRendererService(app);

        // Register Lifecycle Listener
        this.registerLifecycleListeners();
    }

    /**
     * Starts sharing for a specific leaf.
     */
    async startSharing(leafId: string, markdownContent: string, filePath: string): Promise<string> {
        // Check if already active for this leaf
        if (this.sessions.has(leafId)) {
            const session = this.sessions.get(leafId)!;
            new Notice(`Wormhole already active for this tab!\n${session.publicUrl} `);
            // Copy to clipboard again for convenience
            await navigator.clipboard.writeText(session.publicUrl);
            return session.publicUrl;
        }

        const server = new LocalServerService();
        const tunnel = new TunnelService();

        try {
            const startupNotice = new Notice("Opening Wormhole... ⏳", 0); // Persist

            // If it takes > 2s, it's likely downloading
            const downloadTimer = setTimeout(() => {
                startupNotice.setMessage("Constructing Tunnel... (First run downloads components)");
            }, 2500);

            // Initial Config
            const config: SessionConfig = {
                preventSelection: this.plugin.settings.preventSelection
            };

            // 1. Render content
            const html = await this.renderer.render(
                markdownContent,
                config.preventSelection
            );

            // 2. Start Local Server
            const port = await server.start(html);

            // 3. Start Tunnel
            const url = await tunnel.start(port);

            // 4. Create Overlay (F-11)
            const leaf = this.app.workspace.getLeafById(leafId);
            let overlay: WormholeOverlay | undefined;
            if (leaf && leaf.view instanceof MarkdownView) {
                overlay = new WormholeOverlay(this.plugin, leaf.view, leafId);
            }

            const session: WormholeSession = {
                leafId,
                filePath,
                publicUrl: url,
                localPort: port,
                server,
                tunnel,
                createdTime: Date.now(),
                config,
                overlay
            };

            this.sessions.set(leafId, session);

            // Trigger UI Refresh
            this.plugin.tabDecorator.refreshAll();
            this.plugin.updateStatusBar();

            clearTimeout(downloadTimer);
            startupNotice.hide();
            new Notice(`Wormhole Active! 🌌\nLink copied to clipboard.`);
            console.log(`[Wormhole] Live at: ${url} (Leaf: ${leafId})`);

            await navigator.clipboard.writeText(url);

            return url;

        } catch (e) {
            console.error(e);
            new Notice("Failed to open Wormhole. Check console.");
            // Cleanup partial startup
            // @ts-ignore
            if (typeof downloadTimer !== 'undefined') clearTimeout(downloadTimer);
            // @ts-ignore
            if (typeof startupNotice !== 'undefined') startupNotice.hide();

            await tunnel.stop();
            server.stop();
            throw e;
        }
    }

    /**
     * Toggles the Anti-Copy protection for a LIVE session.
     */
    async toggleAntiCopy(leafId: string) {
        const session = this.sessions.get(leafId);
        if (!session) return;

        const newSetting = !session.config.preventSelection;
        session.config.preventSelection = newSetting;

        // Re-render
        // Need to fetch current content from view?
        // Or keep it simple: Just changing CSS doesn't need content re-read if we stored content?
        // But LocalServerService only stores final HTML.
        // We need to re-read Markdown.

        const leaf = this.app.workspace.getLeafById(leafId);
        if (leaf && leaf.view instanceof MarkdownView) {
            const content = leaf.view.getViewData();
            const newHtml = await this.renderer.render(content, newSetting);
            session.server.updateContent(newHtml);

            // Update Overlay
            session.overlay?.refresh();

            new Notice(`Secure Mode: ${newSetting ? 'ON 🔒' : 'OFF 🔓'} `);
        }
    }


    /**
     * Stops sharing for a specific leaf.
     */
    async stopSharing(leafId: string) {
        const session = this.sessions.get(leafId);
        if (!session) return;

        new Notice("Closing Wormhole... 🌑");

        await session.tunnel.stop();
        session.server.stop();

        // this.activeSession = null; // Removed in Phase 3 refactor
        // Destroy Overlay
        if (session.overlay) {
            session.overlay.destroy();
        }

        this.sessions.delete(leafId);

        // Trigger UI Refresh
        this.plugin.tabDecorator.refreshAll();
        this.plugin.updateStatusBar();

        console.log(`[Wormhole] Closed session for Leaf: ${leafId} `);
        new Notice("Wormhole Closed.");
    }

    getPublicUrl(leafId: string): string | null {
        return this.sessions.get(leafId)?.publicUrl || null;
    }

    isSharing(leafId: string): boolean {
        return this.sessions.has(leafId);
    }

    /**
     * MONITORING: Auto-close session when tab is closed (F-07).
     */
    private registerLifecycleListeners() {
        this.plugin.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.checkLeaves();
            })
        );
    }

    /**
     * Scans active sessions and kills those whose leaves no longer exist.
     */
    private checkLeaves() {
        if (this.sessions.size === 0) return;

        // Collect dead leaf IDs
        const deadLeafIds: string[] = [];

        for (const leafId of this.sessions.keys()) {
            const leaf = this.app.workspace.getLeafById(leafId);
            // If getLeafById returns null/undefined, the leaf is gone
            if (!leaf) {
                deadLeafIds.push(leafId);
            }
        }

        // Cleanup dead sessions
        for (const leafId of deadLeafIds) {
            console.log(`[Wormhole] Detected closed tab for active session ${leafId}. Terminating...`);
            // We use void pattern (fire and forget) for cleanup, catching errors
            this.stopSharing(leafId).catch(err => console.error("Error closing stray wormhole", err));
        }
    }

    /**
     * Cleanup ALL sessions (e.g. plugin unload)
     */
    getSessionConfig(leafId: string): SessionConfig | null {
        return this.sessions.get(leafId)?.config || null;
    }

    getActiveSessionCount(): number {
        return this.sessions.size;
    }

    getViewerCount(leafId: string): number {
        const session = this.sessions.get(leafId);
        return session ? session.server.getViewerCount() : 0;
    }

    refreshOverlays() {
        for (const session of this.sessions.values()) {
            session.overlay?.refresh();
        }
    }

    unload() {
        console.log("[WormholeManager] Unloading - Closing all sessions...");
        for (const leafId of this.sessions.keys()) {
            // Force safe synchronous-like start of cleanup, but we can't await easily in unload
            const session = this.sessions.get(leafId);
            if (session) {
                session.tunnel.stop().catch(e => console.error(e));
                session.server.stop();
            }
        }
        this.sessions.clear();
        this.renderer.unload();
    }
}
