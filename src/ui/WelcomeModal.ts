import { App, Modal, Setting } from 'obsidian';

export class WelcomeModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Welcome to Note Wormhole 🌌' });

        contentEl.createEl('p', { text: 'Turn your Obsidian into a temporary, secure web server. Share your current note instantly with a public link.' });

        const featureList = contentEl.createEl('ul');
        featureList.createEl('li', { text: '🚀 Instant: Direct P2P-like streaming from your device.' });
        featureList.createEl('li', { text: '👻 Ephemeral: The link dies immediately when you close the tab or Obsidian.' });
        featureList.createEl('li', { text: '🔒 Secure: RAM-only serving. No data is ever uploaded to cloud storage.' });

        contentEl.createEl('p', {
            text: 'To get started, click the Wormhole icon in the ribbon or use the "Start Wormhole" command.',
            cls: 'setting-item-description'
        });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Get Started')
                .setCta()
                .onClick(() => {
                    this.close();
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
