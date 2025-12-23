export interface WormholeSettings {
    preventSelection: boolean;
    themeMode: 'auto' | 'light' | 'dark';
    showWatermark: boolean;
    hasSeenWelcome: boolean;
    hasAcceptedTunnelTerms: boolean;
}

export const DEFAULT_SETTINGS: WormholeSettings = {
    preventSelection: false,
    themeMode: 'auto',
    showWatermark: false,
    hasSeenWelcome: false,
    hasAcceptedTunnelTerms: false
}
