import { App, Modal, Setting } from 'obsidian';

/**
 * Modal to ask for permission to download and install the Cloudflare Tunnel binary.
 * Replaces the non-native system dialog from 'untun'.
 */
export class BinaryInstallationModal extends Modal {
    private onAccept: () => void;
    private onCancel: () => void;

    constructor(app: App, onAccept: () => void, onCancel: () => void) {
        super(app);
        this.onAccept = onAccept;
        this.onCancel = onCancel;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        this.setTitle('Enable Cloudflare tunnel ⚡');

        contentEl.createEl('p', { text: 'Note Wormhole exposes a local server on your machine through a Cloudflare quick tunnel, so the people you share with can reach it.' });
        contentEl.createEl('p', { text: 'To do that it needs to download and run the Cloudflare tunnel binary (cloudflared) from Cloudflare’s official GitHub releases. This is a one-time setup.' });
        contentEl.createEl('p', { text: 'The tunnel is provided by Cloudflare and is subject to their terms. Nothing is uploaded to Cloudflare storage — traffic is relayed to your machine while the session is open.' });

        contentEl.createEl('p', {
            text: 'Download and install the tunnel component now?',
            cls: 'setting-item-description'
        });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => {
                    this.onCancel();
                    this.close();
                }))
            .addButton(btn => btn
                .setButtonText('Agree and install')
                .setCta()
                .onClick(() => {
                    this.onAccept();
                    this.close();
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
