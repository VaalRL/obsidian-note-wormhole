/**
 * Chrome DevTools Protocol client for service worker console monitoring
 */
import CDP from "chrome-remote-interface";
import { DEFAULT_CHROME_HOST, DEFAULT_CHROME_PORT, DEFAULT_SECURE, MESSAGE_RETENTION_TIME, } from "../constants.js";
export class ChromeDevToolsClient {
    connection;
    consoleMessages = [];
    isMonitoring = false;
    cdpClient = null;
    currentTargetId = null;
    constructor(host = DEFAULT_CHROME_HOST, port = DEFAULT_CHROME_PORT, secure = DEFAULT_SECURE) {
        this.connection = { host, port, secure };
    }
    /**
     * List all available Chrome targets (tabs, extensions, service workers)
     */
    async listTargets() {
        try {
            const targets = await CDP.List({
                host: this.connection.host,
                port: this.connection.port,
            });
            return targets;
        }
        catch (error) {
            throw new Error(`Failed to list Chrome targets: ${error instanceof Error ? error.message : String(error)}. ` +
                `Make sure Chrome is running with --remote-debugging-port=${this.connection.port}`);
        }
    }
    /**
     * Find service worker targets
     */
    async findServiceWorkers() {
        const targets = await this.listTargets();
        return targets.filter((target) => target.type === "service_worker" ||
            target.description?.includes("service worker"));
    }
    /**
     * Connect to a specific target (service worker or extension)
     */
    async connectToTarget(targetId) {
        try {
            // Disconnect from previous target if any
            if (this.cdpClient) {
                await this.disconnect();
            }
            this.cdpClient = await CDP({
                host: this.connection.host,
                port: this.connection.port,
                target: targetId,
            });
            this.currentTargetId = targetId;
            // Enable necessary domains
            await this.cdpClient.Runtime.enable();
            await this.cdpClient.Log.enable();
            console.error(`Connected to target: ${targetId}`);
        }
        catch (error) {
            throw new Error(`Failed to connect to target ${targetId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Start monitoring console messages from the connected target
     */
    async startMonitoring() {
        if (!this.cdpClient) {
            throw new Error("Not connected to any target. Call connectToTarget first.");
        }
        if (this.isMonitoring) {
            return;
        }
        this.isMonitoring = true;
        // Listen for console API calls
        this.cdpClient.Runtime.consoleAPICalled((params) => {
            const message = {
                timestamp: params.timestamp,
                level: params.type,
                text: params.args
                    .map((arg) => {
                    if (arg.value !== undefined)
                        return String(arg.value);
                    if (arg.description !== undefined)
                        return arg.description;
                    return arg.type;
                })
                    .join(" "),
                source: "console-api",
                stackTrace: params.stackTrace?.callFrames,
                args: params.args,
            };
            this.addConsoleMessage(message);
        });
        // Listen for runtime exceptions
        this.cdpClient.Runtime.exceptionThrown((params) => {
            const exception = params.exceptionDetails;
            const message = {
                timestamp: exception.timestamp,
                level: "error",
                text: exception.exception?.description || exception.text,
                source: "exception",
                url: exception.url,
                lineNumber: exception.lineNumber,
                stackTrace: exception.stackTrace?.callFrames,
            };
            this.addConsoleMessage(message);
        });
        // Listen for log entries
        this.cdpClient.Log.entryAdded((params) => {
            const entry = params.entry;
            const message = {
                timestamp: entry.timestamp,
                level: entry.level,
                text: entry.text,
                source: entry.source,
                url: entry.url,
                lineNumber: entry.lineNumber,
                stackTrace: entry.stackTrace?.callFrames,
            };
            this.addConsoleMessage(message);
        });
        console.error("Started monitoring console messages");
    }
    /**
     * Stop monitoring console messages
     */
    stopMonitoring() {
        this.isMonitoring = false;
        console.error("Stopped monitoring console messages");
    }
    /**
     * Add a console message to the buffer
     */
    addConsoleMessage(message) {
        this.consoleMessages.push(message);
        // Clean up old messages
        const cutoffTime = Date.now() - MESSAGE_RETENTION_TIME;
        this.consoleMessages = this.consoleMessages.filter((msg) => msg.timestamp * 1000 > cutoffTime);
    }
    /**
     * Get console messages with optional filtering
     */
    getConsoleMessages(filters) {
        let messages = [...this.consoleMessages];
        if (filters) {
            if (filters.level) {
                messages = messages.filter((msg) => msg.level === filters.level);
            }
            if (filters.startTime) {
                messages = messages.filter((msg) => msg.timestamp * 1000 >= filters.startTime);
            }
            if (filters.endTime) {
                messages = messages.filter((msg) => msg.timestamp * 1000 <= filters.endTime);
            }
            if (filters.textContains) {
                const searchText = filters.textContains.toLowerCase();
                messages = messages.filter((msg) => msg.text.toLowerCase().includes(searchText));
            }
        }
        return messages;
    }
    /**
     * Clear all stored console messages
     */
    clearMessages() {
        this.consoleMessages = [];
    }
    /**
     * Get current monitoring status
     */
    getStatus() {
        return {
            connected: this.cdpClient !== null,
            monitoring: this.isMonitoring,
            targetId: this.currentTargetId,
            messageCount: this.consoleMessages.length,
        };
    }
    /**
     * Disconnect from the current target
     */
    async disconnect() {
        if (this.cdpClient) {
            this.stopMonitoring();
            await this.cdpClient.close();
            this.cdpClient = null;
            this.currentTargetId = null;
            console.error("Disconnected from Chrome DevTools");
        }
    }
}
// Singleton instance
let clientInstance = null;
export function getChromeClient(host, port, secure) {
    if (!clientInstance) {
        clientInstance = new ChromeDevToolsClient(host, port, secure);
    }
    return clientInstance;
}
export function resetChromeClient() {
    if (clientInstance) {
        clientInstance.disconnect();
        clientInstance = null;
    }
}
//# sourceMappingURL=chrome-client.js.map