# Obsidian community plugin submission checklist

Tracking document for getting **Note Wormhole** into the official community plugin list.

## Done in the repo

| Item | Status |
| --- | --- |
| `manifest.json` in repo root, id `note-wormhole` (lowercase, no "obsidian", not ending in "plugin") | ✅ |
| Plugin name has no "Obsidian" / "Plugin" suffix | ✅ |
| Description has no "Obsidian", does not start with "This plugin", ends with punctuation, < 250 chars | ✅ |
| `minAppVersion` matches the APIs actually used (`MarkdownRenderer.render`, `Modal.setTitle` → 1.5.0) | ✅ |
| `isDesktopOnly: true` (uses `node:http` and a child process) | ✅ |
| `authorUrl` points at a real URL | ✅ |
| `fundingUrl` in manifest instead of a donate image in the settings tab | ✅ |
| `versions.json` present | ✅ |
| `version-bump.mjs` present (referenced by `npm version`) | ✅ |
| `LICENSE` in repo root | ✅ |
| `README.md` documents features, requirements, network use, and manual install | ✅ |
| Release workflow attaching `main.js`, `manifest.json`, `styles.css` | ✅ |
| `main.js` not committed (built and attached to releases) | ✅ |
| No secrets or unrelated projects tracked in the repo | ✅ |
| Build is not minified (reviewers must be able to read it) | ✅ |
| ESLint config + `npm run lint` clean | ✅ |
| Sentence case for commands, ribbon tooltip, settings, notices | ✅ |
| No `console.log`; only `console.error` on real failures | ✅ |
| No default hotkeys; command ids contain no plugin id and no "command" | ✅ |
| No inline styles or hardcoded colours in plugin UI — all via `styles.css` and CSS variables | ✅ |
| Icon buttons have `aria-label`, tab indicator is keyboard operable, `:focus-visible` outlines defined | ✅ |
| Tunnel and local server torn down on `onunload` and on tab close | ✅ |
| Binary download requires explicit user consent, revocable in settings | ✅ |

## Manual steps still required

These cannot be done from the repository itself.

1. **Rotate the leaked Local REST API credentials.**
   A previous commit tracked `Note Wormhole/.obsidian/plugins/obsidian-local-rest-api/data.json`,
   which contained a plaintext `apiKey` and a TLS certificate + private key. The files are
   no longer tracked, but they remain in git history.
   - Regenerate the API key in the Local REST API plugin settings.
   - If the repository was ever public, treat the certificate as compromised and regenerate it.
   - Optionally scrub history with `git filter-repo --path "Note Wormhole" --invert-paths`
     (this rewrites history and requires a force push).

2. **Set the GitHub repository description** to exactly:
   ```
   Instantly share your notes via a secure, temporary, local wormhole. No cloud upload.
   ```
   Obsidian's review bot compares it byte-for-byte with `manifest.json`.

3. **Enable GitHub Issues** on the repository (required by the review process).

4. **Cut the first release.**
   ```bash
   npm version 1.0.0        # syncs manifest.json + versions.json
   git push --follow-tags
   ```
   The tag must be `1.0.0` — no `v` prefix. The workflow creates a draft release with
   `main.js`, `manifest.json`, and `styles.css` attached as individual files (not a zip).
   Publish the draft.

5. **Open the submission PR** against
   [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases),
   adding this entry to the **end** of `community-plugins.json`:
   ```json
   {
     "id": "note-wormhole",
     "name": "Note Wormhole",
     "author": "Antigravity",
     "description": "Instantly share your notes via a secure, temporary, local wormhole. No cloud upload.",
     "repo": "VaalRL/obsidian-note-wormhole"
   }
   ```

## Expect reviewers to ask about

This plugin does two things that get extra scrutiny. Have answers ready in the PR thread.

- **It downloads and executes a third-party binary.** `untun` fetches `cloudflared` from
  Cloudflare's GitHub releases and runs it as a child process. Point to
  `BinaryInstallationModal` (explicit opt-in before any download), the settings toggle that
  revokes consent, and the "Network use" section of the README.
- **It exposes vault content to the public internet.** Point to the loopback-only bind, the
  root-path-only handler, in-memory rendering, and the teardown paths in
  `WormholeManager.unload()` / `LocalServerService.stop()`.

## Known limitations worth stating up front

- Anti-copy mode is a deterrent, not a security control — the text is in the page source.
- Anyone holding the URL can read the note while the session is open; there is no auth.
- The plugin uses two undocumented Obsidian internals (`WorkspaceLeaf.tabHeaderInnerEl` and
  friends, declared in `src/types/index.ts`) to draw the tab-header indicator. These can
  break on an Obsidian update; the code degrades gracefully if the properties are missing.
