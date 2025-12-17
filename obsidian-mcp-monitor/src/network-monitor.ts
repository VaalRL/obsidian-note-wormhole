/**
 * Network Monitor
 * Monitors network requests from Obsidian
 */

import type { CDPClient } from './cdp-client.js';
import type { NetworkRequest } from './types.js';

const LOG_RETENTION_MS = 60 * 60 * 1000; // 1 hour

export class NetworkMonitor {
  private cdpClient: CDPClient;
  private requests: Map<string, NetworkRequest> = new Map();
  private isMonitoring = false;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(cdpClient: CDPClient) {
    this.cdpClient = cdpClient;
  }

  /**
   * Start monitoring network requests
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    if (!this.cdpClient.isConnected()) {
      throw new Error('CDP client not connected');
    }

    const client = this.cdpClient.getClient();

    // Listen to request sent
    client.Network.requestWillBeSent((params: any) => {
      const request: NetworkRequest = {
        requestId: params.requestId,
        timestamp: params.timestamp * 1000,
        url: params.request.url,
        method: params.request.method,
        headers: params.request.headers,
        postData: params.request.postData,
      };

      this.requests.set(params.requestId, request);
    });

    // Listen to response received
    client.Network.responseReceived((params: any) => {
      const request = this.requests.get(params.requestId);
      if (request) {
        request.responseStatus = params.response.status;
        request.responseHeaders = params.response.headers;

        if (params.response.timing) {
          const timing = params.response.timing;
          request.timing = {
            duration: timing.receiveHeadersEnd - timing.sendStart,
            sendStart: timing.sendStart,
            receiveHeadersEnd: timing.receiveHeadersEnd,
          };
        }
      }
    });

    // Listen to loading finished
    client.Network.loadingFinished((params: any) => {
      const request = this.requests.get(params.requestId);
      if (request && params.encodedDataLength) {
        // Request completed, we could fetch response body here if needed
      }
    });

    // Listen to loading failed
    client.Network.loadingFailed((params: any) => {
      const request = this.requests.get(params.requestId);
      if (request) {
        request.responseStatus = 0;
        // Mark as failed
      }
    });

    this.isMonitoring = true;

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldRequests();
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
   * Get network requests with optional filters
   */
  getRequests(options: {
    limit?: number;
    method?: string;
    urlFilter?: string;
    statusCode?: number;
    startTime?: number;
    endTime?: number;
  } = {}): {
    total: number;
    count: number;
    requests: NetworkRequest[];
  } {
    let filtered = Array.from(this.requests.values());

    // Filter by method
    if (options.method) {
      filtered = filtered.filter(req =>
        req.method.toUpperCase() === options.method!.toUpperCase()
      );
    }

    // Filter by URL
    if (options.urlFilter) {
      const urlFilter = options.urlFilter.toLowerCase();
      filtered = filtered.filter(req =>
        req.url.toLowerCase().includes(urlFilter)
      );
    }

    // Filter by status code
    if (options.statusCode !== undefined) {
      filtered = filtered.filter(req => req.responseStatus === options.statusCode);
    }

    // Filter by time range
    if (options.startTime) {
      filtered = filtered.filter(req => req.timestamp >= options.startTime!);
    }
    if (options.endTime) {
      filtered = filtered.filter(req => req.timestamp <= options.endTime!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    const total = filtered.length;

    // Apply limit
    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      total,
      count: filtered.length,
      requests: filtered,
    };
  }

  /**
   * Clear all requests
   */
  clearRequests(): void {
    this.requests.clear();
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    requestCount: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      requestCount: this.requests.size,
    };
  }

  /**
   * Clean up old requests (older than 1 hour)
   */
  private cleanupOldRequests(): void {
    const cutoffTime = Date.now() - LOG_RETENTION_MS;
    for (const [id, request] of this.requests.entries()) {
      if (request.timestamp < cutoffTime) {
        this.requests.delete(id);
      }
    }
  }

  /**
   * Format requests as markdown
   */
  formatRequestsAsMarkdown(requests: NetworkRequest[]): string {
    if (requests.length === 0) {
      return 'No network requests found.';
    }

    let markdown = `# Network Requests (${requests.length} entries)\n\n`;

    for (const req of requests) {
      const date = new Date(req.timestamp).toISOString();
      const status = req.responseStatus !== undefined ? req.responseStatus : 'pending';
      const duration = req.timing?.duration ? `${req.timing.duration.toFixed(2)}ms` : 'N/A';

      markdown += `## ${req.method} ${status !== 'pending' ? `[${status}]` : '[PENDING]'}\n`;
      markdown += `**Time:** ${date}\n`;
      markdown += `**URL:** ${req.url}\n`;
      markdown += `**Duration:** ${duration}\n`;

      if (req.headers && Object.keys(req.headers).length > 0) {
        markdown += '\n**Request Headers:**\n';
        for (const [key, value] of Object.entries(req.headers)) {
          markdown += `- ${key}: ${value}\n`;
        }
      }

      if (req.postData) {
        markdown += `\n**Post Data:**\n\`\`\`\n${req.postData}\n\`\`\`\n`;
      }

      if (req.responseHeaders && Object.keys(req.responseHeaders).length > 0) {
        markdown += '\n**Response Headers:**\n';
        for (const [key, value] of Object.entries(req.responseHeaders)) {
          markdown += `- ${key}: ${value}\n`;
        }
      }

      markdown += '\n---\n\n';
    }

    return markdown;
  }
}
