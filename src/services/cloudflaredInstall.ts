/**
 * How to tell a user to install cloudflared on their platform.
 *
 * Note Wormhole never installs it. Obsidian's developer policies forbid a plugin
 * from installing "themselves or their dependencies", and every comparable
 * plugin in the community directory - pandoc, ffmpeg, git - relies on a binary
 * the user installed. So this module holds advice, not a downloader.
 */

export interface InstallMethod {
    /** What this method is, e.g. "Homebrew". */
    label: string;
    /** Shell command to run, when there is one. */
    command?: string;
    /** Where to read more, or download from directly. */
    url?: string;
}

export const CLOUDFLARED_DOWNLOADS_URL =
    'https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/';

export const CLOUDFLARED_RELEASES_URL =
    'https://github.com/cloudflare/cloudflared/releases/latest';

const WINDOWS: InstallMethod[] = [
    { label: 'winget', command: 'winget install Cloudflare.cloudflared' },
    { label: 'Direct download (.exe or .msi)', url: CLOUDFLARED_RELEASES_URL }
];

const MACOS: InstallMethod[] = [
    { label: 'Homebrew', command: 'brew install cloudflared' },
    { label: 'Direct download', url: CLOUDFLARED_RELEASES_URL }
];

const LINUX: InstallMethod[] = [
    { label: "Cloudflare's package repository", url: 'https://pkg.cloudflare.com/' },
    { label: 'Direct download (.deb, .rpm, or binary)', url: CLOUDFLARED_RELEASES_URL }
];

/** Install methods for a platform, most convenient first. */
export function installMethodsFor(platform: string = process.platform): InstallMethod[] {
    if (platform === 'win32') return WINDOWS;
    if (platform === 'darwin') return MACOS;
    return LINUX;
}

/**
 * Where Note Wormhole looks once cloudflared is installed, phrased for a user.
 * Worth stating plainly: this is the one thing the plugin reads from outside the
 * vault, and the developer policies ask for that to be explained.
 */
export function searchLocationsFor(platform: string = process.platform): string {
    if (platform === 'win32') {
        return "your PATH, winget's Links folder, and the cloudflared folders under Program Files and Local\\Programs";
    }
    if (platform === 'darwin') {
        return 'your PATH, /opt/homebrew/bin, /usr/local/bin, and ~/.cloudflared';
    }
    return 'your PATH, /usr/local/bin, /usr/bin, /snap/bin, ~/.cloudflared, and ~/.local/bin';
}
