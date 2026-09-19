import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { TUNNEL_URL_PATTERN } from "../src/services/TunnelService";

/**
 * The public URL is scraped out of cloudflared's log output, so a change in how
 * cloudflared formats that line is the most likely way sharing breaks. These
 * samples are the real shapes it emits.
 */

const BOXED_OUTPUT = `2026-08-02T10:15:02Z INF Requesting new quick Tunnel on trycloudflare.com...
2026-08-02T10:15:04Z INF +--------------------------------------------------------------------------------------------+
2026-08-02T10:15:04Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2026-08-02T10:15:04Z INF |  https://mellow-radio-tower-42.trycloudflare.com                                           |
2026-08-02T10:15:04Z INF +--------------------------------------------------------------------------------------------+`;

describe("tunnel URL discovery", () => {
    it("finds the URL in cloudflared's boxed announcement", () => {
        const match = BOXED_OUTPUT.match(TUNNEL_URL_PATTERN);

        assert.ok(match);
        assert.equal(match[0], "https://mellow-radio-tower-42.trycloudflare.com");
    });

    it("finds a URL split across two stream chunks once they are joined", () => {
        // A chunk boundary can land inside the URL, which is why the service
        // matches against the accumulated transcript and not only the new chunk.
        const first = "INF |  https://mellow-radio";
        const second = "-tower-42.trycloudflare.com   |";

        assert.equal(first.match(TUNNEL_URL_PATTERN), null);
        assert.equal(second.match(TUNNEL_URL_PATTERN), null);

        const joined = (first + second).match(TUNNEL_URL_PATTERN);
        assert.ok(joined);
        assert.equal(joined[0], "https://mellow-radio-tower-42.trycloudflare.com");
    });

    it("ignores the bare domain in the 'Requesting new quick Tunnel' line", () => {
        const line = "2026-08-02T10:15:02Z INF Requesting new quick Tunnel on trycloudflare.com...";

        assert.equal(line.match(TUNNEL_URL_PATTERN), null);
    });

    it("does not accept a lookalike host", () => {
        const impostors = [
            "https://trycloudflare.com.evil.test",
            "http://plain-http.trycloudflare.com",
            "https://-leading-hyphen.trycloudflare.com"
        ];

        for (const candidate of impostors) {
            const match = candidate.match(TUNNEL_URL_PATTERN);
            assert.ok(
                !match || match[0] !== candidate,
                `${candidate} should not be accepted verbatim as the tunnel URL`
            );
        }
    });

    it("accepts the hostname shapes Cloudflare actually assigns", () => {
        const samples = [
            "https://abc.trycloudflare.com",
            "https://a1b2-c3d4-e5f6.trycloudflare.com",
            "https://0abc-def.trycloudflare.com"
        ];

        for (const url of samples) {
            const match = url.match(TUNNEL_URL_PATTERN);
            assert.ok(match, `${url} should be recognised`);
            assert.equal(match[0], url);
        }
    });
});
