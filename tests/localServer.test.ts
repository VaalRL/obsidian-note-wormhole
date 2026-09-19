import { strict as assert } from "node:assert";
import { after, before, describe, it } from "node:test";
import * as http from "http";
import { LocalServerService } from "../src/services/LocalServerService";

/**
 * Covers the server-side security requirements from req.md:
 *   S-02 content is served from memory,
 *   S-03 only the root path answers; everything else is refused,
 *   F-05 stopping a session really does kill the listener.
 *
 * Everything here stays on loopback — no tunnel, no network.
 */

const HTML = "<!DOCTYPE html><html><body>secret note body</body></html>";

interface Response {
    status: number;
    headers: http.IncomingHttpHeaders;
    body: string;
}

function request(port: number, path: string, method = "GET"): Promise<Response> {
    return new Promise((resolve, reject) => {
        const req = http.request(
            { host: "127.0.0.1", port, path, method },
            (res) => {
                let body = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => (body += chunk));
                res.on("end", () =>
                    resolve({ status: res.statusCode ?? 0, headers: res.headers, body })
                );
            }
        );
        req.on("error", reject);
        req.end();
    });
}

describe("LocalServerService", () => {
    let server: LocalServerService;
    let port: number;

    before(async () => {
        server = new LocalServerService();
        port = await server.start(HTML);
    });

    after(() => {
        server.stop();
    });

    it("listens on an OS-assigned port", () => {
        assert.ok(port > 0);
    });

    it("serves the note from memory at the root path", async () => {
        const res = await request(port, "/");

        assert.equal(res.status, 200);
        assert.equal(res.body, HTML);
        assert.match(String(res.headers["content-type"]), /text\/html/);
    });

    it("sends the lockdown response headers", async () => {
        const res = await request(port, "/");

        assert.match(String(res.headers["cache-control"]), /no-store/);
        assert.match(String(res.headers["content-security-policy"]), /default-src 'none'/);
        assert.match(String(res.headers["content-security-policy"]), /frame-ancestors 'none'/);
        assert.equal(res.headers["x-content-type-options"], "nosniff");
        assert.equal(res.headers["referrer-policy"], "no-referrer");
        assert.match(String(res.headers["x-robots-tag"]), /noindex/);
    });

    it("refuses every path except the root (S-03)", async () => {
        for (const path of ["/secret", "/../main.ts", "/index.html/extra", "/favicon.ico"]) {
            const res = await request(port, path);
            assert.equal(res.status, 404, `${path} should not be served`);
            assert.ok(!res.body.includes("secret note body"), `${path} leaked the note body`);
        }
    });

    it("does not hand out a CORS grant on the heartbeat", async () => {
        const res = await request(port, "/_heartbeat?id=abc", "POST");

        assert.equal(res.status, 204);
        assert.equal(res.headers["access-control-allow-origin"], undefined);
    });

    // Counting tests get their own server so they start from zero viewers.
    it("counts a distinct viewer per heartbeat id", async () => {
        const fresh = new LocalServerService();
        const freshPort = await fresh.start(HTML);
        try {
            await request(freshPort, "/_heartbeat?id=reader-one", "POST");
            await request(freshPort, "/_heartbeat?id=reader-two", "POST");
            // A repeat from a viewer already seen must not inflate the count.
            await request(freshPort, "/_heartbeat?id=reader-one", "POST");

            assert.equal(fresh.getViewerCount(), 2);
        } finally {
            fresh.stop();
        }
    });

    it("ignores a heartbeat with no id", async () => {
        const fresh = new LocalServerService();
        const freshPort = await fresh.start(HTML);
        try {
            await request(freshPort, "/_heartbeat", "POST");
            assert.equal(fresh.getViewerCount(), 0);
        } finally {
            fresh.stop();
        }
    });

    it("clears the viewer list when a new session starts on the same instance", async () => {
        const reused = new LocalServerService();
        const firstPort = await reused.start(HTML);
        await request(firstPort, "/_heartbeat?id=old-reader", "POST");
        assert.equal(reused.getViewerCount(), 1);
        reused.stop();

        const secondPort = await reused.start(HTML);
        try {
            assert.equal(reused.getViewerCount(), 0);
            assert.notEqual(secondPort, 0);
        } finally {
            reused.stop();
        }
    });

    it("serves updated content without restarting", async () => {
        const updated = "<html><body>second revision</body></html>";
        server.updateContent(updated);

        const res = await request(port, "/");
        assert.equal(res.body, updated);
    });

    it("stops listening and forgets the content once stopped (F-05)", async () => {
        const doomed = new LocalServerService();
        const doomedPort = await doomed.start(HTML);

        assert.equal((await request(doomedPort, "/")).status, 200);

        doomed.stop();
        assert.equal(doomed.getViewerCount(), 0);

        await assert.rejects(
            () => request(doomedPort, "/"),
            (error: NodeJS.ErrnoException) => error.code === "ECONNREFUSED" || error.code === "ECONNRESET",
            "the port should refuse connections after stop()"
        );
    });
});
