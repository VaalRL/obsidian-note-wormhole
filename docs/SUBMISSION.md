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
| Runs only a user-installed cloudflared; never downloads or installs it | ✅ |
| README discloses network use, and the files read outside the vault | ✅ |
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

2. **Make the repository public.** ⚠️ *blocking*
   The review needs access to the source, and users' Obsidian installs fetch the release assets
   from it.

3. **Cut the first release.**
   ```bash
   npm version 1.0.0 --allow-same-version   # syncs manifest.json + versions.json, tags
   git push --follow-tags
   ```
   `--allow-same-version` is needed for 1.0.0 only, because package.json already carries it;
   later releases are a plain `npm version patch|minor|major`.

   The tag must be `1.0.0` — **no `v` prefix**. npm tags as `v<version>` by default, which the
   directory rejects, so `.npmrc` in the repo root sets `tag-version-prefix=""`. The release
   workflow re-checks the tag against `manifest.json` and fails the build rather than publish a
   mismatched release. The workflow lints, tests, builds, checks that the
   tag matches `manifest.json`, then creates a draft release with `main.js`, `manifest.json`
   and `styles.css` attached as individual files (not a zip). Publish the draft.

   Obsidian downloads those three files from the release whose tag matches the `version` in the
   committed manifest, so the release and the committed manifest have to agree.

4. **Submit at [community.obsidian.md](https://community.obsidian.md).**
   Sign in with an Obsidian account, link the GitHub account that owns the repository, then add
   the plugin. No JSON entry to write by hand any more.

5. **Expect the automated review.** Every submitted version is scanned automatically for code
   quality, security vulnerabilities and malware, and the results appear as a scorecard on the
   plugin's directory page. A new submission must pass before it is listed at all, and a
   published plugin that later fails is removed from search within 24 hours.

## The dependency policy, and how it was resolved

The developer policies list, under **Not allowed**:

> Plugins and themes must not:
> - Install or update themselves or their dependencies.

Note Wormhole used to download and install `cloudflared` when it could not find one. That is
installing a dependency, and it was the most likely reason for this submission to be rejected.
The pinning, checksum verification, host allowlist and staged consent made that download *safe*;
they did not make it *permitted*.

**The download has been removed.** The plugin now only runs a `cloudflared` the user installed,
which is what every comparable plugin in the directory does. When there is none it says so and
shows the install command for the platform, and the search re-runs on the next attempt so no
restart is needed.

What went with it: the pinned release table, the SHA-256 verification, the HTTPS/GitHub host
allowlist, the archive extraction, the per-user cache directory, `scripts/update-cloudflared.mjs`,
and the second consent flag. All of it existed to make a download defensible; none of it is
needed to not download. The bundle lost about 12% of its size.

What stayed: the plugin still *runs* an external binary and still relays note content through
Cloudflare. Both are disclosed in the README, the second behind an explicit first-run
confirmation.

## Precedent in the directory

Checked against `community-plugins.json` (7,808 published plugins) and, where the answer
depended on timing, against that file's own history.

### Running a local HTTP server over the vault — settled, abundant precedent

| Plugin | What it does |
| --- | --- |
| `obsidian-local-rest-api` | Full read/write REST API over HTTPS on localhost |
| `html-server` | Serves the vault over HTTP; its README tells users to reach it from other devices by IP, and recommends **ngrok** to "share your vault openly with someone outside of your local network" |
| `note-api`, `browser-note` | "Expose a localhost HTTP API (API-key protected) to view, create, edit and delete" |
| `live-preview`, `termux-bridge` | Local HTTP server; `termux-bridge` executes shell commands through it |

Note Wormhole binds to `127.0.0.1` only, which is stricter than `html-server`, and serves one
note read-only rather than the whole vault.

### Running an external binary — abundant precedent, always one the user installed

| Plugin | How it gets the binary |
| --- | --- |
| `obsidian-pandoc` | User installs pandoc |
| `obsidian-enhancing-export` | "First install the latest `pandoc`... then add `pandoc` path to environment variable `PATH` or set absolute path... in the plugin setting view" |
| `obsidian-ffmpeg-converter` | "You must install FFmpeg first... add the `bin` folder of FFmpeg to your environment variables" |
| `obsidian-git`, `openterm` | System `git` / system shell |

This is the sanctioned shape, and it is what `CloudflaredBinaryService.findExisting()` already
implements.

### Downloading an executable at runtime — exactly one precedent, and it is nuanced

`jacksteamdev/obsidian-mcp-tools` downloaded a platform-specific signed binary into
`{vault}/.obsidian/plugins/obsidian-mcp-tools/bin/`, with SLSA provenance attestations and
documented verification steps.

It **was listed and stayed listed for at least a year**. From the registry's own history:

| Registry snapshot | Listed? |
| --- | --- |
| 2025-06-01 | yes |
| 2025-12-01 | yes |
| 2026-02-01 | yes |
| 2026-04-01 | yes |
| 2026-05-01 | yes |
| 2026-05-20 | **gone** |

Its author archived the repository on 2026-05-13, saying several alternatives now exist. The
delisting window matches that archival, so this reads as the author withdrawing it rather than
Obsidian enforcing the dependency policy against it.

Three caveats before leaning on this precedent:

- It was approved under the older pull-request review, before the automated scanning and
  scorecards described above went live.
- It shipped **signed** binaries with SLSA attestation.
- It installed into the vault.

None of that applies here any more: this plugin downloads nothing at all, which is a stricter
position than the precedent needed to defend.

There is no *currently listed* plugin that downloads an executable, so the precedent cannot be
pointed at as a live example.

### Publishing notes publicly — common, but nobody tunnels

Around 35 listed plugins publish or share notes to the web (`flowershow`, `orion-publish`,
`jotbird` — "publish notes as shareable web pages with one click, no account required" —
`share-hosted`, and others). They all upload to a hosted service. The closest thing to a direct
device-to-device model is `peer-share`, which uses WebRTC with a signalling server that "only
handles peer discovery".

Serving from the user's own machine through a tunnel appears to be new to the directory. That is
not a precedent against it; it means there is no precedent either way, so the README's network
disclosure carries the weight.

## Expect reviewers to ask about

This plugin does two things that get extra scrutiny. Have answers ready for the review thread.

### "It runs a third-party binary"

It runs `cloudflared`, and only a copy the user installed. It never downloads, installs or
updates it. `CloudflaredBinaryService.findExisting()` searches `PATH` and the standard install
locations, and confirms a candidate by running `--version` before spawning it, so something else
named `cloudflared` on `PATH` is not executed just because the name matched. The trust model is
the same as obsidian-pandoc with `pandoc`, or Obsidian Git with the system `git`.

When none is found, the plugin stops and shows the install command for the platform. There is no
fallback that fetches anything.

### "Use `Platform` from the API instead of `process.platform`"

A fair question, and the usual answer ("it breaks on mobile") does not apply here —
the plugin is `isDesktopOnly: true` and cannot load on mobile at all.

`process.platform` is used to pick where to look for the binary, which shell lookup command to
run (`where` versus `which`), and which install instructions to show. `Platform` from the API
could cover the first and third, but not the second, and mixing two platform APIs in one file
reads worse than using one consistently.

Every function that branches on it takes the platform as a parameter with `process.platform` only
as the default, so the behaviour is testable for all platforms from one machine — see
`tests/cloudflaredInstall.test.ts`.

### "It exposes vault content to the public internet"

Point to the loopback-only bind, the root-path-only handler, in-memory rendering, the response
headers (CSP, `no-store`, `noindex`, `no-referrer`), and the teardown paths in
`WormholeManager.unload()` / `LocalServerService.stop()` / `TunnelService.stop()`.

## What has been verified, and how

### Automated (`npm test`, 23 assertions, no network)

| Behaviour | Covered by |
| --- | --- |
| Install guidance exists on every platform, including unknown ones, and every method tells the user something to do | `tests/cloudflaredInstall.test.ts` |
| Every URL shown is HTTPS and points at Cloudflare's own site or `github.com/cloudflare/cloudflared` | same |
| The documented package-manager command per platform, and no command that installs anything other than cloudflared | same |
| The "looked in" text names `PATH` on every platform | same |
| Root path serves the note from memory; CSP / `no-store` / `nosniff` / `noindex` / `no-referrer` all present | `tests/localServer.test.ts` |
| **S-03 path control**: `/secret`, `/../main.ts`, `/favicon.ico` all 404 and leak no body | same |
| Heartbeat returns 204 with no CORS grant; counts one viewer per id; ignores a missing id | same |
| **F-05**: after `stop()` the port refuses connections and the viewer list is cleared | same |
| Tunnel URL parsed from cloudflared's boxed output, including a URL split across stream chunks | `tests/tunnelUrl.test.ts` |
| The bare `trycloudflare.com` domain in the request log is not mistaken for the tunnel URL | same |

### Manual, against the real cloudflared release on Linux x64:

| Behaviour | Result |
| --- | --- |
| Detection when no cloudflared is present | Returns none; install instructions shown |
| Local server serves the note, sends CSP | HTTP 200, header present |
| Path control (`/secret`) | HTTP 404 |
| Tunnel URL parsed from cloudflared output, incl. split across chunks | Parsed correctly |
| `stop()` awaits real process exit; port refuses afterwards | Confirmed, no orphan processes |

Additionally verified inside a real Obsidian 1.9.14 desktop install (headless, driven over
the Electron debugging protocol), with the plugin loaded from a vault:

| Behaviour | Result |
| --- | --- |
| Plugin loads; ribbon, status bar and commands register | Confirmed |
| Welcome modal appears on first run only, after layout is ready | Confirmed |
| Command palette shows both commands in sentence case | Confirmed |
| Launcher lists open tabs and flags live ones | Confirmed |
| Settings tab resolves and reports the cloudflared status | Confirmed |
| Consent dialog names the binary it will run and what the share exposes | Confirmed |
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
| Consent dialog | Shown with the real binary path and version |
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
