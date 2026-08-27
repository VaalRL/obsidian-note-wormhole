import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as https from "https";
import { createHash } from "crypto";
import { execFile, execFileSync } from "child_process";
import {
    ALLOWED_DOWNLOAD_HOSTS,
    CLOUDFLARED_VERSION,
    downloadUrlFor,
    resolveAsset
} from "./cloudflaredReleases";

/**
 * CloudflaredBinaryService
 *
 * Finds a usable cloudflared binary, preferring one the user already installed.
 * Only when none exists does it download the pinned release, and it refuses to
 * install anything whose SHA-256 does not match the recorded checksum.
 *
 * This is the one place in the plugin that touches `fs`/`os`/`child_process`.
 * That is unavoidable here — the whole feature is "run a specific executable" —
 * and it is why the plugin is marked isDesktopOnly.
 */

export type BinarySource = "system" | "managed";

export interface ResolvedBinary {
    path: string;
    source: BinarySource;
    /** Version string reported by the binary, when it could be read. */
    version?: string;
}

export interface DownloadPlan {
    version: string;
    url: string;
    sha256: string;
    /** Bytes. */
    size: number;
    /** Absolute path the verified binary will be installed to. */
    installPath: string;
    /** True when this platform has no native build and relies on emulation. */
    emulated: boolean;
}

/** Reported while a download is in flight. */
export interface DownloadProgress {
    receivedBytes: number;
    totalBytes: number;
}

const MAX_REDIRECTS = 5;
const VERSION_PROBE_TIMEOUT_MS = 5000;

export class CloudflaredBinaryService {
    /**
     * Returns a usable binary without downloading anything, or null if the only
     * way forward is a download.
     */
    async findExisting(): Promise<ResolvedBinary | null> {
        const system = await this.findSystemBinary();
        if (system) return system;

        const managed = this.getManagedBinaryPath();
        if (managed && this.isFile(managed)) {
            // Already verified at install time; the version is fixed by the filename.
            return { path: managed, source: "managed", version: CLOUDFLARED_VERSION };
        }

        return null;
    }

    /**
     * Describes exactly what a download would do, so the consent dialog can show
     * the user the real URL, version, checksum and destination.
     * Returns null when there is no build for this platform.
     */
    getDownloadPlan(): DownloadPlan | null {
        const asset = resolveAsset();
        const installPath = this.getManagedBinaryPath();
        if (!asset || !installPath) return null;

        return {
            version: CLOUDFLARED_VERSION,
            url: downloadUrlFor(asset),
            sha256: asset.sha256,
            size: asset.size,
            installPath,
            emulated: asset.emulated === true
        };
    }

    /**
     * Downloads the pinned release, verifies its SHA-256, and installs it.
     * Throws if the checksum does not match; nothing is left behind on failure.
     */
    async install(onProgress?: (progress: DownloadProgress) => void): Promise<ResolvedBinary> {
        const asset = resolveAsset();
        const installPath = this.getManagedBinaryPath();

        if (!asset || !installPath) {
            throw new Error(
                `No cloudflared build is available for ${process.platform}/${process.arch}. ` +
                `Install cloudflared manually and Note Wormhole will use it.`
            );
        }

        const dir = path.dirname(installPath);
        fs.mkdirSync(dir, { recursive: true });

        const url = downloadUrlFor(asset);
        const stagingPath = `${installPath}.download`;

        try {
            const digest = await this.downloadToFile(url, stagingPath, asset.size, onProgress);

            if (digest !== asset.sha256) {
                throw new Error(
                    `Checksum mismatch for ${asset.assetName}.\n` +
                    `Expected ${asset.sha256}\nGot      ${digest}\n` +
                    `The download was discarded and nothing was installed.`
                );
            }

            if (asset.archive) {
                this.extractBinaryFromArchive(stagingPath, installPath, dir);
            } else {
                fs.renameSync(stagingPath, installPath);
            }

            if (process.platform !== "win32") {
                fs.chmodSync(installPath, 0o755);
            }
        } finally {
            this.removeQuietly(stagingPath);
        }

        return { path: installPath, source: "managed", version: CLOUDFLARED_VERSION };
    }

    /**
     * Absolute path of the plugin-managed binary, or null on an unsupported platform.
     *
     * Deliberately not the OS temp directory: temp is world-writable and gets
     * cleaned out from under us, and it is not somewhere an executable should live.
     * Deliberately not inside the vault either, so a 40 MB binary never ends up
     * in the user's sync.
     */
    getManagedBinaryPath(): string | null {
        if (!resolveAsset()) return null;

        const suffix = process.platform === "win32" ? ".exe" : "";
        return path.join(this.cacheRoot(), "bin", `cloudflared-${CLOUDFLARED_VERSION}${suffix}`);
    }

    /** Looks for a cloudflared the user installed themselves. */
    private async findSystemBinary(): Promise<ResolvedBinary | null> {
        for (const candidate of this.systemCandidates()) {
            if (!this.isFile(candidate)) continue;

            const version = await this.probeVersion(candidate);
            if (version) {
                return { path: candidate, source: "system", version };
            }
        }
        return null;
    }

    /** PATH entries first, then the usual install locations per platform. */
    private systemCandidates(): string[] {
        const candidates: string[] = [];

        const fromPath = this.lookupOnPath();
        if (fromPath) candidates.push(fromPath);

        if (process.platform === "win32") {
            const programFiles = process.env.ProgramFiles;
            const programFilesX86 = process.env["ProgramFiles(x86)"];
            if (programFiles) candidates.push(path.join(programFiles, "cloudflared", "cloudflared.exe"));
            if (programFilesX86) candidates.push(path.join(programFilesX86, "cloudflared", "cloudflared.exe"));
        } else {
            candidates.push(
                "/opt/homebrew/bin/cloudflared",
                "/usr/local/bin/cloudflared",
                "/usr/bin/cloudflared",
                "/snap/bin/cloudflared",
                path.join(os.homedir(), ".cloudflared", "cloudflared"),
                path.join(os.homedir(), ".local", "bin", "cloudflared")
            );
        }

        return candidates;
    }

    /** Resolves cloudflared through the shell's PATH lookup. */
    private lookupOnPath(): string | null {
        const command = process.platform === "win32" ? "where" : "which";
        try {
            const output = execFileSync(command, ["cloudflared"], {
                encoding: "utf8",
                timeout: VERSION_PROBE_TIMEOUT_MS,
                stdio: ["ignore", "pipe", "ignore"]
            });
            // `where` can return several lines; take the first hit.
            const first = output.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
            return first ?? null;
        } catch {
            return null;
        }
    }

    /** Confirms the candidate really is cloudflared and reports its version. */
    private probeVersion(binaryPath: string): Promise<string | null> {
        return new Promise((resolve) => {
            execFile(
                binaryPath,
                ["--version"],
                { timeout: VERSION_PROBE_TIMEOUT_MS },
                (error, stdout) => {
                    if (error) {
                        resolve(null);
                        return;
                    }
                    const text = stdout.toString().trim();
                    resolve(text.toLowerCase().includes("cloudflared") ? text : null);
                }
            );
        });
    }

    /**
     * Streams a URL to disk while hashing it, following redirects within the
     * allowed GitHub hosts only. Returns the SHA-256 of what was written.
     */
    private downloadToFile(
        url: string,
        destination: string,
        expectedSize: number,
        onProgress?: (progress: DownloadProgress) => void,
        redirectsLeft: number = MAX_REDIRECTS
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const target = new URL(url);

            if (target.protocol !== "https:") {
                reject(new Error(`Refusing to download over ${target.protocol} — https is required.`));
                return;
            }

            if (!this.isAllowedHost(target.hostname)) {
                reject(new Error(`Refusing to download from unexpected host ${target.hostname}.`));
                return;
            }

            const request = https.get(target, (response) => {
                const status = response.statusCode ?? 0;

                if (status >= 300 && status < 400 && response.headers.location) {
                    response.resume(); // Drain so the socket can be reused.

                    if (redirectsLeft <= 0) {
                        reject(new Error("Too many redirects while downloading cloudflared."));
                        return;
                    }

                    const next = new URL(response.headers.location, target).toString();
                    resolve(
                        this.downloadToFile(next, destination, expectedSize, onProgress, redirectsLeft - 1)
                    );
                    return;
                }

                if (status !== 200) {
                    response.resume();
                    reject(new Error(`Download failed with HTTP ${status} for ${target.href}`));
                    return;
                }

                const hash = createHash("sha256");
                const file = fs.createWriteStream(destination);
                let received = 0;

                const fail = (error: Error) => {
                    response.destroy();
                    file.destroy();
                    reject(error);
                };

                response.on("data", (chunk: Buffer) => {
                    hash.update(chunk);
                    received += chunk.length;
                    onProgress?.({ receivedBytes: received, totalBytes: expectedSize });
                });

                response.on("error", fail);
                file.on("error", fail);

                response.pipe(file);

                file.on("finish", () => {
                    file.close(() => resolve(hash.digest("hex")));
                });
            });

            request.on("error", reject);
            request.end();
        });
    }

    private isAllowedHost(hostname: string): boolean {
        const host = hostname.toLowerCase();
        return ALLOWED_DOWNLOAD_HOSTS.some(
            (allowed) => host === allowed || host.endsWith(`.${allowed}`)
        );
    }

    /**
     * macOS assets are gzipped tarballs containing a single `cloudflared`.
     * Extraction runs after the checksum on the archive has already passed.
     */
    private extractBinaryFromArchive(archivePath: string, installPath: string, workDir: string) {
        execFileSync("tar", ["-xzf", archivePath, "-C", workDir], {
            timeout: 60000,
            stdio: ["ignore", "ignore", "pipe"]
        });

        const extracted = path.join(workDir, "cloudflared");
        if (!this.isFile(extracted)) {
            throw new Error("The cloudflared archive did not contain the expected binary.");
        }

        fs.renameSync(extracted, installPath);
    }

    /** Per-user cache location, following each platform's convention. */
    private cacheRoot(): string {
        if (process.platform === "win32") {
            const localAppData = process.env.LOCALAPPDATA;
            if (localAppData) return path.join(localAppData, "note-wormhole");
        } else if (process.platform === "darwin") {
            return path.join(os.homedir(), "Library", "Caches", "note-wormhole");
        } else {
            const xdgCache = process.env.XDG_CACHE_HOME;
            if (xdgCache) return path.join(xdgCache, "note-wormhole");
            return path.join(os.homedir(), ".cache", "note-wormhole");
        }

        return path.join(os.homedir(), ".note-wormhole");
    }

    private isFile(candidate: string): boolean {
        try {
            return fs.statSync(candidate).isFile();
        } catch {
            return false;
        }
    }

    private removeQuietly(target: string) {
        try {
            fs.rmSync(target, { force: true });
        } catch {
            // Nothing to clean up.
        }
    }
}
