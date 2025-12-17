/**
 * Response formatting utilities for console messages
 */
import type { ConsoleMessage, ConsoleLogs } from "../types.js";
/**
 * Format console messages as markdown
 */
export declare function formatConsoleMessagesMarkdown(logs: ConsoleMessage[], limit?: number): string;
/**
 * Format console messages as JSON
 */
export declare function formatConsoleMessagesJSON(logs: ConsoleMessage[], limit?: number): ConsoleLogs;
/**
 * Format target list as markdown
 */
export declare function formatTargetsMarkdown(targets: any[]): string;
/**
 * Format status information as markdown
 */
export declare function formatStatusMarkdown(status: {
    connected: boolean;
    monitoring: boolean;
    targetId: string | null;
    messageCount: number;
}): string;
//# sourceMappingURL=formatters.d.ts.map