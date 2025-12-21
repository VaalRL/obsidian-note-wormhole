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
     * @returns The public URL
     */
    async start(localPort: number): Promise<string> {
        if (this.tunnel) {
            return this.url! || "";
        }

        console.log(`[Wormhole] Starting tunnel for port ${localPort}...`);

        try {
            this.tunnel = await startTunnel({
                port: localPort,
                // We use 'tryflare' (Cloudflare Quick Tunnels) by default with untun
            }) || null;

            if (this.tunnel) {
                this.url = await this.tunnel.getURL();
                console.log(`[Wormhole] Tunnel established at ${this.url}`);
                return this.url;
            } else {
                throw new Error("Tunnel failed to start: Object is null");
            }
        } catch (error) {
            console.error("[Wormhole] Failed to start tunnel:", error);
            this.stop(); // Cleanup partial state
            throw error;
        }
    }

    /**
     * Stops the current tunnel.
     */
    async stop() {
        if (this.tunnel) {
            console.log("[Wormhole] Closing tunnel...");
            await this.tunnel.close();
            this.tunnel = null;
            this.url = null;
            console.log("[Wormhole] Tunnel closed");
        }
    }

    /**
     * Returns the current public URL if active.
     */
    getUrl(): string | null {
        return this.url;
    }
}
