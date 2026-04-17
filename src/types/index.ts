import 'obsidian';

declare module 'obsidian' {
    interface WorkspaceLeaf {
        /** Internal leaf identifier used for session tracking (undocumented API). */
        id: string;
        /** Internal tab header DOM elements (undocumented API). */
        tabHeaderInnerIconEl?: HTMLElement;
        tabHeaderInnerEl?: HTMLElement;
        tabHeaderInnerTitleEl?: HTMLElement;
    }
}
