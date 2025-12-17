/**
 * Chrome DevTools Protocol client for service worker console monitoring
 */

import CDP from "chrome-remote-interface";
import type {
  ConsoleMessage,
  ChromeTarget,
  ChromeConnection,
  FilterOptions,
} from "../types.js";
import {
  DEFAULT_CHROME_HOST,
  DEFAULT_CHROME_PORT,
  DEFAULT_SECURE,
  MESSAGE_RETENTION_TIME,
} from "../constants.js";

export class ChromeDevToolsClient {
  private connection: ChromeConnection;
  private consoleMessages: ConsoleMessage[] = [];
  private isMonitoring = false;
  private cdpClient: any = null;
  private currentTargetId: string | null = null;

  constructor(
    host: string = DEFAULT_CHROME_HOST,
    port: number = DEFAULT_CHROME_PORT,
    secure: boolean = DEFAULT_SECURE
  ) {
    this.connection = { host, port, secure };
  }

  /**
   * List all available Chrome targets (tabs, extensions, service workers)
   */
  async listTargets(): Promise<ChromeTarget[]> {
    try {
      const targets = await CDP.List({
        host: this.connection.host,
        port: this.connection.port,
      });
      return targets;
    } catch (error) {
      throw new Error(
        `Failed to list Chrome targets: ${error instanceof Error ? error.message : String(error)}. ` +
        `Make sure Chrome is running with --remote-debugging-port=${this.connection.port}`
      );
    }
  }

  /**
   * Find service worker targets
   */
  async findServiceWorkers(): Promise<ChromeTarget[]> {
    const targets = await this.listTargets();
    return targets.filter(
      (target) => target.type === "service_worker" || 
                  target.description?.includes("service worker")
    );
  }

  /**
   * Connect to a specific target (service worker or extension)
   */
  async connectToTarget(targetId: string): Promise<void> {
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
    } catch (error) {
      throw new Error(
        `Failed to connect to target ${targetId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Start monitoring console messages from the connected target
   */
  async startMonitoring(): Promise<void> {
    if (!this.cdpClient) {
      throw new Error("Not connected to any target. Call connectToTarget first.");
    }

    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Listen for console API calls
    this.cdpClient.Runtime.consoleAPICalled((params: any) => {
      const message: ConsoleMessage = {
        timestamp: params.timestamp,
        level: params.type as ConsoleMessage["level"],
        text: params.args
          .map((arg: any) => {
            if (arg.value !== undefined) return String(arg.value);
            if (arg.description !== undefined) return arg.description;
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
    this.cdpClient.Runtime.exceptionThrown((params: any) => {
      const exception = params.exceptionDetails;
      const message: ConsoleMessage = {
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
    this.cdpClient.Log.entryAdded((params: any) => {
      const entry = params.entry;
      const message: ConsoleMessage = {
        timestamp: entry.timestamp,
        level: entry.level as ConsoleMessage["level"],
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
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.error("Stopped monitoring console messages");
  }

  /**
   * Add a console message to the buffer
   */
  private addConsoleMessage(message: ConsoleMessage): void {
    this.consoleMessages.push(message);

    // Clean up old messages
    const cutoffTime = Date.now() - MESSAGE_RETENTION_TIME;
    this.consoleMessages = this.consoleMessages.filter(
      (msg) => msg.timestamp * 1000 > cutoffTime
    );
  }

  /**
   * Get console messages with optional filtering
   */
  getConsoleMessages(filters?: FilterOptions): ConsoleMessage[] {
    let messages = [...this.consoleMessages];

    if (filters) {
      if (filters.level) {
        messages = messages.filter((msg) => msg.level === filters.level);
      }
      if (filters.startTime) {
        messages = messages.filter((msg) => msg.timestamp * 1000 >= filters.startTime!);
      }
      if (filters.endTime) {
        messages = messages.filter((msg) => msg.timestamp * 1000 <= filters.endTime!);
      }
      if (filters.textContains) {
        const searchText = filters.textContains.toLowerCase();
        messages = messages.filter((msg) =>
          msg.text.toLowerCase().includes(searchText)
        );
      }
    }

    return messages;
  }

  /**
   * Clear all stored console messages
   */
  clearMessages(): void {
    this.consoleMessages = [];
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    connected: boolean;
    monitoring: boolean;
    targetId: string | null;
    messageCount: number;
  } {
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
  async disconnect(): Promise<void> {
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
let clientInstance: ChromeDevToolsClient | null = null;

export function getChromeClient(
  host?: string,
  port?: number,
  secure?: boolean
): ChromeDevToolsClient {
  if (!clientInstance) {
    clientInstance = new ChromeDevToolsClient(host, port, secure);
  }
  return clientInstance;
}

export function resetChromeClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}
