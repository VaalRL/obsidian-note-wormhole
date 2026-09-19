import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
    CLOUDFLARED_DOWNLOADS_URL,
    CLOUDFLARED_RELEASES_URL,
    installMethodsFor,
    searchLocationsFor
} from "../src/services/cloudflaredInstall";

/**
 * Note Wormhole refuses to install cloudflared, so the install guidance is the
 * whole of the user's path out of a dead end. If it is wrong or empty, the
 * plugin is simply unusable with no way forward.
 */

const PLATFORMS = ["win32", "darwin", "linux", "freebsd"];

describe("cloudflared install guidance", () => {
    it("offers a way forward on every platform, including unknown ones", () => {
        for (const platform of PLATFORMS) {
            const methods = installMethodsFor(platform);
            assert.ok(methods.length > 0, `no install guidance for ${platform}`);
            for (const method of methods) {
                assert.ok(method.label, `a method on ${platform} has no label`);
                assert.ok(
                    method.command || method.url,
                    `"${method.label}" on ${platform} tells the user nothing to do`
                );
            }
        }
    });

    it("points only at Cloudflare's own channels over HTTPS", () => {
        const urls = [CLOUDFLARED_DOWNLOADS_URL, CLOUDFLARED_RELEASES_URL];
        for (const platform of PLATFORMS) {
            for (const method of installMethodsFor(platform)) {
                if (method.url) urls.push(method.url);
            }
        }

        for (const raw of urls) {
            const url = new URL(raw);
            assert.equal(url.protocol, "https:", `${raw} is not HTTPS`);
            assert.ok(
                url.hostname.endsWith("cloudflare.com") || url.hostname === "github.com",
                `${url.hostname} is not a Cloudflare or GitHub host`
            );
            if (url.hostname === "github.com") {
                assert.ok(
                    url.pathname.startsWith("/cloudflare/cloudflared"),
                    `${raw} does not point at Cloudflare's own repository`
                );
            }
        }
    });

    it("gives the documented package manager command per platform", () => {
        const windows = installMethodsFor("win32");
        assert.ok(windows.some((m) => m.command === "winget install Cloudflare.cloudflared"));

        const macos = installMethodsFor("darwin");
        assert.ok(macos.some((m) => m.command === "brew install cloudflared"));

        // Linux has no single command, so it must at least hand over a source.
        assert.ok(installMethodsFor("linux").every((m) => m.command || m.url));
    });

    it("never suggests a command that installs something other than cloudflared", () => {
        for (const platform of PLATFORMS) {
            for (const method of installMethodsFor(platform)) {
                if (!method.command) continue;
                assert.match(
                    method.command,
                    /cloudflared/i,
                    `"${method.command}" does not mention cloudflared`
                );
            }
        }
    });

    it("tells the user where the plugin will look, per platform", () => {
        for (const platform of PLATFORMS) {
            const where = searchLocationsFor(platform);
            assert.ok(where.length > 0);
            // PATH is the one location that matters on every platform, because
            // it is what every package manager above actually populates.
            assert.match(where, /PATH/);
        }
    });
});
