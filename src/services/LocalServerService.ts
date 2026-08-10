import * as http from "http";
import { Server, IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";

/**
 * LocalServerService
 *
 * Manages a temporary Node.js HTTP server running on localhost.
 * It serves content from memory (S-02).
 */
export class LocalServerService {
    private server: Server | null = null;
    private currentHtml = "";
    private port = 0;

    // Open sockets, tracked so stop() can tear the server down immediately
    // instead of waiting for keep-alive connections to drain (F-05).
    private sockets: Set<Socket> = new Set();

    // Viewer Tracking
    private activeViewers: Map<string, number> = new Map(); // SessionID -> LastSeenTimestamp

    /**
     * Starts the local server on a random available port.
     * @param htmlContent The initial HTML content to serve
     * @returns The port number
     */
    start(htmlContent: string): Promise<number> {
        this.currentHtml = htmlContent;
        this.activeViewers.clear();

        return new Promise((resolve, reject) => {
            this.server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
                this.handleRequest(req, res);
            });

            this.server.on("connection", (socket: Socket) => {
                this.sockets.add(socket);
                socket.on("close", () => this.sockets.delete(socket));
            });

            // Listen on port 0 to let the OS choose a random available port,
            // bound to loopback only so nothing is reachable without the tunnel.
            this.server.listen(0, "127.0.0.1", () => {
                const address = this.server?.address();
                if (address && typeof address !== "string") {
                    this.port = address.port;
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
     * Stops the server and severs every open connection right away.
     */
    stop() {
        if (!this.server) return;

        this.server.close();

        for (const socket of this.sockets) {
            socket.destroy();
        }
        this.sockets.clear();

        this.server = null;
        this.activeViewers.clear();
        this.currentHtml = "";
    }

    private handleRequest(req: IncomingMessage, res: ServerResponse) {
        // Heartbeat (F-10)
        if (req.url && req.url.startsWith("/_heartbeat")) {
            this.handleHeartbeat(req, res);
            return;
        }

        // Security S-03: only serve the root path
        if (req.url === "/" || req.url === "/index.html") {
            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
                // Prevent caching so the lifecycle stays strict
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                // Lock the page down to its own inline assets. Images still resolve
                // over https so notes embedding remote images keep working.
                "Content-Security-Policy":
                    "default-src 'none'; img-src 'self' data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
                "X-Content-Type-Options": "nosniff",
                "Referrer-Policy": "no-referrer",
                "X-Robots-Tag": "noindex, nofollow"
            });
            res.end(this.currentHtml);
        } else {
            // Block everything else
            res.writeHead(404);
            res.end("Not Found");
        }
    }

    private handleHeartbeat(req: IncomingMessage, res: ServerResponse) {
        try {
            const url = new URL(req.url || "", `http://localhost:${this.port}`);
            const sessionId = url.searchParams.get("id");

            if (sessionId) {
                this.activeViewers.set(sessionId, Date.now());
            }
        } catch (e) {
            console.error("[Wormhole] Heartbeat error", e);
        }

        // Same-origin only: the shared page is the sole caller, so no CORS header.
        res.writeHead(204);
        res.end();
    }

    getViewerCount(): number {
        const now = Date.now();
        const timeout = 10000; // 10 seconds
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
