import { App, FuzzySuggestModal, MarkdownView, WorkspaceLeaf } from "obsidian";
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
        this.setPlaceholder("Select a tab to open a Wormhole...");
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
        const state = item.isActive ? "🟢 (Active) " : "";
        return `${state}${item.file}`;
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
