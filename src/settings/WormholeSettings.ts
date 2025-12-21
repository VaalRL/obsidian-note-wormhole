export interface WormholeSettings {
    preventSelection: boolean;
    themeMode: 'auto' | 'light' | 'dark';
    showWatermark: boolean;
}

export const DEFAULT_SETTINGS: WormholeSettings = {
    preventSelection: false,
    themeMode: 'auto',
    showWatermark: false
}
