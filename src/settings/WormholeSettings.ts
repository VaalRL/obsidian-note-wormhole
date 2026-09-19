export type ThemeMode = 'auto' | 'light' | 'dark';

export interface WormholeSettings {
    preventSelection: boolean;
    themeMode: ThemeMode;
    hasSeenWelcome: boolean;
    /** Agreed to what a share exposes: the note, publicly, relayed by Cloudflare. */
    hasAcceptedTunnelTerms: boolean;
}

export const DEFAULT_SETTINGS: WormholeSettings = {
    preventSelection: false,
    themeMode: 'auto',
    hasSeenWelcome: false,
    hasAcceptedTunnelTerms: false
}
