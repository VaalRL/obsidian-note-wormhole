import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFile, execFileSync } from "child_process";

/**
 * CloudflaredBinaryService
 *
 * Finds the cloudflared the user installed, and nothing else.
 *
 * Note Wormhole deliberately does not download or install it. Obsidian's
 * developer policies forbid a plugin from installing "themselves or their
 * dependencies", and every comparable plugin in the community directory
 * (pandoc, ffmpeg, git) runs a binary the user provided. See
 * cloudflaredInstall.ts for the guidance shown when none is found.
 *
 * This is the one place in the plugin that touches `fs`/`os`/`child_process`,
 * and the one place it reads anything outside the vault. That is unavoidable
 * here - the whole feature is "run a specific executable" - and it is why the
 * plugin is marked isDesktopOnly.
 */

export interface ResolvedBinary {
    /** Absolute path of the binary that will be run. */
    path: string;
    /** Version string reported by the binary, when it could be read. */
    version?: string;
}

const VERSION_PROBE_TIMEOUT_MS = 5000;

export class CloudflaredBinaryService {
    /**
     * Returns the cloudflared this machine will use, or null if there is none.
     *
     * Re-run on every share rather than cached, so installing cloudflared takes
     * effect immediately without restarting Obsidian.
     */
    async findExisting(): Promise<ResolvedBinary | null> {
        for (const candidate of this.systemCandidates()) {
            if (!this.isFile(candidate)) continue;

            const version = await this.probeVersion(candidate);
            if (version) {
                return { path: candidate, version };
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
            const localAppData = process.env.LOCALAPPDATA;

            if (programFiles) candidates.push(path.join(programFiles, "cloudflared", "cloudflared.exe"));
            if (programFilesX86) candidates.push(path.join(programFilesX86, "cloudflared", "cloudflared.exe"));
            if (localAppData) {
                // Obsidian inherits the PATH it was started with, so a cloudflared
                // installed while Obsidian is running will not be on it until the
                // app restarts. Checking where winget and user-scope installers
                // actually put things means "install it, then share" just works.
                candidates.push(
                    path.join(localAppData, "Microsoft", "WinGet", "Links", "cloudflared.exe"),
                    path.join(localAppData, "Programs", "cloudflared", "cloudflared.exe")
                );
            }
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

    /**
     * Confirms the candidate really is cloudflared and reports its version.
     *
     * The check matters: something else called "cloudflared" on PATH should not
     * be spawned just because the name matched.
     */
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

    private isFile(candidate: string): boolean {
        try {
            return fs.statSync(candidate).isFile();
        } catch {
            return false;
        }
    }
}
