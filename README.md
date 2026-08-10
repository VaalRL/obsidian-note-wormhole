# Note Wormhole

Instantly share your notes via a secure, temporary, local wormhole. No cloud upload.

Note Wormhole turns your machine into a temporary web server for a single note, and exposes it through a Cloudflare quick tunnel. Close the tab, disable the plugin, or quit the app, and the link is dead.

## Features

- **Ephemeral sharing** — a public `https://<random>.trycloudflare.com` URL tunnels straight to your computer.
- **No cloud upload** — the note is rendered into memory and served from there. Nothing is written to a temp file, and nothing is stored on a third-party server.
- **Bound to the tab** — closing the note's tab, unloading the plugin, or quitting immediately tears down the tunnel and the local server.
- **Anti-copy mode** — optionally disable text selection, the context menu, and copy/print shortcuts for visitors.
- **Live viewer count** — see how many people currently have the page open.

## Usage

### Opening a wormhole

1. Open the note you want to share.
2. Click the **radio tower** icon in the ribbon, or run the **Start wormhole for current note** command.
3. On first use you'll be asked to allow the one-time tunnel component download (see [Network use](#network-use) below).
4. The link is copied to your clipboard, and a green dot appears in the tab header.

### Controlling a session

- **Hover** the green dot to see the viewer count.
- **Click** the green dot (or press <kbd>Enter</kbd> when it has focus) for the menu:
  - **Copy link** — get the URL again.
  - **Prevent selection / Unlock selection** — toggle anti-copy for this session.
  - **Stop sharing** — collapse the wormhole.
- The **floating panel** in the bottom-right of the note offers the same controls.
- The **status bar** item shows how many wormholes are open; click it to toggle the current note.

## Network use

This plugin is not self-contained. Before installing, understand what it does on the network:

| What | Where to | When |
| --- | --- | --- |
| Downloads the `cloudflared` binary | Cloudflare's official GitHub releases | Once, on first share, only after you accept the in-app prompt |
| Runs `cloudflared` as a child process | — | While a wormhole is open |
| Relays note content through a Cloudflare quick tunnel | Cloudflare's edge network | While a wormhole is open |

The download and tunnel are handled by [`untun`](https://github.com/unjs/untun). The tunnel is a Cloudflare **quick tunnel**: no Cloudflare account or token is required, the URL is randomly assigned, and the service is subject to [Cloudflare's terms](https://www.cloudflare.com/website-terms/). You can revoke your consent and be prompted again from the plugin's settings tab.

## Security and privacy

- The local HTTP server binds to `127.0.0.1` on an OS-assigned port; it is only reachable through the tunnel.
- The server answers `/` (the note) and `/_heartbeat` (viewer counting). Everything else returns 404.
- The rendered HTML is held in memory only — it is never written to disk.
- Responses are sent with `no-store`, a restrictive `Content-Security-Policy`, `X-Robots-Tag: noindex`, and `Referrer-Policy: no-referrer`.
- Ending a session destroys the tunnel and force-closes every open socket, so the URL dies immediately.

**Anti-copy mode is a deterrent, not protection.** It disables selection, the context menu, and the copy/print shortcuts, but anyone who wants the text can still read the page source. Do not treat it as a security control.

**Anyone with the URL can read the note** while the session is open. There is no password or access list.

## Requirements

- **Desktop only.** The plugin runs a local Node.js HTTP server and a child process, which Obsidian mobile does not support.
- **Obsidian 1.5.0 or newer.**
- **An internet connection** to establish the tunnel.

## Installation

### From Community Plugins

1. Open **Settings → Community plugins** and search for "Note Wormhole".
2. Install and enable it.

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/VaalRL/obsidian-note-wormhole/releases/latest).
2. Copy them into `<your vault>/.obsidian/plugins/note-wormhole/`.
3. Reload Obsidian and enable the plugin.

## Development

```bash
npm install
npm run dev     # watch build
npm run build   # typecheck + production bundle
npm run lint
```

## License

MIT. See [LICENSE](LICENSE).
