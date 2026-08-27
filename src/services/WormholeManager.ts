import { App, Notice, MarkdownView } from 'obsidian';
import { HtmlRendererService } from './HtmlRendererService';
import { LocalServerService } from './LocalServerService';
import { TunnelService } from './TunnelService';
import { CloudflaredBinaryService, ResolvedBinary } from './CloudflaredBinaryService';
import { WormholeOverlay } from '../ui/WormholeOverlay';
import { BinaryInstallationModal } from '../ui/BinaryInstallationModal';
import NoteWormholePlugin from "../../main";

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
    config: SessionConfig;
    overlay?: WormholeOverlay;
}

export class WormholeManager {
    private app: App;
    private plugin: NoteWormholePlugin;
    private renderer: HtmlRendererService;
    private binaries: CloudflaredBinaryService;

    private sessions: Map<string, WormholeSession> = new Map();

    constructor(app: App, plugin: NoteWormholePlugin) {
        this.app = app;
        this.plugin = plugin;
        this.renderer = new HtmlRendererService(app);
        this.binaries = new CloudflaredBinaryService();
        this.registerLifecycleListeners();
    }
    async startSharing(leafId: string, markdownContent: string, filePath: string): Promise<string> {
        // Check if already active
        const existing = this.sessions.get(leafId);
        if (existing) {
            new Notice(`Wormhole already active for this tab!\n${existing.publicUrl}`);
            await navigator.clipboard.writeText(existing.publicUrl);
            return existing.publicUrl;
        }

        const binary = await this.ensureCloudflared();
        return this.performStartSharing(leafId, markdownContent, filePath, binary);
    }

    /**
     * Resolves a cloudflared binary, asking for consent first.
     *
     * Consent is tracked in two parts on purpose: agreeing to run a copy the
     * user already installed is a smaller ask than agreeing to let the plugin
     * download an executable, so losing the system binary re-prompts rather
     * than silently starting a download.
     */
    private async ensureCloudflared(): Promise<ResolvedBinary> {
        const existing = await this.binaries.findExisting();
        const settings = this.plugin.settings;

        const consented = existing
            ? settings.hasAcceptedTunnelTerms
            : settings.hasAcceptedTunnelTerms && settings.hasAcceptedBinaryDownload;

        if (!consented) {
            await this.requestConsent(existing);
        }

        if (existing) return existing;

        return this.downloadCloudflared();
    }

    /** Opens the consent modal; resolves on accept, rejects if the user declines. */
    private requestConsent(existing: ResolvedBinary | null): Promise<void> {
        const plan = existing ? null : this.binaries.getDownloadPlan();

        return new Promise((resolve, reject) => {
            new BinaryInstallationModal(this.app, {
                existing,
                plan,
                onAccept: () => {
                    this.plugin.settings.hasAcceptedTunnelTerms = true;
                    if (!existing) {
                        this.plugin.settings.hasAcceptedBinaryDownload = true;
                    }
                    void this.plugin.saveSettings().then(resolve).catch(reject);
                },
                onCancel: () => {
                    new Notice("Wormhole cancelled: cloudflared was not approved.");
                    reject(new Error("Cloudflared permission declined"));
                }
            }).open();
        });
    }

    /** Downloads and verifies the pinned cloudflared, reporting progress. */
    private async downloadCloudflared(): Promise<ResolvedBinary> {
        const notice = new Notice("Downloading cloudflared... 0%", 0);
        let lastShown = -1;

        try {
            return await this.binaries.install(({ receivedBytes, totalBytes }) => {
                if (!totalBytes) return;
                const percent = Math.min(100, Math.floor((receivedBytes / totalBytes) * 100));
                // Repainting on every chunk would thrash the DOM.
                if (percent === lastShown) return;
                lastShown = percent;
                notice.setMessage(`Downloading cloudflared... ${percent}%`);
            });
        } finally {
            notice.hide();
        }
    }

    private async performStartSharing(
        leafId: string,
        markdownContent: string,
        filePath: string,
        binary: ResolvedBinary
    ): Promise<string> {
        const server = new LocalServerService();
        const tunnel = new TunnelService();

        // Declared outside the try block so the catch/finally path can always
        // clear them — otherwise a failed start leaves a permanent notice on screen.
        const startupNotice = new Notice("Opening wormhole... ⏳", 0); // Persist
        // If it takes > 2s, it's likely downloading
        const downloadTimer = setTimeout(() => {
            startupNotice.setMessage("Constructing tunnel... (first run downloads components)");
        }, 2500);

        try {
            // Initial Config
            const config: SessionConfig = {
                preventSelection: this.plugin.settings.preventSelection
            };

            // 1. Render content
            const html = await this.renderer.render(
                markdownContent,
                config.preventSelection,
                this.plugin.settings.themeMode
            );

            // 2. Start Local Server
            const port = await server.start(html);

            // 3. Start Tunnel using the binary resolved above
            const url = await tunnel.start(port, binary);

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

            new Notice(`Wormhole active! 🌌\nLink copied to clipboard.`);

            await navigator.clipboard.writeText(url);

            return url;

        } catch (e) {
            console.error("[Wormhole] Failed to open wormhole", e);
            new Notice("Failed to open wormhole. Check the developer console for details.");

            // Cleanup partial startup
            await tunnel.stop();
            server.stop();
            throw e;
        } finally {
            clearTimeout(downloadTimer);
            startupNotice.hide();
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

        // The server only holds the rendered HTML, so re-read the markdown from
        // the view and re-render it with the new protection setting.
        const leaf = this.app.workspace.getLeafById(leafId);
        if (leaf && leaf.view instanceof MarkdownView) {
            const content = leaf.view.getViewData();
            const newHtml = await this.renderer.render(
                content,
                newSetting,
                this.plugin.settings.themeMode
            );
            session.server.updateContent(newHtml);

            // Update Overlay
            session.overlay?.refresh();

            new Notice(`Secure mode: ${newSetting ? 'on 🔒' : 'off 🔓'}`);
        }
    }


    /**
     * Stops sharing for a specific leaf.
     */
    async stopSharing(leafId: string) {
        const session = this.sessions.get(leafId);
        if (!session) return;

        new Notice("Closing wormhole... 🌑");

        await session.tunnel.stop();
        session.server.stop();

        // Destroy Overlay
        if (session.overlay) {
            session.overlay.destroy();
        }

        this.sessions.delete(leafId);

        // Trigger UI Refresh
        this.plugin.tabDecorator.refreshAll();
        this.plugin.updateStatusBar();

        new Notice("Wormhole closed.");
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
            // Fire and forget cleanup; errors are logged rather than surfaced.
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
        // onunload() is synchronous, so kick off tunnel teardown without awaiting.
        for (const leafId of this.sessions.keys()) {
            const session = this.sessions.get(leafId);
            if (session) {
                session.overlay?.destroy();
                session.tunnel.stopSync();
                session.server.stop();
            }
        }
        this.sessions.clear();
        this.renderer.unload();
    }
}
