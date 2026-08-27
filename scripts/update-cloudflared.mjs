/**
 * Regenerates src/services/cloudflaredReleases.ts for a given cloudflared version.
 *
 * Downloads every release asset, hashes it, and rewrites the checksum table from
 * what was actually downloaded. Checksums must never be written by hand.
 *
 *   npm run update-cloudflared -- 2026.8.2
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import https from "node:https";

const TARGET_FILE = new URL("../src/services/cloudflaredReleases.ts", import.meta.url);

/** platform-arch key -> release asset name. */
const ASSET_NAMES = {
	"linux-x64": "cloudflared-linux-amd64",
	"linux-arm64": "cloudflared-linux-arm64",
	"linux-arm": "cloudflared-linux-arm",
	"linux-ia32": "cloudflared-linux-386",
	"darwin-x64": "cloudflared-darwin-amd64.tgz",
	"darwin-arm64": "cloudflared-darwin-arm64.tgz",
	"win32-x64": "cloudflared-windows-amd64.exe",
	"win32-ia32": "cloudflared-windows-386.exe",
	// No native windows-arm64 build exists; x64 runs under emulation.
	"win32-arm64": "cloudflared-windows-amd64.exe"
};

const EMULATED_KEYS = new Set(["win32-arm64"]);

const version = process.argv[2];
if (!version) {
	console.error("Usage: npm run update-cloudflared -- <version>   (e.g. 2026.8.2)");
	process.exit(1);
}

/** Streams a URL, following redirects, and returns { sha256, size }. */
function hashRemote(url, redirectsLeft = 5) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (response) => {
				const status = response.statusCode ?? 0;

				if (status >= 300 && status < 400 && response.headers.location) {
					response.resume();
					if (redirectsLeft <= 0) {
						reject(new Error(`Too many redirects for ${url}`));
						return;
					}
					resolve(hashRemote(new URL(response.headers.location, url).toString(), redirectsLeft - 1));
					return;
				}

				if (status !== 200) {
					response.resume();
					reject(new Error(`HTTP ${status} for ${url}`));
					return;
				}

				const hash = createHash("sha256");
				let size = 0;

				response.on("data", (chunk) => {
					hash.update(chunk);
					size += chunk.length;
				});
				response.on("error", reject);
				response.on("end", () => resolve({ sha256: hash.digest("hex"), size }));
			})
			.on("error", reject);
	});
}

const base = `https://github.com/cloudflare/cloudflared/releases/download/${version}/`;

// Hash each distinct asset once, even when two keys share one.
const cache = new Map();
const entries = [];

for (const [key, assetName] of Object.entries(ASSET_NAMES)) {
	if (!cache.has(assetName)) {
		process.stdout.write(`hashing ${assetName} ... `);
		cache.set(assetName, await hashRemote(base + assetName));
		console.log(cache.get(assetName).sha256);
	}

	const { sha256, size } = cache.get(assetName);
	entries.push({
		key,
		assetName,
		sha256,
		size,
		archive: assetName.endsWith(".tgz"),
		emulated: EMULATED_KEYS.has(key)
	});
}

const source = await readFile(TARGET_FILE, "utf8");

const VERSION_PATTERN = /export const CLOUDFLARED_VERSION = "[^"]+";/;
const TABLE_PATTERN = /const ASSETS: Record<string, CloudflaredAsset> = \{[\s\S]*?\n\};/;

// Fail on a format drift, not on "already up to date" — a no-op rewrite is a
// legitimate result when re-running for the version already pinned.
for (const [name, pattern] of [["version", VERSION_PATTERN], ["ASSETS table", TABLE_PATTERN]]) {
	if (!pattern.test(source)) {
		console.error(`Could not find the ${name} in cloudflaredReleases.ts — the format has drifted from this script.`);
		process.exit(1);
	}
}

const table = entries
	.map(({ key, assetName, sha256, size, archive, emulated }) => {
		const lines = [
			`    "${key}": {`,
			`        assetName: "${assetName}",`,
			`        sha256: "${sha256}",`,
			`        size: ${size},`,
			`        archive: ${archive}`
		];
		if (emulated) {
			lines[lines.length - 1] += ",";
			lines.push(`        emulated: true`);
		}
		lines.push("    }");
		return lines.join("\n");
	})
	.join(",\n");

const updated = source
	.replace(VERSION_PATTERN, `export const CLOUDFLARED_VERSION = "${version}";`)
	.replace(TABLE_PATTERN, `const ASSETS: Record<string, CloudflaredAsset> = {\n${table}\n};`);

if (updated === source) {
	console.log(`\ncloudflaredReleases.ts is already up to date for ${version}.`);
} else {
	await writeFile(TARGET_FILE, updated);
	console.log(`\nUpdated cloudflaredReleases.ts to ${version}.`);
}
