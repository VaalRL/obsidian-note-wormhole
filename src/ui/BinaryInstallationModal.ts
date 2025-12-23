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

        contentEl.createEl('h2', { text: 'Enable Cloudflare Tunnel ⚡' });

        contentEl.createEl('p', { text: 'Note Wormhole uses Cloudflare Tunnel to check exposure of your local server to the internet.' });
        contentEl.createEl('p', { text: 'To proceed, we need to download and install the lightweight Cloudflare Tunnel binary (cloudflared) from GitHub. This is a one-time setup.' });

        contentEl.createEl('p', {
            text: 'Do you agree to the terms and wish to install the binary?',
            cls: 'setting-item-description'
        });

        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.onclick = () => {
            this.onCancel();
            this.close();
        };

        const confirmBtn = buttonContainer.createEl('button', { text: 'Agree & Install', cls: 'mod-cta' });
        confirmBtn.onclick = () => {
            this.onAccept();
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
