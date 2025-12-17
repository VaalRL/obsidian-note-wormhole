/**
 * Response formatting utilities for console messages
 */

import type { ConsoleMessage, ConsoleLogs } from "../types.js";
import { CHARACTER_LIMIT } from "../constants.js";

/**
 * Format console messages as markdown
 */
export function formatConsoleMessagesMarkdown(
  logs: ConsoleMessage[],
  limit?: number
): string {
  if (!logs.length) {
    return "No console messages found.";
  }

  const displayLogs = limit ? logs.slice(0, limit) : logs;
  let output = `## Console Messages (${logs.length} total)\n\n`;

  for (const log of displayLogs) {
    const timestamp = new Date(log.timestamp * 1000).toISOString();
    const level = log.level.toUpperCase();
    const icon = getLevelIcon(log.level);

    output += `### ${icon} ${level} - ${timestamp}\n`;
    output += `**Source:** ${log.source}\n`;
    
    if (log.url) {
      output += `**File:** ${log.url}`;
      if (log.lineNumber) {
        output += `:${log.lineNumber}`;
      }
      output += `\n`;
    }

    output += `**Message:**\n\`\`\`\n${log.text}\n\`\`\`\n`;

    if (log.stackTrace && log.stackTrace.length > 0) {
      output += `**Stack Trace:**\n`;
      for (const frame of log.stackTrace.slice(0, 5)) {
        output += `  - ${frame.functionName || "(anonymous)"} at ${frame.url}:${frame.lineNumber}:${frame.columnNumber}\n`;
      }
    }

    output += `\n---\n\n`;
  }

  if (limit && logs.length > limit) {
    output += `\n_Showing ${limit} of ${logs.length} messages. Use limit parameter to see more._\n`;
  }

  if (output.length > CHARACTER_LIMIT) {
    const truncatePoint = CHARACTER_LIMIT - 200;
    output = output.substring(0, truncatePoint) + 
             `\n\n... [TRUNCATED - Response too long. ${output.length - truncatePoint} characters omitted. Use filters to narrow results.]`;
  }

  return output;
}

/**
 * Format console messages as JSON
 */
export function formatConsoleMessagesJSON(
  logs: ConsoleMessage[],
  limit?: number
): ConsoleLogs {
  const displayLogs = limit ? logs.slice(0, limit) : logs;

  return {
    total: logs.length,
    count: displayLogs.length,
    logs: displayLogs.map((log) => ({
      timestamp: log.timestamp,
      level: log.level,
      text: log.text,
      source: log.source,
      ...(log.url && { url: log.url }),
      ...(log.lineNumber && { lineNumber: log.lineNumber }),
      ...(log.stackTrace && { stackTrace: log.stackTrace }),
    })),
  };
}

/**
 * Get emoji icon for log level
 */
function getLevelIcon(level: ConsoleMessage["level"]): string {
  const icons: Record<ConsoleMessage["level"], string> = {
    log: "📝",
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
    debug: "🔍",
  };
  return icons[level] || "📄";
}

/**
 * Format target list as markdown
 */
export function formatTargetsMarkdown(targets: any[]): string {
  if (!targets.length) {
    return "No targets found. Make sure Chrome is running with remote debugging enabled.";
  }

  let output = `## Available Chrome Targets (${targets.length})\n\n`;

  const serviceWorkers = targets.filter(
    (t) => t.type === "service_worker" || t.description?.includes("service worker")
  );
  const extensions = targets.filter((t) => t.type === "page" && t.url.startsWith("chrome-extension://"));
  const others = targets.filter(
    (t) => !serviceWorkers.includes(t) && !extensions.includes(t)
  );

  if (serviceWorkers.length > 0) {
    output += `### Service Workers (${serviceWorkers.length})\n\n`;
    for (const target of serviceWorkers) {
      output += formatTargetEntry(target);
    }
  }

  if (extensions.length > 0) {
    output += `### Extensions (${extensions.length})\n\n`;
    for (const target of extensions) {
      output += formatTargetEntry(target);
    }
  }

  if (others.length > 0) {
    output += `### Other Targets (${others.length})\n\n`;
    for (const target of others) {
      output += formatTargetEntry(target);
    }
  }

  return output;
}

/**
 * Format a single target entry
 */
function formatTargetEntry(target: any): string {
  let entry = `**ID:** \`${target.id}\`\n`;
  entry += `**Type:** ${target.type}\n`;
  entry += `**Title:** ${target.title}\n`;
  entry += `**URL:** ${target.url}\n`;
  if (target.description) {
    entry += `**Description:** ${target.description}\n`;
  }
  entry += `\n`;
  return entry;
}

/**
 * Format status information as markdown
 */
export function formatStatusMarkdown(status: {
  connected: boolean;
  monitoring: boolean;
  targetId: string | null;
  messageCount: number;
}): string {
  let output = `## Service Worker Console Monitor Status\n\n`;
  output += `**Connected:** ${status.connected ? "✅ Yes" : "❌ No"}\n`;
  output += `**Monitoring:** ${status.monitoring ? "✅ Active" : "⏸️ Inactive"}\n`;
  output += `**Target ID:** ${status.targetId || "None"}\n`;
  output += `**Messages Buffered:** ${status.messageCount}\n`;
  return output;
}
