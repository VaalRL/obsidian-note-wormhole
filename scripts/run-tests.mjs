/**
 * Test runner.
 *
 * The tests are TypeScript and the sources are too, so they are bundled with the
 * esbuild that already builds the plugin (no extra dependency, no ts-node) and
 * handed to Node's built-in test runner.
 *
 * Only the platform-independent, Obsidian-independent parts of the plugin are
 * covered here: the pinned cloudflared release table, the local HTTP server, and
 * the tunnel URL parsing. Anything that needs Obsidian's own API (the renderer,
 * the settings tab, the tab header) is verified in a real vault instead — see
 * docs/SUBMISSION.md.
 */

import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "fs";
import path from "path";
import esbuild from "esbuild";

const TESTS_DIR = "tests";
const OUT_DIR = "test-build";

if (!existsSync(TESTS_DIR)) {
    console.error(`No ${TESTS_DIR}/ directory found.`);
    process.exit(1);
}

const entryPoints = readdirSync(TESTS_DIR)
    .filter((file) => file.endsWith(".test.ts"))
    .map((file) => path.join(TESTS_DIR, file));

if (entryPoints.length === 0) {
    console.error(`No *.test.ts files in ${TESTS_DIR}/.`);
    process.exit(1);
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

await esbuild.build({
    entryPoints,
    outdir: OUT_DIR,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node18",
    // Obsidian is only ever a type import in the modules under test; keep it
    // external so a stray runtime import fails loudly instead of being inlined.
    external: ["obsidian"],
    sourcemap: "inline",
    logLevel: "warning"
});

// Pass the compiled files explicitly: handing `--test` a bare directory makes
// Node try to load the directory itself as a module.
const compiled = entryPoints.map((entry) =>
    path.join(OUT_DIR, path.basename(entry).replace(/\.ts$/, ".js"))
);

const result = spawnSync(process.execPath, ["--test", ...compiled], { stdio: "inherit" });

process.exit(result.status ?? 1);
