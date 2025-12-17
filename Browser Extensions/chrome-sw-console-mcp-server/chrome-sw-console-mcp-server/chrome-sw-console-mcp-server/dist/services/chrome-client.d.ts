/**
 * Chrome DevTools Protocol client for service worker console monitoring
 */
import type { ConsoleMessage, ChromeTarget, FilterOptions } from "../types.js";
export declare class ChromeDevToolsClient {
    private connection;
    private consoleMessages;
    private isMonitoring;
    private cdpClient;
    private currentTargetId;
    constructor(host?: string, port?: number, secure?: boolean);
    /**
     * List all available Chrome targets (tabs, extensions, service workers)
     */
    listTargets(): Promise<ChromeTarget[]>;
    /**
     * Find service worker targets
     */
    findServiceWorkers(): Promise<ChromeTarget[]>;
    /**
     * Connect to a specific target (service worker or extension)
     */
    connectToTarget(targetId: string): Promise<void>;
    /**
     * Start monitoring console messages from the connected target
     */
    startMonitoring(): Promise<void>;
    /**
     * Stop monitoring console messages
     */
    stopMonitoring(): void;
    /**
     * Add a console message to the buffer
     */
    private addConsoleMessage;
    /**
     * Get console messages with optional filtering
     */
    getConsoleMessages(filters?: FilterOptions): ConsoleMessage[];
    /**
     * Clear all stored console messages
     */
    clearMessages(): void;
    /**
     * Get current monitoring status
     */
    getStatus(): {
        connected: boolean;
        monitoring: boolean;
        targetId: string | null;
        messageCount: number;
    };
    /**
     * Disconnect from the current target
     */
    disconnect(): Promise<void>;
}
export declare function getChromeClient(host?: string, port?: number, secure?: boolean): ChromeDevToolsClient;
export declare function resetChromeClient(): void;
//# sourceMappingURL=chrome-client.d.ts.map