/**
 * Pinned cloudflared release metadata.
 *
 * Note Wormhole never downloads "latest" — it downloads exactly this version and
 * refuses to install anything whose SHA-256 does not match the value recorded
 * here. The checksums were produced by downloading each asset from the official
 * release below and hashing it.
 *
 * To move to a newer cloudflared, run `npm run update-cloudflared -- <version>`,
 * which rewrites this table from the real assets. Never hand-edit a checksum.
 */

export const CLOUDFLARED_VERSION = "2026.8.2";

export const CLOUDFLARED_RELEASE_PAGE =
    `https://github.com/cloudflare/cloudflared/releases/tag/${CLOUDFLARED_VERSION}`;

const DOWNLOAD_BASE =
    `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/`;

/** Hosts the downloader is allowed to talk to, including GitHub's asset CDN. */
export const ALLOWED_DOWNLOAD_HOSTS = [
    "github.com",
    "githubusercontent.com"
];

export interface CloudflaredAsset {
    /** Release asset file name. */
    assetName: string;
    /** SHA-256 of the asset exactly as downloaded. */
    sha256: string;
    /** Expected size in bytes, used for progress reporting and a cheap sanity check. */
    size: number;
    /** macOS ships a gzipped tarball rather than a bare binary. */
    archive: boolean;
    /** Set when the platform has no native build and relies on emulation. */
    emulated?: boolean;
}

/**
 * Keyed by `${process.platform}-${process.arch}`.
 * cloudflared publishes no windows-arm64 build; Windows on ARM runs the x64
 * binary under emulation, so that key maps to the amd64 asset deliberately.
 */
const ASSETS: Record<string, CloudflaredAsset> = {
    "linux-x64": {
        assetName: "cloudflared-linux-amd64",
        sha256: "fcfb02b575a52ca1af2e3267af4e1517bcdeb30ac48c834c69abaed3c0576ad2",
        size: 39799316,
        archive: false
    },
    "linux-arm64": {
        assetName: "cloudflared-linux-arm64",
        sha256: "7747d94570fb390cf47dcb4f9555c193c6355cda9793f0d878d9049e5d6a7790",
        size: 37404344,
        archive: false
    },
    "linux-arm": {
        assetName: "cloudflared-linux-arm",
        sha256: "19809425f60a6261241dfa66a42b4115bab07c295396a3c4d5d7c247fc4e1412",
        size: 36288720,
        archive: false
    },
    "linux-ia32": {
        assetName: "cloudflared-linux-386",
        sha256: "39845d980a4b74b9c84530a28d8fea1fe6c476de26460275602162b349f1cbef",
        size: 37102345,
        archive: false
    },
    "darwin-x64": {
        assetName: "cloudflared-darwin-amd64.tgz",
        sha256: "f1727723c586500e2092368ae21871b3df7ddfd2cb097f22d81bee4a9c458bb4",
        size: 21116242,
        archive: true
    },
    "darwin-arm64": {
        assetName: "cloudflared-darwin-arm64.tgz",
        sha256: "9042c2c5d8b2de78e60f313d5fb31b6c5c1cebde787a3caf1f2c9588084ac442",
        size: 19214189,
        archive: true
    },
    "win32-x64": {
        assetName: "cloudflared-windows-amd64.exe",
        sha256: "c29eee2b121f5436a642eed69fd9767da7e7b8c510fa50aaa130337f931357b5",
        size: 54893480,
        archive: false
    },
    "win32-ia32": {
        assetName: "cloudflared-windows-386.exe",
        sha256: "6acb072357618fa16c53c43e05438ed728aacd47119f1c6c3aa1a668c3299b43",
        size: 37369480,
        archive: false
    },
    "win32-arm64": {
        assetName: "cloudflared-windows-amd64.exe",
        sha256: "c29eee2b121f5436a642eed69fd9767da7e7b8c510fa50aaa130337f931357b5",
        size: 54893480,
        archive: false,
        emulated: true
    }
};

/** Returns the asset for the current platform, or null if there is no build for it. */
export function resolveAsset(
    platform: string = process.platform,
    arch: string = process.arch
): CloudflaredAsset | null {
    return ASSETS[`${platform}-${arch}`] ?? null;
}

export function downloadUrlFor(asset: CloudflaredAsset): string {
    return DOWNLOAD_BASE + asset.assetName;
}
