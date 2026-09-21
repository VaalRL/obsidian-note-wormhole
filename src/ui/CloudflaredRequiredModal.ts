import { App, Modal, Setting } from 'obsidian';
import {
    CLOUDFLARED_DOWNLOADS_URL,
    installMethodsFor,
    searchLocationsFor
} from '../services/cloudflaredInstall';

/**
 * Shown when there is no cloudflared to run.
 *
 * Note Wormhole will not install it, so this dialog's whole job is to tell the
 * user how to install it themselves. There is no "continue" - without the binary
 * there is nothing to continue to.
 */
export class CloudflaredRequiredModal extends Modal {
    /**
     * Called exactly once, with true if the user says they have installed it and
     * wants another attempt. Dismissing with Escape or the close button counts
     * as false, so the caller is never left waiting on a promise that cannot
     * settle.
     */
    private onResult: (retry: boolean) => void;
    private settled = false;

    constructor(app: App, onResult: (retry: boolean) => void) {
        super(app);
        this.onResult = onResult;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        this.setTitle('cloudflared is required');

        contentEl.createEl('p', {
            text: "Note Wormhole opens its tunnel by running Cloudflare's cloudflared, and none was found on this computer. Install it once and sharing will work from then on."
        });

        const methods = contentEl.createDiv({ cls: 'wormhole-install-methods' });
        for (const method of installMethodsFor()) {
            methods.createSpan({ cls: 'wormhole-install-label', text: method.label });

            if (method.command) {
                methods.createEl('code', { cls: 'wormhole-install-command', text: method.command });
            } else if (method.url) {
                methods.createEl('a', {
                    cls: 'wormhole-install-command',
                    text: method.url,
                    href: method.url,
                    attr: { target: '_blank', rel: 'noopener noreferrer' }
                });
            }
        }

        contentEl.createEl('p', {
            cls: 'setting-item-description',
            text: `Once it is installed, Note Wormhole looks for it in ${searchLocationsFor()}. No restart is needed.`
        });

        contentEl.createEl('p', { cls: 'setting-item-description' }).createEl('a', {
            text: "Cloudflare's installation guide",
            href: CLOUDFLARED_DOWNLOADS_URL,
            attr: { target: '_blank', rel: 'noopener noreferrer' }
        });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Close')
                .onClick(() => this.settle(false)))
            .addButton(btn => btn
                .setButtonText("I've installed it")
                .setCta()
                .onClick(() => this.settle(true)));
    }

    /** Reports the outcome once, then closes. */
    private settle(retry: boolean) {
        if (this.settled) return;
        this.settled = true;
        this.onResult(retry);
        this.close();
    }

    onClose() {
        this.contentEl.empty();

        // Dismissed with Escape or the close button rather than a choice. Report
        // it here instead of calling settle(), which would close an already
        // closing modal.
        if (!this.settled) {
            this.settled = true;
            this.onResult(false);
        }
    }
}
