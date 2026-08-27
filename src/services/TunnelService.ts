import { ChildProcess, spawn } from "child_process";
import { ResolvedBinary } from "./CloudflaredBinaryService";

/**
 * TunnelService
 *
 * Runs `cloudflared tunnel --url http://127.0.0.1:<port>` and reads the public
 * quick-tunnel URL out of its output.
 *
 * This replaces the `untun` wrapper, which hardcoded its binary to the OS temp
 * directory, performed no checksum verification, and registered process-wide
 * SIGINT/SIGUSR handlers on every start without ever removing them.
 */

/** cloudflared prints the assigned URL inside a boxed log line. */
const TUNNEL_URL_PATTERN = /https:\/\/[a-z0-9][a-z0-9-]*\.trycloudflare\.com/i;

/** How long to wait for the URL before giving up. */
const STARTUP_TIMEOUT_MS = 45000;

/** How long to wait for a graceful exit before escalating to SIGKILL. */
const SHUTDOWN_GRACE_MS = 3000;

export class TunnelService {
    private child: ChildProcess | null = null;
    private url: string | null = null;

    /**
     * Starts a quick tunnel to the given local port.
     * @param localPort The loopback port to expose
     * @param binary The cloudflared binary to run
     * @returns The public URL
     */
    async start(localPort: number, binary: ResolvedBinary): Promise<string> {
        if (this.child) {
            return this.url ?? "";
        }

        const child = spawn(
            binary.path,
            [
                "tunnel",
                "--no-autoupdate",
                "--url", `http://127.0.0.1:${localPort}`
            ],
            { stdio: ["ignore", "pipe", "pipe"], windowsHide: true }
        );
        this.child = child;

        try {
            this.url = await this.awaitTunnelUrl(child);
            return this.url;
        } catch (error) {
            await this.stop();
            throw error;
        }
    }

    /**
     * Watches cloudflared's output for the assigned URL, failing fast if the
     * process dies or stays silent.
     */
    private awaitTunnelUrl(child: ChildProcess): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let settled = false;
            // cloudflared logs to stderr, but read both so a change in its
            // logging destination does not silently break URL discovery.
            let transcript = "";

            const finish = (fn: () => void) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                child.stdout?.off("data", onData);
                child.stderr?.off("data", onData);
                child.off("error", onError);
                child.off("exit", onExit);
                fn();
            };

            const onData = (chunk: Buffer) => {
                const text = chunk.toString();
                transcript += text;

                const match = text.match(TUNNEL_URL_PATTERN) ?? transcript.match(TUNNEL_URL_PATTERN);
                if (match) {
                    const url = match[0];
                    finish(() => resolve(url));
                }
            };

            const onError = (error: Error) => {
                finish(() => reject(
                    new Error(`Could not run cloudflared: ${error.message}`)
                ));
            };

            const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
                finish(() => reject(new Error(
                    `cloudflared exited before a tunnel was ready ` +
                    `(${signal ? `signal ${signal}` : `code ${code}`}).` +
                    `${this.lastLines(transcript)}`
                )));
            };

            const timer = setTimeout(() => {
                finish(() => reject(new Error(
                    `cloudflared did not report a tunnel URL within ` +
                    `${Math.round(STARTUP_TIMEOUT_MS / 1000)}s.${this.lastLines(transcript)}`
                )));
            }, STARTUP_TIMEOUT_MS);

            child.stdout?.on("data", onData);
            child.stderr?.on("data", onData);
            child.on("error", onError);
            child.on("exit", onExit);
        });
    }

    /**
     * Stops the tunnel and waits for the process to actually be gone, so the
     * kill switch means what it says.
     */
    async stop() {
        const child = this.child;
        this.child = null;
        this.url = null;

        if (!child || child.exitCode !== null || child.signalCode !== null) return;

        await new Promise<void>((resolve) => {
            const force = setTimeout(() => {
                child.kill("SIGKILL");
            }, SHUTDOWN_GRACE_MS);

            child.once("exit", () => {
                clearTimeout(force);
                resolve();
            });

            try {
                child.kill("SIGTERM");
            } catch {
                clearTimeout(force);
                resolve();
            }
        });
    }

    /**
     * Best-effort synchronous teardown, for Obsidian's synchronous onunload().
     */
    stopSync() {
        const child = this.child;
        this.child = null;
        this.url = null;

        if (!child || child.exitCode !== null || child.signalCode !== null) return;

        try {
            child.kill("SIGKILL");
        } catch {
            // The process is already gone.
        }
    }

    /**
     * Returns the current public URL if active.
     */
    getUrl(): string | null {
        return this.url;
    }

    /** Tail of cloudflared's output, for error messages. */
    private lastLines(transcript: string, count = 3): string {
        const lines = transcript
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(-count);

        return lines.length ? `\n${lines.join("\n")}` : "";
    }
}
