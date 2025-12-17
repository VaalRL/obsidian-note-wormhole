/**
 * Type definitions for Chrome Service Worker Console MCP Server
 */

export interface ConsoleMessage {
  timestamp: number;
  level: "log" | "info" | "warn" | "error" | "debug";
  text: string;
  source: string;
  url?: string;
  lineNumber?: number;
  stackTrace?: StackTraceFrame[];
  args?: any[];
}

export interface StackTraceFrame {
  functionName: string;
  scriptId: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
}

export interface ServiceWorkerInfo {
  id: string;
  url: string;
  versionId: string;
  status: string;
  scope: string;
}

export interface ChromeTarget {
  id: string;
  type: string;
  title: string;
  url: string;
  description?: string;
}

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

export interface ConsoleLogs {
  [key: string]: unknown;
  total: number;
  count: number;
  logs: ConsoleMessage[];
  serviceWorker?: ServiceWorkerInfo;
}

export interface ChromeConnection {
  host: string;
  port: number;
  secure: boolean;
}

export interface FilterOptions {
  level?: ConsoleMessage["level"];
  startTime?: number;
  endTime?: number;
  textContains?: string;
}
