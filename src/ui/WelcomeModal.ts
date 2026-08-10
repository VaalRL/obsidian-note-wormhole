import { App, Modal, Setting } from 'obsidian';

export class WelcomeModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        this.setTitle('Welcome to Note Wormhole 🌌');

        contentEl.createEl('p', { text: 'Turn your vault into a temporary, local web server. Share the note you are reading through a public link that only lives as long as you keep it open.' });

        const featureList = contentEl.createEl('ul');
        featureList.createEl('li', { text: 'Instant: content is streamed straight from your device.' });
        featureList.createEl('li', { text: 'Ephemeral: the link dies the moment you close the tab or quit.' });
        featureList.createEl('li', { text: 'Private: served from memory, never uploaded to cloud storage.' });

        contentEl.createEl('p', {
            text: 'Sharing needs a one-time download of the Cloudflare tunnel component (cloudflared). You will be asked before that happens.',
            cls: 'setting-item-description'
        });

        contentEl.createEl('p', {
            text: 'To get started, click the wormhole icon in the ribbon or run the "Start wormhole for current note" command.',
            cls: 'setting-item-description'
        });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Get started')
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
