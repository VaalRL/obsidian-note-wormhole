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
| `author` / `authorUrl` / LICENSE all name the same handle, and `authorUrl` is the author's page rather than this repo | ✅ |
| `fundingUrl` in manifest; the settings tab links support as text, not a remote banner image | ✅ |
| `versions.json` present | ✅ |
| `version-bump.mjs` present (referenced by `npm version`) | ✅ |
| `LICENSE` in repo root | ✅ |
| `README.md` documents features, requirements, network use, and manual install | ✅ |
| Release workflow attaching `main.js`, `manifest.json`, `styles.css` | ✅ |
| `main.js` not committed (built and attached to releases) | ✅ |
| No secrets or unrelated projects tracked in the repo, or anywhere in its history | ✅ |
| Build is not minified (reviewers must be able to read it) | ✅ |
| ESLint config + `npm run lint` clean | ✅ |
| Automated tests (`npm test`) covering the pinned release table, path control and tunnel URL parsing | ✅ |
| CI runs lint + tests + build on every push, and again before a release is cut | ✅ |
| Sentence case for commands, ribbon tooltip, settings, notices | ✅ |
| No `console.log`; only `console.error` on real failures | ✅ |
| No default hotkeys; command ids contain no plugin id and no "command" | ✅ |
| No inline styles or hardcoded colours in plugin UI — all via `styles.css` and CSS variables | ✅ |
| Icon buttons have `aria-label`, tab indicator is keyboard operable, `:focus-visible` outlines defined | ✅ |
| Tunnel and local server torn down on `onunload` and on tab close | ✅ |
| Tab-header indicators removed on `onunload` (Obsidian does not own that DOM, so it cannot clean it up for us) | ✅ |
| Consent dialog dismissed with Escape or the close button is treated as a refusal, not left pending | ✅ |
| Background timer does no work while nothing is shared | ✅ |
| Prefers a user-installed cloudflared; downloads only as a fallback | ⚠️ see the policy risk below |
| Download is version-pinned and SHA-256 verified, with the URL shown before consent | ✅ |
| No runtime dependencies | ✅ |

## Done on GitHub

| Item | Status |
| --- | --- |
| Repository description set byte-for-byte to the `manifest.json` description (the review bot compares them) | ✅ |
| Issues enabled (required by the review process) | ✅ |

## Manual steps still required

These need a decision or a credential that the repository cannot supply.

> [!important] The submission process changed.
> Plugins are **no longer** submitted by opening a pull request against
> `obsidianmd/obsidian-releases` and editing `community-plugins.json`. That repository is now a
> read-only registry. Submission goes through the Obsidian Community directory at
> [community.obsidian.md](https://community.obsidian.md), and needs an **Obsidian account**
> with a **linked GitHub account** so the directory can verify you own the repository.

1. **Merge this work into the default branch.** ⚠️ *blocking*
   The directory reads `manifest.json` from the **HEAD of the repository's default branch**, so
   `main` must carry the final manifest before submitting. Everything here is currently on
   `submission-prep`.

2. **Decide what to do about the cloudflared download.** ⚠️ *blocking — see below*
   The developer policies forbid a plugin from installing "themselves or their dependencies".
   The download fallback is at risk under that rule.

3. **Make the repository public.** ⚠️ *blocking*
   The review needs access to the source, and users' Obsidian installs fetch the release assets
   from it.

4. **Cut the first release.**
   ```bash
   npm version 1.0.0        # syncs manifest.json + versions.json
   git push --follow-tags
   ```
   The tag must be `1.0.0` — no `v` prefix. The workflow lints, tests, builds, checks that the
   tag matches `manifest.json`, then creates a draft release with `main.js`, `manifest.json`
   and `styles.css` attached as individual files (not a zip). Publish the draft.

   Obsidian downloads those three files from the release whose tag matches the `version` in the
   committed manifest, so the release and the committed manifest have to agree.

5. **Submit at [community.obsidian.md](https://community.obsidian.md).**
   Sign in with an Obsidian account, link the GitHub account that owns the repository, then add
   the plugin. No JSON entry to write by hand any more.

6. **Expect the automated review.** Every submitted version is scanned automatically for code
   quality, security vulnerabilities and malware, and the results appear as a scorecard on the
   plugin's directory page. A new submission must pass before it is listed at all, and a
   published plugin that later fails is removed from search within 24 hours.

## The policy risk worth resolving before submitting

The developer policies list, under **Not allowed**:

> Plugins and themes must not:
> - Install or update themselves or their dependencies.

Note Wormhole downloads and installs `cloudflared` when it cannot find one. That is installing a
dependency, and it is the single most likely reason for this submission to be rejected. The
mitigations already in place — pinned version, SHA-256 verification, HTTPS and GitHub-only
hosts, informed two-stage consent, install outside the vault — make the download *safe*, but
they do not make it *permitted*, and the automated scan sees an executable being fetched at
runtime.

The plugin already prefers a cloudflared the user installed themselves. The lowest-risk path is
to make that the **only** path: detect it, and when it is missing, explain how to install it
(`brew install cloudflared`, `winget install Cloudflare.cloudflared`, the official download
page) instead of fetching it. That costs first-run convenience and removes the policy exposure
entirely. `CloudflaredBinaryService.findExisting()` already does the detection, so this is
deleting a path rather than writing one.

If the download is kept, say so plainly in the submission and be ready for it to be the thing
the review turns on.

## Expect reviewers to ask about

This plugin does two things that get extra scrutiny. Have answers ready for the review thread.

### "It downloads and executes a third-party binary"

This is the highest-risk item in the submission. The mitigations, in the order a reviewer
will want them:

1. **It prefers a binary the user already installed.** `CloudflaredBinaryService.findExisting()`
   searches `PATH` and the standard install locations, and confirms the candidate by running
   `--version`. If one is found, nothing is downloaded — the same trust model as Obsidian Git
   using the system `git`.
2. **A download is pinned, never "latest".** The version, asset name, SHA-256 and size live in
   `src/services/cloudflaredReleases.ts`. `scripts/update-cloudflared.mjs` regenerates that
   table by downloading and hashing the real assets, so checksums are never hand-written.
3. **The checksum is enforced.** The stream is hashed during download; on mismatch the staging
   file is deleted and nothing is installed. Verified by test — see below.
4. **Transport is constrained.** HTTPS only, redirects followed only within `github.com` and
   `githubusercontent.com`.
5. **Consent is informed and granular.** `BinaryInstallationModal` shows the exact URL, version,
   SHA-256, size and install path before anything is fetched. Agreeing to run a
   user-installed binary and agreeing to a download are tracked as two separate settings, so
   losing the system binary re-prompts instead of silently downloading.
6. **The install location is sane.** A per-user cache directory — not the vault (which would
   sync a 40 MB executable) and not the world-writable OS temp directory.

Worth stating plainly: the plugin previously delegated all of this to `untun`, which hardcoded
its binary into `os.tmpdir()`, performed no checksum verification at all, pinned cloudflared
2023.10.0, sent Apple Silicon to the Rosetta build, and registered process-wide
SIGINT/SIGUSR handlers on every tunnel start without removing them. That dependency has been
removed; the plugin now has **no runtime dependencies**.

### "Use `Platform` from the API instead of `process.platform`"

A fair question, and the usual answer ("it breaks on mobile") does not apply here —
the plugin is `isDesktopOnly: true` and cannot load on mobile at all.

`Platform` exposes `isDesktop`, `isMacOS`, `isWin`, `isLinux`, but **not the CPU
architecture**, and picking a cloudflared asset needs both: `darwin-arm64` and
`darwin-x64` are different downloads with different checksums. `process.arch` is the
only source for that, so the asset table is keyed on `${process.platform}-${process.arch}`
and the surrounding code stays consistent with it rather than mixing two platform APIs.

`resolveAsset(platform, arch)` takes both as parameters precisely so the mapping is
testable without pretending to be another machine — see `tests/cloudflaredReleases.test.ts`.

### "It exposes vault content to the public internet"

Point to the loopback-only bind, the root-path-only handler, in-memory rendering, the response
headers (CSP, `no-store`, `noindex`, `no-referrer`), and the teardown paths in
`WormholeManager.unload()` / `LocalServerService.stop()` / `TunnelService.stop()`.

## What has been verified, and how

### Automated (`npm test`, 23 assertions, no network)

| Behaviour | Covered by |
| --- | --- |
| Pinned release table: every platform present, 64-char hex checksums, plausible sizes, archive flag matches the asset name | `tests/cloudflaredReleases.test.ts` |
| Windows on ARM maps to the x64 asset *and its checksum*, and is flagged emulated | same |
| Unsupported platform returns null rather than guessing an asset | same |
| Every download URL is HTTPS and inside `ALLOWED_DOWNLOAD_HOSTS`; lookalike hosts (`github.com.evil.test`) are not | same |
| Root path serves the note from memory; CSP / `no-store` / `nosniff` / `noindex` / `no-referrer` all present | `tests/localServer.test.ts` |
| **S-03 path control**: `/secret`, `/../main.ts`, `/favicon.ico` all 404 and leak no body | same |
| Heartbeat returns 204 with no CORS grant; counts one viewer per id; ignores a missing id | same |
| **F-05**: after `stop()` the port refuses connections and the viewer list is cleared | same |
| Tunnel URL parsed from cloudflared's boxed output, including a URL split across stream chunks | `tests/tunnelUrl.test.ts` |
| The bare `trycloudflare.com` domain in the request log is not mistaken for the tunnel URL | same |

### Manual, against the real cloudflared release on Linux x64:

| Behaviour | Result |
| --- | --- |
| Detection when no cloudflared is present | Returns none, offers a download plan |
| Download plan contents (URL, version, SHA-256, install path) | Correct and complete |
| Download + checksum match + install + chmod | Installed and executable |
| **Checksum mismatch is rejected** | Throws; no binary installed; no staging file left |
| Local server serves the note, sends CSP | HTTP 200, header present |
| Path control (`/secret`) | HTTP 404 |
| Tunnel URL parsed from cloudflared output, incl. split across chunks | Parsed correctly |
| `stop()` awaits real process exit; port refuses afterwards | Confirmed, no orphan processes |
| `update-cloudflared` reproduces the committed table byte-for-byte | Confirmed |

Additionally verified inside a real Obsidian 1.9.14 desktop install (headless, driven over
the Electron debugging protocol), with the plugin loaded from a vault:

| Behaviour | Result |
| --- | --- |
| Plugin loads; ribbon, status bar and commands register | Confirmed |
| Welcome modal appears on first run only, after layout is ready | Confirmed |
| Command palette shows both commands in sentence case | Confirmed |
| Launcher lists open tabs and flags live ones | Confirmed |
| Settings tab resolves and reports the cloudflared status | Confirmed |
| Consent dialog shows the real URL, version, SHA-256, size and install path | Confirmed |
| Shared page renders through the real renderer and local server | Confirmed |
| Theme mode drives the visitor's colour scheme | Confirmed, light and dark |
| Anti-copy mode blocks a drag-selection | Confirmed: 75 chars selected without it, 0 with |

Three defects were found by looking at those screenshots that neither the typechecker nor
the linter could catch, and all three are fixed in this branch:

1. The settings description ran underneath the "Reset permission" button. Paths and URLs now
   sit in a full-width block below the row.
2. `MarkdownRenderer.render` injects Obsidian's own "copy code" button into rendered output,
   and it was being shipped to visitors as a dead control — actively contradictory next to
   anti-copy mode. Editor-only affordances are now stripped before serving.
3. The launcher showed the file extension in the title and repeated the file name as its
   subtitle for notes at the vault root.

A later review pass found four more that the typechecker, the linter and the screenshots all
missed, fixed in this branch as well:

4. **Dismissing the cloudflared consent dialog with Escape or the window close button left
   `startSharing()` awaiting a promise that could never settle** — the share hung silently and
   forever. Only the Cancel and Agree buttons resolved it. `onClose()` now reports an
   undecided dismissal as a refusal.
5. **Tab-header indicators survived `onunload`.** Obsidian owns that DOM and does not clean up
   an injected child, and the plugin's own event handlers are gone by then, so disabling the
   plugin while sharing left a dead green dot in the tab. `TabHeaderDecorator.removeAll()` now
   runs from `onunload`.
6. **The 3-second refresh timer walked every open leaf forever, even with nothing shared.**
   It now returns immediately when the session count is zero.
7. **The floating panel rebuilt its entire DOM every 3 seconds**, which would drop keyboard
   focus from a button mid-interaction. It now patches the viewer count and lock state in
   place, and only when the value actually changed.

## Verified against a real tunnel

The gap recorded here previously — that no live tunnel had ever been established, so none of
the UI that only exists during a session had been seen — is now closed. Driven against a real
Obsidian 1.9 desktop install on Windows 11, with a genuine Cloudflare quick tunnel:

| Behaviour | Result |
| --- | --- |
| Consent dialog, "existing binary" variant | Shown with the real path and version |
| Quick tunnel established | `https://<random>.trycloudflare.com` assigned and reachable |
| Notice on success, link copied to clipboard | Confirmed |
| Floating control panel, positioned and styled | Confirmed |
| Status bar switches to "Wormhole active" | Confirmed |
| **Tab-header indicator** | **Was broken — see below. Fixed and re-verified.** |
| Tab-header context menu | All four items present, in sentence case |
| **Live viewer count** | Confirmed with a real browser on the public URL: tab label `Wormhole active (1 viewer)`, overlay `🟢 Live • 1 viewer` |
| **Anti-copy actually blocks selection** | Measured on the live page with a real mouse drag: **82 characters selected with it off, 0 with it on** |
| Theme mode follows the visitor's `prefers-color-scheme` | Confirmed, light and dark, against the public URL |
| Stopping a session | Indicator, overlay and session all gone; `Wormhole closed.` notice shown |
| **The link really dies** | Fetching the URL after stopping returns HTTP 502 from Cloudflare's edge — the origin is gone |
| Pinned SHA-256 matches the real Cloudflare asset | Confirmed by independent download: byte count and digest both match `cloudflaredReleases.ts` |

Note for anyone quoting the old PRD: a stopped tunnel answers **502**, not 404. The 404 in
`req.md` §2.1 describes the intent, not what Cloudflare's edge returns once the origin is gone.
The README does not claim 404 for a dead link.

### The eighth defect: the tab indicator never rendered

`TabHeaderDecorator.decorateLeaf` gated everything on `leaf.tabHeaderInnerEl`. That property
does not exist on current Obsidian — the tab header exposes `tabHeaderEl`,
`tabHeaderInnerIconEl`, `tabHeaderInnerTitleEl` and `tabHeaderStatusContainerEl` instead. The
guard was therefore never satisfied and **F-08 was dead: no indicator was ever drawn**, on any
tab, in any version this could have shipped to.

Nothing caught it. It typechecks (the property was declared in `src/types/index.ts`), it lints,
and it fails silently rather than throwing. It only becomes visible with a live session in
front of you, which is exactly what had never been done.

The indicator now mounts into `tabHeaderStatusContainerEl` — Obsidian's own per-tab status
area, alongside its pin and link indicators — falling back to the title's parent row on builds
that lack it. `src/types/index.ts` now declares only properties that actually exist.

**Still not verified:** the viewer count with more than one reader attached at once (it was
exercised with a single real reader), and behaviour on macOS and Linux — everything above was
run on Windows 11, so the `.tgz` extraction path for macOS assets has not been executed against
a real download.

### How the recordings were made

The README's GIFs are real UI, captured by driving Obsidian over the Electron remote debugging
protocol: an isolated `--user-data-dir`, a throwaway vault, a real quick tunnel, and one
screenshot per UI state rather than a screencast, so each state can be held long enough to read.
The mouse cursor in them is drawn on afterwards — screenshots taken this way contain no pointer.

One thing worth knowing if this is ever repeated: Obsidian routes modals and notices through its
own `activeWindow` / `activeDocument` globals for pop-out support, and updates them from focus
events. While the window is unfocused they point elsewhere, so anything opened lands in a
document you are not looking at and **silently never appears** — no error, no exception. Focus
emulation fixes it, but only if it is enabled *after* the app has finished loading, because the
one focus transition it generates has to be heard by a listener that exists by then.

## Known limitations worth stating up front

- Anti-copy mode is a deterrent, not a security control — the text is in the page source.
- Anyone holding the URL can read the note while the session is open; there is no auth.
- The plugin uses two undocumented Obsidian internals (`WorkspaceLeaf.tabHeaderInnerEl` and
  friends, declared in `src/types/index.ts`) to draw the tab-header indicator. These can
  break on an Obsidian update; the code degrades gracefully if the properties are missing.
