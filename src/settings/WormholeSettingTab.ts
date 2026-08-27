import { App, PluginSettingTab, Setting } from 'obsidian';
import NoteWormholePlugin from '../../main';
import { ThemeMode } from './WormholeSettings';
import { CloudflaredBinaryService } from '../services/CloudflaredBinaryService';
import { CLOUDFLARED_VERSION } from '../services/cloudflaredReleases';

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

        const binarySetting = new Setting(containerEl)
            .setName('Cloudflared binary')
            .setDesc('Checking…')
            .addButton(button => button
                .setButtonText('Reset permission')
                .setDisabled(!this.plugin.settings.hasAcceptedTunnelTerms)
                .onClick(() => {
                    this.plugin.settings.hasAcceptedTunnelTerms = false;
                    this.plugin.settings.hasAcceptedBinaryDownload = false;
                    void this.plugin.saveSettings().then(() => this.display());
                }));

        void this.describeBinary(binarySetting);
    }

    /**
     * Fills in which cloudflared will actually be used. Done after render
     * because resolving it means touching the filesystem and running --version.
     */
    private async describeBinary(setting: Setting) {
        const binaries = new CloudflaredBinaryService();

        try {
            const existing = await binaries.findExisting();

            if (existing?.source === 'system') {
                setting.setDesc(
                    `Using the copy already installed at ${existing.path}` +
                    `${existing.version ? ` (${existing.version})` : ''}. Nothing will be downloaded.`
                );
                return;
            }

            if (existing?.source === 'managed') {
                setting.setDesc(
                    `Using the verified copy Note Wormhole installed at ${existing.path} (${CLOUDFLARED_VERSION}).`
                );
                return;
            }

            const plan = binaries.getDownloadPlan();
            setting.setDesc(
                plan
                    ? `Not installed. On first share, cloudflared ${plan.version} will be downloaded from ` +
                      `${plan.url}, checked against its SHA-256, and installed to ${plan.installPath}. ` +
                      `Install cloudflared yourself and Note Wormhole will prefer your copy.`
                    : `Cloudflare publishes no cloudflared build for ${process.platform}/${process.arch}. ` +
                      `Install it manually and Note Wormhole will use it.`
            );
        } catch (error) {
            console.error('[Wormhole] Could not resolve cloudflared', error);
            setting.setDesc('Could not determine the cloudflared status. Check the developer console.');
        }
    }
}
