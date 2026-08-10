export type ThemeMode = 'auto' | 'light' | 'dark';

export interface WormholeSettings {
    preventSelection: boolean;
    themeMode: ThemeMode;
    hasSeenWelcome: boolean;
    hasAcceptedTunnelTerms: boolean;
}

export const DEFAULT_SETTINGS: WormholeSettings = {
    preventSelection: false,
    themeMode: 'auto',
    hasSeenWelcome: false,
    hasAcceptedTunnelTerms: false
}
