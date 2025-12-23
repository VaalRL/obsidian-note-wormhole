import { App, FuzzySuggestModal, MarkdownView, WorkspaceLeaf, FuzzyMatch } from "obsidian";
import { WormholeManager } from "../services/WormholeManager";

interface TabChoice {
    leaf: WorkspaceLeaf;
    file: string;
    isActive: boolean;
}

export class WormholeLauncherModal extends FuzzySuggestModal<TabChoice> {
    private manager: WormholeManager;

    constructor(app: App, manager: WormholeManager) {
        super(app);
        this.manager = manager;
        this.setPlaceholder("Select a tab to trigger Wormhole tunneling...");
        this.setInstructions([
            { command: "↵", purpose: "to toggle wormhole" },
            { command: "esc", purpose: "to dismiss" },
        ]);
    }

    getItems(): TabChoice[] {
        const choices: TabChoice[] = [];

        this.app.workspace.iterateAllLeaves((leaf) => {
            if (leaf.view instanceof MarkdownView && leaf.view.file) {
                const leafId = (leaf as any).id;
                choices.push({
                    leaf: leaf,
                    file: leaf.view.file.path,
                    isActive: this.manager.isSharing(leafId)
                });
            }
        });

        return choices;
    }

    getItemText(item: TabChoice): string {
        return item.file;
    }

    renderSuggestion(match: FuzzyMatch<TabChoice>, el: HTMLElement): void {
        const item = match.item;
        el.addClass("mod-complex");

        const content = el.createDiv({ cls: "suggestion-content" });

        const title = content.createDiv({ cls: "suggestion-title" });
        title.setText(this.getBasename(item.file));

        const note = content.createDiv({ cls: "suggestion-note" });
        note.setText(item.file);

        if (item.isActive) {
            const aux = el.createDiv({ cls: "suggestion-aux" });
            aux.createSpan({ cls: "suggestion-flair", text: "LIVE" })
                .style.color = "var(--color-accent)";
        }

        // Optionally highlight the matched characters
        // super.renderSuggestion(match, el) usually does this, but since we custom render,
        // we might lose highlighting unless we implement it.
        // For now, let's just stick to the requested UI structure. Highlighting in complex mode is tricky.
    }

    private getBasename(path: string): string {
        const parts = path.split("/");
        return parts[parts.length - 1];
    }


    onChooseItem(item: TabChoice, evt: MouseEvent | KeyboardEvent): void {
        const view = item.leaf.view as MarkdownView;
        const leafId = (item.leaf as any).id;

        if (item.isActive) {
            // If already active, maybe ask to stop? Or just show info?
            // For now, let's just re-copy the link logic which happens in startSharing check
            this.manager.startSharing(leafId, "", ""); // Manager handles caching check
        } else {
            const content = view.getViewData();
            const filePath = view.file!.path;

            // Trigger sharing
            this.manager.startSharing(leafId, content, filePath)
                .catch(err => console.error("Failed to start wormhole from modal", err));
        }
    }
}
