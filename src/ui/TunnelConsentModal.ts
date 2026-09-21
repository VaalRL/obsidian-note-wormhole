import { App, Modal, Setting } from 'obsidian';
import { ResolvedBinary } from '../services/CloudflaredBinaryService';

/**
 * Asked once, before the first share.
 *
 * Running a binary the user installed themselves needs no ceremony - that is
 * what obsidian-pandoc and friends do. What does deserve an explicit yes is the
 * other half: the note is about to be readable by anyone holding the link, over
 * a relay the user does not control.
 */
export class TunnelConsentModal extends Modal {
    private binary: ResolvedBinary;
    private onResult: (accepted: boolean) => void;
    private settled = false;

    constructor(app: App, binary: ResolvedBinary, onResult: (accepted: boolean) => void) {
        super(app);
        this.binary = binary;
        this.onResult = onResult;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        this.setTitle('Share this note publicly?');

        contentEl.createEl('p', {
            text: 'Note Wormhole serves this note from your own machine and opens a Cloudflare quick tunnel so other people can reach it. While the wormhole is open:'
        });

        const points = contentEl.createEl('ul');
        points.createEl('li', {
            text: 'Anyone with the link can read the note. There is no password and no access list.'
        });
        points.createEl('li', {
            text: "The note is relayed through Cloudflare's network, which is subject to Cloudflare's terms."
        });
        points.createEl('li', {
            text: 'Closing the tab, stopping the session, or quitting Obsidian kills the link immediately.'
        });

        const details = contentEl.createDiv({ cls: 'wormhole-binary-details' });
        this.addDetail(details, 'Runs', this.binary.path);
        if (this.binary.version) {
            this.addDetail(details, 'Version', this.binary.version);
        }

        contentEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'This is the cloudflared already installed on this computer. Note Wormhole never downloads or installs it.'
        });

        const links = contentEl.createDiv({ cls: 'wormhole-binary-links' });
        links.createEl('a', {
            text: 'Cloudflare terms',
            href: 'https://www.cloudflare.com/terms/',
            attr: { target: '_blank', rel: 'noopener noreferrer' }
        });
        links.createEl('a', {
            text: 'About quick tunnels',
            href: 'https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/',
            attr: { target: '_blank', rel: 'noopener noreferrer' }
        });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => this.settle(false)))
            .addButton(btn => btn
                .setButtonText('Open the wormhole')
                .setCta()
                .onClick(() => this.settle(true)));
    }

    /** Appends a label/value pair as two direct children of the details grid. */
    private addDetail(parent: HTMLElement, label: string, value: string) {
        parent.createSpan({ cls: 'wormhole-binary-detail-label', text: label });
        parent.createEl('code', { cls: 'wormhole-binary-detail-value', text: value });
    }

    /** Reports the outcome once, then closes. */
    private settle(accepted: boolean) {
        if (this.settled) return;
        this.settled = true;
        this.onResult(accepted);
        this.close();
    }

    onClose() {
        this.contentEl.empty();

        // Dismissed with Escape or the close button rather than a choice.
        if (!this.settled) {
            this.settled = true;
            this.onResult(false);
        }
    }
}
