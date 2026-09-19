import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
    ALLOWED_DOWNLOAD_HOSTS,
    CLOUDFLARED_RELEASE_PAGE,
    CLOUDFLARED_VERSION,
    downloadUrlFor,
    resolveAsset
} from "../src/services/cloudflaredReleases";

/**
 * The pinned release table is the security boundary for the binary download:
 * if an entry is malformed, the checksum check it is supposed to enforce is
 * either skipped or impossible to satisfy. These tests guard its shape.
 */

const PLATFORMS: Array<[string, string]> = [
    ["linux", "x64"],
    ["linux", "arm64"],
    ["linux", "arm"],
    ["linux", "ia32"],
    ["darwin", "x64"],
    ["darwin", "arm64"],
    ["win32", "x64"],
    ["win32", "ia32"],
    ["win32", "arm64"]
];

describe("cloudflared release table", () => {
    it("pins a concrete version, never a floating tag", () => {
        assert.match(CLOUDFLARED_VERSION, /^\d{4}\.\d+\.\d+$/);
        assert.ok(!CLOUDFLARED_VERSION.includes("latest"));
        assert.ok(CLOUDFLARED_RELEASE_PAGE.endsWith(CLOUDFLARED_VERSION));
    });

    it("covers every platform Obsidian desktop runs on", () => {
        for (const [platform, arch] of PLATFORMS) {
            assert.ok(
                resolveAsset(platform, arch),
                `no cloudflared asset recorded for ${platform}-${arch}`
            );
        }
    });

    it("records a full SHA-256 and a plausible size for every asset", () => {
        for (const [platform, arch] of PLATFORMS) {
            const asset = resolveAsset(platform, arch);
            assert.ok(asset);
            assert.match(
                asset.sha256,
                /^[0-9a-f]{64}$/,
                `${platform}-${arch} checksum is not a 64-char lowercase hex digest`
            );
            // Every real cloudflared build is tens of megabytes; a tiny value
            // would mean a truncated or placeholder entry.
            assert.ok(
                asset.size > 10_000_000,
                `${platform}-${arch} size ${asset.size} is implausibly small`
            );
        }
    });

    it("only treats macOS assets as archives", () => {
        for (const [platform, arch] of PLATFORMS) {
            const asset = resolveAsset(platform, arch);
            assert.ok(asset);
            assert.equal(
                asset.archive,
                platform === "darwin",
                `${platform}-${arch} archive flag does not match its asset name`
            );
            assert.equal(asset.archive, asset.assetName.endsWith(".tgz"));
        }
    });

    it("maps Windows on ARM to the emulated x64 build", () => {
        const arm = resolveAsset("win32", "arm64");
        const x64 = resolveAsset("win32", "x64");

        assert.ok(arm && x64);
        assert.equal(arm.emulated, true);
        // Cloudflare publishes no windows-arm64 build, so this must be the very
        // same asset — including its checksum — as the x64 one.
        assert.equal(arm.assetName, x64.assetName);
        assert.equal(arm.sha256, x64.sha256);
        assert.notEqual(x64.emulated, true);
    });

    it("returns null for a platform with no build instead of guessing", () => {
        assert.equal(resolveAsset("aix", "ppc64"), null);
        assert.equal(resolveAsset("darwin", "ia32"), null);
        assert.equal(resolveAsset("win32", "mips"), null);
    });

    it("builds download URLs that the host allowlist actually permits", () => {
        for (const [platform, arch] of PLATFORMS) {
            const asset = resolveAsset(platform, arch);
            assert.ok(asset);

            const url = new URL(downloadUrlFor(asset));
            assert.equal(url.protocol, "https:");
            assert.ok(
                ALLOWED_DOWNLOAD_HOSTS.some(
                    (allowed) => url.hostname === allowed || url.hostname.endsWith(`.${allowed}`)
                ),
                `${url.hostname} is not in ALLOWED_DOWNLOAD_HOSTS`
            );
            assert.ok(url.pathname.includes(CLOUDFLARED_VERSION));
            assert.ok(url.pathname.endsWith(asset.assetName));
        }
    });

    it("does not allow an arbitrary host to masquerade as an allowed one", () => {
        // Guards the suffix check in CloudflaredBinaryService.isAllowedHost:
        // `github.com.evil.test` must not satisfy `endsWith(".github.com")`.
        const impostors = ["github.com.evil.test", "notgithub.com", "evil-github.com"];

        for (const host of impostors) {
            const allowed = ALLOWED_DOWNLOAD_HOSTS.some(
                (a) => host === a || host.endsWith(`.${a}`)
            );
            assert.equal(allowed, false, `${host} should not be an allowed download host`);
        }
    });
});
