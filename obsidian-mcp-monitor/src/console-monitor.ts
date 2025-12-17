/**
 * Console Monitor
 * Monitors console output from Obsidian
 */

import type { CDPClient } from './cdp-client.js';
import type { ConsoleLog } from './types.js';

const LOG_RETENTION_MS = 60 * 60 * 1000; // 1 hour

export class ConsoleMonitor {
  private cdpClient: CDPClient;
  private logs: ConsoleLog[] = [];
  private isMonitoring = false;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(cdpClient: CDPClient) {
    this.cdpClient = cdpClient;
  }

  /**
   * Start monitoring console messages
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    if (!this.cdpClient.isConnected()) {
      throw new Error('CDP client not connected');
    }

    const client = this.cdpClient.getClient();

    // Listen to console API calls
    client.Runtime.consoleAPICalled((params: any) => {
      const log: ConsoleLog = {
        timestamp: params.timestamp * 1000, // Convert to milliseconds
        level: params.type as ConsoleLog['level'],
        message: params.args.map((arg: any) => {
          if (arg.value !== undefined) {
            return String(arg.value);
          }
          if (arg.description) {
            return arg.description;
          }
          return arg.type;
        }).join(' '),
      };

      if (params.stackTrace) {
        log.stackTrace = params.stackTrace.callFrames.map((frame: any) => ({
          functionName: frame.functionName,
          url: frame.url,
          lineNumber: frame.lineNumber,
          columnNumber: frame.columnNumber,
        }));
      }

      this.logs.push(log);
    });

    // Listen to runtime exceptions
    client.Runtime.exceptionThrown((params: any) => {
      const exception = params.exceptionDetails;
      const log: ConsoleLog = {
        timestamp: exception.timestamp * 1000,
        level: 'error',
        message: exception.exception?.description || exception.text || 'Unknown error',
        url: exception.url,
        lineNumber: exception.lineNumber,
      };

      if (exception.stackTrace) {
        log.stackTrace = exception.stackTrace.callFrames.map((frame: any) => ({
          functionName: frame.functionName,
          url: frame.url,
          lineNumber: frame.lineNumber,
          columnNumber: frame.columnNumber,
        }));
      }

      this.logs.push(log);
    });

    this.isMonitoring = true;

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldLogs();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isMonitoring = false;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get console logs with optional filters
   */
  getLogs(options: {
    limit?: number;
    level?: ConsoleLog['level'];
    startTime?: number;
    endTime?: number;
    textContains?: string;
  } = {}): {
    total: number;
    count: number;
    logs: ConsoleLog[];
  } {
    let filtered = [...this.logs];

    // Filter by level
    if (options.level) {
      filtered = filtered.filter(log => log.level === options.level);
    }

    // Filter by time range
    if (options.startTime) {
      filtered = filtered.filter(log => log.timestamp >= options.startTime!);
    }
    if (options.endTime) {
      filtered = filtered.filter(log => log.timestamp <= options.endTime!);
    }

    // Filter by text
    if (options.textContains) {
      const searchText = options.textContains.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchText)
      );
    }

    const total = filtered.length;

    // Apply limit
    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(-options.limit); // Get last N items
    }

    return {
      total,
      count: filtered.length,
      logs: filtered,
    };
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    logCount: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      logCount: this.logs.length,
    };
  }

  /**
   * Clean up old logs (older than 1 hour)
   */
  private cleanupOldLogs(): void {
    const cutoffTime = Date.now() - LOG_RETENTION_MS;
    this.logs = this.logs.filter(log => log.timestamp > cutoffTime);
  }

  /**
   * Format logs as markdown
   */
  formatLogsAsMarkdown(logs: ConsoleLog[]): string {
    if (logs.length === 0) {
      return 'No console logs found.';
    }

    let markdown = `# Console Logs (${logs.length} entries)\n\n`;

    for (const log of logs) {
      const date = new Date(log.timestamp).toISOString();
      const level = log.level.toUpperCase();

      markdown += `## [${level}] ${date}\n`;
      markdown += `${log.message}\n`;

      if (log.url) {
        markdown += `- **Source:** ${log.url}`;
        if (log.lineNumber) {
          markdown += `:${log.lineNumber}`;
        }
        markdown += '\n';
      }

      if (log.stackTrace && log.stackTrace.length > 0) {
        markdown += '\n**Stack Trace:**\n';
        for (const frame of log.stackTrace) {
          markdown += `- ${frame.functionName || '(anonymous)'} at ${frame.url}:${frame.lineNumber}:${frame.columnNumber}\n`;
        }
      }

      markdown += '\n---\n\n';
    }

    return markdown;
  }
}
