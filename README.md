# Note Wormhole for Obsidian

**Note Wormhole** allows you to instantly share your current note with the world via a secure, temporary, and local "wormhole".

![Wormhole Banner](https://placeholder-banner-url.com)

## ✨ Features

*   **Ephemeral Sharing**: Open a public URL (https://xyz.trycloudflare.com) that tunnels directly to your computer.
*   **Zero Cloud Upload**: Your notes are served directly from your RAM. No third-party servers store your data.
*   **Physical Security**: Closing the tab, the plugin, or Obsidian **immediately destroys** the link.
*   **Anti-Copy Protection**: Optional "Secure Mode" disables text selection and context menus for viewers.
*   **Live Viewer Count**: See how many people are reading your note in real-time.

## 🚀 Usage

### Opening a Wormhole
1.  Open the note you want to share.
2.  Click the **Radio Tower** icon in the ribbon, OR run the command `Start Wormhole`.
3.  The link is automatically copied to your clipboard.
4.  Look for the **Green Dot 🟢** in your tab header.

### Controlling the Session
*   **Hover** over the Green Dot to see viewer count.
*   **Click** the Green Dot to open the menu:
    *   **Copy Link**: Get the URL again.
    *   **Toggle Protection**: Enable/Disable text selection for viewers.
    *   **Stop Sharing**: Close the wormhole.
*   **Floating Panel**: Use the overlay in the bottom-right of the note for quick access.

## 🔒 Security & Privacy logic

1.  **Tunneling**: Uses [Cloudflare Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) via `untun`. The traffic is encrypted between the viewer and your machine.
2.  **RAM Only**: The HTML content is rendered into memory. It is never written to a temporary file on your disk.
3.  **No Persistence**: Once the session ends, the URL is dead forever (404).

## ⚠️ Requirements

*   **Desktop Only**: This plugin relies on a local Node.js server and binary execution, so it works only on Obsidian Desktop (Windows/Mac/Linux).
*   **Network**: Requires an active internet connection to establish the tunnel.

## Installation

1.  Search for "Note Wormhole" in the Obsidian Community Plugins settings.
2.  Install and Enable.

## License

MIT License. See [LICENSE](LICENSE) for details.
