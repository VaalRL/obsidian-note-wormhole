export type ThemeMode = 'auto' | 'light' | 'dark';

export interface WormholeSettings {
    preventSelection: boolean;
    themeMode: ThemeMode;
    hasSeenWelcome: boolean;
    /** Agreed to Note Wormhole running cloudflared at all. */
    hasAcceptedTunnelTerms: boolean;
    /** Agreed to Note Wormhole downloading the cloudflared binary itself. */
    hasAcceptedBinaryDownload: boolean;
}

export const DEFAULT_SETTINGS: WormholeSettings = {
    preventSelection: false,
    themeMode: 'auto',
    hasSeenWelcome: false,
    hasAcceptedTunnelTerms: false,
    hasAcceptedBinaryDownload: false
}
