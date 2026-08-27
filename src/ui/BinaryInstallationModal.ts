import { App, Modal, Setting } from 'obsidian';
import { DownloadPlan, ResolvedBinary } from '../services/CloudflaredBinaryService';
import { CLOUDFLARED_RELEASE_PAGE } from '../services/cloudflaredReleases';

/**
 * Asks for consent before Note Wormhole runs cloudflared.
 *
 * Two shapes, because the two cases carry different risk:
 *  - an existing binary the user installed themselves: we only need to say that
 *    we are going to run it and relay through Cloudflare;
 *  - no binary found: we show the exact URL, version, checksum, size and
 *    install path before downloading anything.
 */
export class BinaryInstallationModal extends Modal {
    private existing: ResolvedBinary | null;
    private plan: DownloadPlan | null;
    private onAccept: () => void;
    private onCancel: () => void;

    constructor(
        app: App,
        options: {
            existing: ResolvedBinary | null;
            plan: DownloadPlan | null;
            onAccept: () => void;
            onCancel: () => void;
        }
    ) {
        super(app);
        this.existing = options.existing;
        this.plan = options.plan;
        this.onAccept = options.onAccept;
        this.onCancel = options.onCancel;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        if (this.existing) {
            this.renderExisting(contentEl, this.existing);
        } else if (this.plan) {
            this.renderDownload(contentEl, this.plan);
        } else {
            this.renderUnsupported(contentEl);
            return;
        }

        this.renderCloudflareNotice(contentEl);
        this.renderButtons(contentEl);
    }

    private renderExisting(contentEl: HTMLElement, binary: ResolvedBinary) {
        this.setTitle('Run cloudflared? ⚡');

        contentEl.createEl('p', {
            text: 'Note Wormhole found cloudflared already installed on this computer and will run it to open the tunnel. Nothing will be downloaded.'
        });

        const details = contentEl.createDiv({ cls: 'wormhole-binary-details' });
        this.addDetail(details, 'Binary', binary.path);
        if (binary.version) {
            this.addDetail(details, 'Version', binary.version);
        }
    }

    private renderDownload(contentEl: HTMLElement, plan: DownloadPlan) {
        this.setTitle('Download cloudflared? ⚡');

        contentEl.createEl('p', {
            text: 'Note Wormhole exposes a local server on this computer through a Cloudflare quick tunnel. No cloudflared binary was found, so it needs to download one first. This happens once.'
        });

        const details = contentEl.createDiv({ cls: 'wormhole-binary-details' });
        this.addDetail(details, 'Version', plan.version);
        this.addDetail(details, 'Download', plan.url);
        this.addDetail(details, 'SHA-256', plan.sha256);
        this.addDetail(details, 'Size', `${(plan.size / 1024 / 1024).toFixed(1)} MB`);
        this.addDetail(details, 'Install to', plan.installPath);

        contentEl.createEl('p', {
            text: 'The download is verified against the checksum above before it is installed. If it does not match, nothing is written.',
            cls: 'setting-item-description'
        });

        if (plan.emulated) {
            contentEl.createEl('p', {
                text: 'Note: Cloudflare publishes no native build for this architecture, so the x64 build will run under emulation.',
                cls: 'setting-item-description'
            });
        }

        contentEl.createEl('p', {
            text: 'You can also install cloudflared yourself; Note Wormhole will prefer your copy over this one.',
            cls: 'setting-item-description'
        });
    }

    private renderUnsupported(contentEl: HTMLElement) {
        this.setTitle('cloudflared is unavailable');

        contentEl.createEl('p', {
            text: `Cloudflare publishes no cloudflared build for ${process.platform}/${process.arch}, and none was found on this computer. Install cloudflared manually and Note Wormhole will use it.`
        });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Close')
                .setCta()
                .onClick(() => {
                    this.onCancel();
                    this.close();
                }));
    }

    private renderCloudflareNotice(contentEl: HTMLElement) {
        contentEl.createEl('p', {
            text: 'cloudflared is Cloudflare software. Running it, and the quick tunnel it opens, are subject to Cloudflare’s license and terms. While a wormhole is open, the note you shared is relayed through Cloudflare’s network to whoever holds the link.',
            cls: 'setting-item-description'
        });

        const links = contentEl.createDiv({ cls: 'wormhole-binary-links' });
        links.createEl('a', {
            text: 'Cloudflare license',
            href: 'https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/license/'
        });
        links.createEl('a', {
            text: 'Cloudflare terms',
            href: 'https://www.cloudflare.com/terms/'
        });
        links.createEl('a', {
            text: 'Release notes',
            href: CLOUDFLARED_RELEASE_PAGE
        });
    }

    private renderButtons(contentEl: HTMLElement) {
        const acceptLabel = this.existing ? 'Run cloudflared' : 'Download and install';

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => {
                    this.onCancel();
                    this.close();
                }))
            .addButton(btn => btn
                .setButtonText(acceptLabel)
                .setCta()
                .onClick(() => {
                    this.onAccept();
                    this.close();
                }));
    }

    private addDetail(parent: HTMLElement, label: string, value: string) {
        const row = parent.createDiv({ cls: 'wormhole-binary-detail' });
        row.createSpan({ cls: 'wormhole-binary-detail-label', text: label });
        row.createEl('code', { cls: 'wormhole-binary-detail-value', text: value });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
