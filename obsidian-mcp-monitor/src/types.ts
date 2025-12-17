/**
 * Type definitions for Obsidian MCP Monitor
 */

export interface ConsoleLog {
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  url?: string;
  lineNumber?: number;
  stackTrace?: Array<{
    functionName: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  }>;
}

export interface NetworkRequest {
  requestId: string;
  timestamp: number;
  url: string;
  method: string;
  headers?: Record<string, string>;
  postData?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  timing?: {
    duration: number;
    sendStart: number;
    receiveHeadersEnd: number;
  };
}

export interface ObsidianFile {
  path: string;
  content: string;
  frontmatter?: Record<string, any>;
  tags?: string[];
}

export interface CDPConfig {
  host: string;
  port: number;
}

export interface ObsidianAPIConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface MonitoringState {
  isConnected: boolean;
  isMonitoring: boolean;
  targetId?: string;
  consoleLogsBuffer: ConsoleLog[];
  networkLogsBuffer: NetworkRequest[];
}

export type ResponseFormat = 'json' | 'markdown';
