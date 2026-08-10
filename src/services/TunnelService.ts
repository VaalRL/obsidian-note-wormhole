import { startTunnel, Tunnel } from "untun";

/**
 * TunnelService
 *
 * Manages the Cloudflare Tunnel using the 'untun' library.
 * This exposes the local localhost server to the public internet securely.
 */
export class TunnelService {
    private tunnel: Tunnel | null = null;
    private url: string | null = null;

    /**
     * Starts a new tunnel pointing to the specified local port.
     * @param localPort The localhost port to expose
     * @param options Optional configuration
     * @returns The public URL
     */
    async start(localPort: number, options?: { acceptCloudflareNotice?: boolean }): Promise<string> {
        if (this.tunnel) {
            return this.url ?? "";
        }

        try {
            // untun defaults to Cloudflare Quick Tunnels, which need no account.
            this.tunnel = await startTunnel({
                port: localPort,
                acceptCloudflareNotice: options?.acceptCloudflareNotice
            }) || null;

            if (!this.tunnel) {
                throw new Error("Tunnel failed to start: untun returned no tunnel");
            }

            this.url = await this.tunnel.getURL();
            return this.url;
        } catch (error) {
            console.error("[Wormhole] Failed to start tunnel:", error);
            await this.stop(); // Cleanup partial state
            throw error;
        }
    }

    /**
     * Stops the current tunnel.
     */
    async stop() {
        if (!this.tunnel) return;

        const tunnel = this.tunnel;
        this.tunnel = null;
        this.url = null;

        try {
            await tunnel.close();
        } catch (error) {
            console.error("[Wormhole] Failed to close tunnel cleanly:", error);
        }
    }

    /**
     * Returns the current public URL if active.
     */
    getUrl(): string | null {
        return this.url;
    }
}
