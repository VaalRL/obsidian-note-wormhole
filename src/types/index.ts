import 'obsidian';

declare module 'obsidian' {
    interface WorkspaceLeaf {
        /** Internal leaf identifier used for session tracking (undocumented API). */
        id: string;
        /**
         * Obsidian's own per-tab status area, where it puts the pin and link
         * indicators. Undocumented, and optional because older builds did not
         * have it — see TabHeaderDecorator.hostFor for the fallback.
         */
        tabHeaderStatusContainerEl?: HTMLElement;
        /** Title element inside the tab header (undocumented API). */
        tabHeaderInnerTitleEl?: HTMLElement;
    }
}
