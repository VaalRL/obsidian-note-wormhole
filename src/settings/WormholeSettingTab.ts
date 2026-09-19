import { App, PluginSettingTab, Setting } from 'obsidian';
import NoteWormholePlugin from '../../main';
import { ThemeMode } from './WormholeSettings';
import { CloudflaredBinaryService } from '../services/CloudflaredBinaryService';
import { CLOUDFLARED_VERSION } from '../services/cloudflaredReleases';
import { SUPPORT_URL } from '../constants';

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

        // Paths and URLs go in a full-width block below the row: inside the
        // setting's own description they would run under the button.
        const binaryDetails = containerEl.createDiv({ cls: 'wormhole-binary-details' });

        void this.describeBinary(binarySetting, binaryDetails);

        this.renderSupport(containerEl);
    }

    /**
     * A plain text link rather than a Buy Me A Coffee banner image: the badge is
     * a remote image request on every settings open, and `fundingUrl` in
     * manifest.json already gives Obsidian's own support button.
     */
    private renderSupport(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName('Support')
            .setHeading();

        const setting = new Setting(containerEl)
            .setName('Buy me a coffee')
            .setDesc('Note Wormhole is free and MIT licensed. If it saved you some time, you can chip in.');

        setting.controlEl.createEl('a', {
            text: 'Buy me a coffee',
            href: SUPPORT_URL,
            attr: {
                target: '_blank',
                rel: 'noopener noreferrer',
                'aria-label': 'Support the developer on Buy Me A Coffee'
            }
        });
    }

    /**
     * Fills in which cloudflared will actually be used. Done after render
     * because resolving it means touching the filesystem and running --version.
     */
    private async describeBinary(setting: Setting, details: HTMLElement) {
        const binaries = new CloudflaredBinaryService();

        const addDetail = (label: string, value: string) => {
            const row = details.createDiv({ cls: 'wormhole-binary-detail' });
            row.createSpan({ cls: 'wormhole-binary-detail-label', text: label });
            row.createEl('code', { cls: 'wormhole-binary-detail-value', text: value });
        };

        try {
            const existing = await binaries.findExisting();
            details.empty();

            if (existing) {
                setting.setDesc(
                    existing.source === 'system'
                        ? 'Using a copy already installed on this computer. Nothing will be downloaded.'
                        : 'Using the checksum-verified copy Note Wormhole installed.'
                );
                addDetail('Binary', existing.path);
                addDetail('Version', existing.version ?? CLOUDFLARED_VERSION);
                return;
            }

            const plan = binaries.getDownloadPlan();

            if (!plan) {
                setting.setDesc(
                    `Cloudflare publishes no cloudflared build for ${process.platform}/${process.arch}. ` +
                    `Install it manually and Note Wormhole will use it.`
                );
                details.remove();
                return;
            }

            setting.setDesc(
                'Not installed. On first share it will be downloaded and checked against its SHA-256. ' +
                'Install cloudflared yourself and Note Wormhole will prefer your copy.'
            );
            addDetail('Version', plan.version);
            addDetail('Download', plan.url);
            addDetail('SHA-256', plan.sha256);
            addDetail('Install to', plan.installPath);
        } catch (error) {
            console.error('[Wormhole] Could not resolve cloudflared', error);
            setting.setDesc('Could not determine the cloudflared status. Check the developer console.');
            details.remove();
        }
    }
}
