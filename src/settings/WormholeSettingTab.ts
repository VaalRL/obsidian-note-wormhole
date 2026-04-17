import { App, PluginSettingTab, Setting } from 'obsidian';
import NoteWormholePlugin from '../../main';

export class WormholeSettingTab extends PluginSettingTab {
    plugin: NoteWormholePlugin;

    constructor(app: App, plugin: NoteWormholePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        // Usage Instructions
        new Setting(containerEl)
            .setName('使用說明')
            .setHeading();

        containerEl.createEl('p', { text: '在任何筆記中，打開命令面板 (Ctrl/Cmd + P) 搜尋 "Wormhole" 即可將筆記分享到網路上。' });
        containerEl.createEl('p', { text: '分享後的筆記將會產生一個公開的連結，您可以將該連結分享給其他人。' });

        const coffeeDiv = containerEl.createDiv('coffee-container');
        const coffeeLink = coffeeDiv.createEl('a', { href: 'https://www.buymeacoffee.com/whoami885' });
        coffeeLink.createEl('img', {
            attr: {
                src: 'https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=whoami885&button_colour=BD5FFF&font_colour=ffffff&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00',
                alt: 'Buy Me A Coffee'
            }
        });

        new Setting(containerEl)
            .setName('Security & protection')
            .setHeading();

        new Setting(containerEl)
            .setName('Prevent text selection')
            .setDesc('If enabled, visitors cannot select text or use context menu (Anti-Copy Mode).')
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
            .setDesc('Choose how the shared note looks to visitors.')
            .addDropdown(dropdown => dropdown
                .addOption('auto', 'Auto (Match System)')
                .addOption('light', 'Light')
                .addOption('dark', 'Dark')
                .setValue(this.plugin.settings.themeMode)
                .onChange((value) => {
                    this.plugin.settings.themeMode = value as 'auto' | 'light' | 'dark';
                    void this.plugin.saveSettings();
                }));

        // Future feature
        /*
        new Setting(containerEl)
            .setName('Show watermark')
            .addToggle(...)
        */
    }
}
