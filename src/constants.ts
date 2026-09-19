/**
 * Single source of truth for the project's outward-facing URLs.
 *
 * SUPPORT_URL is duplicated in manifest.json (`fundingUrl`, which is what
 * Obsidian's own support button uses) and in README.md. Those two cannot import
 * from here, so if this value changes, change it in all three places.
 */

export const SUPPORT_URL = 'https://www.buymeacoffee.com/whoami885';

export const REPO_URL = 'https://github.com/VaalRL/obsidian-note-wormhole';
