import { readFileSync, writeFileSync } from "fs";

// npm version writes the new version into package.json before running this
// script, so we read it back out and mirror it into the Obsidian metadata.
const targetVersion = process.env.npm_package_version;

if (!targetVersion) {
	throw new Error(
		"npm_package_version is not set. Run this through `npm version <patch|minor|major>`."
	);
}

// Keep manifest.json in sync with package.json.
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t") + "\n");

// Record which Obsidian version this plugin release requires, so older Obsidian
// installs are offered the newest release they can actually run.
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t") + "\n");
