import { App, PluginSettingTab, Setting } from 'obsidian';
import NoteWormholePlugin from '../../main';
import { ThemeMode } from './WormholeSettings';
import { CloudflaredBinaryService } from '../services/CloudflaredBinaryService';
import {
    CLOUDFLARED_DOWNLOADS_URL,
    installMethodsFor,
    searchLocationsFor
} from '../services/cloudflaredInstall';
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
            .setName('Cloudflared')
            .setDesc('Checking…')
            .addButton(button => button
                .setButtonText('Check again')
                .onClick(() => this.display()));

        if (this.plugin.settings.hasAcceptedTunnelTerms) {
            new Setting(containerEl)
                .setName('Sharing confirmation')
                .setDesc('You have confirmed what a share exposes. Reset this to be asked again before the next share.')
                .addButton(button => button
                    .setButtonText('Ask me again')
                    .onClick(() => {
                        this.plugin.settings.hasAcceptedTunnelTerms = false;
                        void this.plugin.saveSettings().then(() => this.display());
                    }));
        }

        // Paths, commands and URLs go in a full-width block below the row:
        // inside the setting's own description they would run under the button.
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
     * Reports which cloudflared will be used, or how to install one.
     *
     * Done after render because resolving it means touching the filesystem and
     * running `--version`.
     */
    private async describeBinary(setting: Setting, details: HTMLElement) {
        const binaries = new CloudflaredBinaryService();

        // Label and value go straight into the grid as siblings; a wrapper would
        // need display:contents, which Obsidian's CSS lint flags.
        const addDetail = (label: string, value: string, isCode = true) => {
            details.createSpan({ cls: 'wormhole-binary-detail-label', text: label });
            if (isCode) {
                details.createEl('code', { cls: 'wormhole-binary-detail-value', text: value });
            } else {
                details.createSpan({ cls: 'wormhole-binary-detail-value', text: value });
            }
        };

        const addLink = (label: string, text: string, href: string) => {
            details.createSpan({ cls: 'wormhole-binary-detail-label', text: label });
            details.createEl('a', {
                cls: 'wormhole-binary-detail-value',
                text,
                href,
                attr: { target: '_blank', rel: 'noopener noreferrer' }
            });
        };

        try {
            const existing = await binaries.findExisting();
            details.empty();

            if (existing) {
                setting.setDesc('Found. Note Wormhole will run this copy; it never downloads or installs one.');
                addDetail('Binary', existing.path);
                if (existing.version) addDetail('Version', existing.version);
                return;
            }

            setting.setDesc(
                "Not found. Note Wormhole needs Cloudflare's cloudflared to open a tunnel, " +
                'and does not install it for you. Install it with one of these, then use "Check again".'
            );

            for (const method of installMethodsFor()) {
                if (method.command) {
                    addDetail(method.label, method.command);
                } else if (method.url) {
                    addLink(method.label, method.url, method.url);
                }
            }

            addDetail('Looked in', searchLocationsFor(), false);

            addLink('Guide', "Cloudflare's installation instructions", CLOUDFLARED_DOWNLOADS_URL);
        } catch (error) {
            console.error('[Wormhole] Could not resolve cloudflared', error);
            setting.setDesc('Could not determine the cloudflared status. Check the developer console.');
            details.remove();
        }
    }

}
