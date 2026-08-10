import { App, PluginSettingTab, Setting } from 'obsidian';
import NoteWormholePlugin from '../../main';
import { ThemeMode } from './WormholeSettings';

export class WormholeSettingTab extends PluginSettingTab {
    plugin: NoteWormholePlugin;

    constructor(app: App, plugin: NoteWormholePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Security and protection')
            .setHeading();

        new Setting(containerEl)
            .setName('Prevent text selection')
            .setDesc('Visitors cannot select text or open the context menu on the shared page. This discourages casual copying; it does not stop a determined reader.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.preventSelection)
                .onChange((value) => {
                    this.plugin.settings.preventSelection = value;
                    void this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Appearance')
            .setHeading();

        new Setting(containerEl)
            .setName('Theme mode')
            .setDesc('Colour scheme visitors see on the shared page.')
            .addDropdown(dropdown => dropdown
                .addOption('auto', 'Auto (match visitor system)')
                .addOption('light', 'Light')
                .addOption('dark', 'Dark')
                .setValue(this.plugin.settings.themeMode)
                .onChange((value) => {
                    this.plugin.settings.themeMode = value as ThemeMode;
                    void this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Tunnel')
            .setHeading();

        new Setting(containerEl)
            .setName('Cloudflare tunnel component')
            .setDesc('Sharing requires the cloudflared binary, downloaded once on first use. Reset this to be asked for permission again.')
            .addButton(button => button
                .setButtonText('Reset permission')
                .setDisabled(!this.plugin.settings.hasAcceptedTunnelTerms)
                .onClick(() => {
                    this.plugin.settings.hasAcceptedTunnelTerms = false;
                    void this.plugin.saveSettings().then(() => this.display());
                }));
    }
}
