import * as http from "http";
import { Server, IncomingMessage, ServerResponse } from "http";

/**
 * LocalServerService
 * 
 * Manages a temporary Node.js HTTP server running on localhost.
 * It serves content from memory.
 */
export class LocalServerService {
    private server: Server | null = null;
    private currentHtml: string = "";
    private port: number = 0;

    // Viewer Tracking
    private activeViewers: Map<string, number> = new Map(); // SessionID -> LastSeenTimestamp

    /**
     * Starts the local server on a random available port.
     * @param htmlContent The initial HTML content to serve
     * @returns The port number
     */
    async start(htmlContent: string): Promise<number> {
        this.currentHtml = htmlContent;
        this.activeViewers.clear();

        return new Promise((resolve, reject) => {
            this.server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
                this.handleRequest(req, res);
            });

            // Listen on port 0 to let OS choose a random available port
            this.server.listen(0, "127.0.0.1", () => {
                const address = this.server?.address();
                if (address && typeof address !== "string") {
                    this.port = address.port;
                    // console.log(`[Wormhole] Local server started on port ${this.port}`);
                    resolve(this.port);
                } else {
                    reject(new Error("Failed to get server port"));
                }
            });

            this.server.on("error", (err) => {
                console.error("[Wormhole] Server error:", err);
                reject(err);
            });
        });
    }

    /**
     * Updates the content being served without restarting the server.
     */
    updateContent(newHtml: string) {
        this.currentHtml = newHtml;
    }

    /**
     * Stops the server.
     */
    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            // console.log("[Wormhole] Local server stopped");
        }
    }

    private handleRequest(req: IncomingMessage, res: ServerResponse) {
        // Heartbeat (F-10)
        if (req.url && req.url.startsWith('/_heartbeat')) {
            this.handleHeartbeat(req, res);
            return;
        }

        // Security S-03: Only serve root path
        if (req.url === "/" || req.url === "/index.html") {
            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
                // Prevent caching so lifecycle is strict
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
            });
            res.end(this.currentHtml);
        } else {
            // Block everything else
            res.writeHead(404);
            res.end("Not Found");
        }
    }
    private handleHeartbeat(req: IncomingMessage, res: ServerResponse) {
        // Parse Query String manually or via URL
        // req.url is like /_heartbeat?id=xyz
        try {
            const url = new URL(req.url || '', `http://localhost:${this.port}`);
            const sessionId = url.searchParams.get('id');

            if (sessionId) {
                this.activeViewers.set(sessionId, Date.now());
            }
        } catch (e) {
            console.error("Heartbeat error", e);
        }

        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        res.end('OK');
    }

    getViewerCount(): number {
        const now = Date.now();
        const timeout = 10000; // 10 seconds timeout
        let count = 0;

        for (const [id, lastSeen] of this.activeViewers.entries()) {
            if (now - lastSeen < timeout) {
                count++;
            } else {
                this.activeViewers.delete(id); // Cleanup
            }
        }
        return count;
    }
}
